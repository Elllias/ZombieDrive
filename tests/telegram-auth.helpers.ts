import { createHmac, randomInt } from 'node:crypto';

import type { FastifyInstance } from 'fastify';

import { ProgressSchema, type Progress } from '@zombie-drive/shared';

import type { TelegramUser } from '../apps/api/src/auth/validateTelegramData';

import { readCookie, send } from './api.helpers';

// Deliberately fictitious bot credentials, used only to sign test fixtures.
export const TEST_BOT_TOKEN = '123456789:test-secret-for-authentication';

export function telegramUser(): TelegramUser {
    return { id: 2 ** 40 + randomInt(1000000000), first_name: 'Игрок', username: 'test_driver' };
}

export function signedTelegramData(user: TelegramUser, fields: Record<string, string> = {}): string {
    const parameters = new URLSearchParams({
        auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify(user), ...fields,
    });

    parameters.sort();

    const data = Array.from(parameters, ([ key, value ]) => `${ key }=${ value }`).join('\n');
    const secret = createHmac('sha256', 'WebAppData').update(TEST_BOT_TOKEN).digest();
    const hash = createHmac('sha256', secret).update(data).digest('hex');

    parameters.set('hash', hash);

    return parameters.toString();
}

export async function telegramCookie(app: FastifyInstance, user: TelegramUser, cookie?: string): Promise<string> {
    const reply = await app.inject({
        method: 'POST',
        url: '/api/session',
        headers: { origin: 'http://localhost:5173', ...(cookie ? { cookie } : {}) },
        payload: { initData: signedTelegramData(user) },
    });

    if (reply.statusCode !== 200) {
        throw new Error(`Telegram session failed: ${ reply.statusCode }: ${ reply.body }`);
    }

    return readCookie(reply);
}

export async function progress(app: FastifyInstance, cookie: string): Promise<Progress> {
    const reply = await send(app, cookie, { url: '/api/progress' });
    const data: unknown = reply.json();

    return ProgressSchema.parse(data);
}
