import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { z } from 'zod';
import { afterAll, beforeAll, expect, it } from 'vitest';

import { createApp } from '../apps/api/src/createApp';
import { migrate } from '../apps/api/src/database/migrate';
import { hashSession } from '../apps/api/src/auth/sessionStore';

import { earnRewards, guest, send, start, VALID_REPORT } from './api.helpers';
import { progress, signedTelegramData, telegramCookie, telegramUser, TEST_BOT_TOKEN } from './telegram-auth.helpers';

const pool = new Pool({ connectionString: z.string().parse(process.env.DATABASE_URL) });

let application: FastifyInstance | null = null;

function app(): FastifyInstance {
    if (!application) {
        throw new Error('Telegram auth application is not ready');
    }

    return application;
}

beforeAll(async (): Promise<void> => {
    await migrate(pool);
    application = await createApp({ pool, origin: 'http://localhost:5173', telegramBotToken: TEST_BOT_TOKEN });
});

afterAll(async (): Promise<void> => {
    await application?.close();
    await pool.end();
});

it('links guest progress and allows its pending run to finish after upgrading the session', async (): Promise<void> => {
    const anonymous = await guest(app());
    const user = telegramUser();

    await earnRewards(app(), anonymous, 1);

    const run = await start(app(), anonymous);
    const before = await progress(app(), anonymous);
    const linked = await telegramCookie(app(), user, anonymous);

    expect(await progress(app(), linked)).toEqual(before);
    expect((await send(app(), anonymous, { url: '/api/progress' })).statusCode).toBe(401);

    expect((await send(app(), linked, {
        method: 'POST', url: `/api/runs/${ run.id }/finish`, payload: VALID_REPORT,
    })).statusCode).toBe(200);

    expect((await progress(app(), await telegramCookie(app(), user))).balance).toBe(40);
});

it('keeps both device sessions valid and reuses an existing device cookie', async (): Promise<void> => {
    const user = telegramUser();
    const phone = await telegramCookie(app(), user);
    const computer = await telegramCookie(app(), user);

    await earnRewards(app(), phone, 1);
    expect(await telegramCookie(app(), user, phone)).toBe(phone);
    expect((await progress(app(), computer)).balance).toBe(20);
    expect((await progress(app(), phone)).balance).toBe(20);
});

it('updates profile labels without treating username as the identity', async (): Promise<void> => {
    const user = telegramUser();
    const first = await telegramCookie(app(), user);

    await earnRewards(app(), first, 1);

    const second = await telegramCookie(app(), { ...user, first_name: 'Новое имя', username: undefined });

    const saved = await pool.query('SELECT telegram_first_name, telegram_username FROM players WHERE telegram_id = $1',
        [ String(user.id) ]);

    expect(saved.rows[0]).toEqual({ telegram_first_name: 'Новое имя', telegram_username: null });
    expect((await progress(app(), second)).balance).toBe(20);
});

it('opens an existing Telegram profile without merging another guest balance', async (): Promise<void> => {
    const user = telegramUser();
    const original = await telegramCookie(app(), user);
    const anonymous = await guest(app());

    await earnRewards(app(), original, 1);
    await earnRewards(app(), anonymous, 2);

    const linked = await telegramCookie(app(), user, anonymous);

    expect((await progress(app(), linked)).balance).toBe(20);
    expect((await progress(app(), anonymous)).balance).toBe(40);
});

it('does not overwrite another Telegram account when the device switches users', async (): Promise<void> => {
    const first = await telegramCookie(app(), telegramUser());

    await earnRewards(app(), first, 1);

    const second = await telegramCookie(app(), telegramUser(), first);

    expect((await progress(app(), second)).balance).toBe(0);
    expect((await progress(app(), first)).balance).toBe(20);
});

it('serializes concurrent first logins and creates only one account', async (): Promise<void> => {
    const user = telegramUser();
    const anonymous = await guest(app());

    const sessions = await Promise.all([
        telegramCookie(app(), user, anonymous), telegramCookie(app(), user, anonymous),
    ]);

    const records = await pool.query('SELECT id FROM players WHERE telegram_id = $1', [ String(user.id) ]);

    expect(records.rows).toHaveLength(1);

    await Promise.all(sessions.map(async (cookie): Promise<void> => {
        expect((await send(app(), cookie, { url: '/api/progress' })).statusCode).toBe(200);
    }));
});

it('keeps expired device sessions expired when another device is active', async (): Promise<void> => {
    const user = telegramUser();
    const expired = await telegramCookie(app(), user);
    const current = await telegramCookie(app(), user);
    const token = expired.split('=')[1] ?? '';

    await pool.query("UPDATE player_sessions SET last_seen = now() - interval '31 days' WHERE session_hash = $1",
        [ hashSession(token) ]);

    await telegramCookie(app(), user, current);
    expect((await send(app(), expired, { url: '/api/progress' })).statusCode).toBe(401);
    expect((await send(app(), current, { url: '/api/progress' })).statusCode).toBe(200);
});

it('backfills a legacy guest cookie and preserves its progress across repeated migrations', async (): Promise<void> => {
    const id = randomUUID();
    const token = randomUUID();
    const cookie = `zombie_session=${ token }`;

    await pool.query('INSERT INTO players(id, session_hash, balance) VALUES($1, $2, 321)', [ id, hashSession(token) ]);
    await migrate(pool);
    expect((await progress(app(), cookie)).balance).toBe(321);

    const linked = await telegramCookie(app(), telegramUser(), cookie);

    await migrate(pool);
    expect((await progress(app(), linked)).balance).toBe(321);
    expect((await send(app(), cookie, { url: '/api/progress' })).statusCode).toBe(401);
});

it('rejects a forged Telegram launch even when a valid guest cookie is present', async (): Promise<void> => {
    const anonymous = await guest(app());
    const parameters = new URLSearchParams(signedTelegramData(telegramUser()));

    parameters.set('hash', '0'.repeat(64));

    const rejected = await send(app(), anonymous, {
        method: 'POST', url: '/api/session', payload: { initData: parameters.toString() },
    });

    expect(rejected.statusCode).toBe(401);
    expect((await progress(app(), anonymous)).balance).toBe(0);
});

it('rejects a plain client-supplied Telegram identifier', async (): Promise<void> => {
    const reply = await app().inject({ method: 'POST', url: '/api/session', payload: { telegramId: 1234 } });

    expect(reply.statusCode).toBe(400);
});

it('reports a missing server token and still supports development guests', async (): Promise<void> => {
    const unconfigured = await createApp({ pool, origin: 'http://localhost:5173' });

    try {
        const reply = await unconfigured.inject({
            method: 'POST', url: '/api/session', payload: { initData: signedTelegramData(telegramUser()) },
        });

        expect(reply.statusCode).toBe(503);
        expect(await guest(unconfigured)).toMatch(/^zombie_session=/);
    } finally {
        await unconfigured.close();
    }
});
