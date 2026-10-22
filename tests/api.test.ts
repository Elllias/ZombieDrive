import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { z } from 'zod';
import { beforeAll, afterAll, it, expect } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { ProgressSchema, SettlementSchema } from '@zombie-drive/shared';

import { createApp } from '../apps/api/src/createApp';
import { migrate } from '../apps/api/src/database/migrate';

import { guest, start, send, earnRewards, VALID_REPORT } from './api.helpers';

const pool = new Pool({ connectionString: z.string().parse(process.env.DATABASE_URL) });

let application: FastifyInstance | null = null;

function app(): FastifyInstance {
    if (!application) {
        throw new Error('API test app is not ready');
    }

    return application;
}

beforeAll(async (): Promise<void> => {
    await migrate(pool);
    application = await createApp({ pool, origin: 'http://localhost:5173' });
});

afterAll(async (): Promise<void> => {
    await application?.close();
    await pool.end();
});

it('requires a guest cookie to read progress', async (): Promise<void> => {
    expect((await app().inject('/api/progress')).statusCode).toBe(401);

    const cookie = await guest(app());
    const response = await send(app(), cookie, { url: '/api/progress' });
    const data: unknown = response.json();

    expect(ProgressSchema.parse(data).balance).toBe(0);
});

it('retries a start without creating another run', async (): Promise<void> => {
    const cookie = await guest(app());
    const key = randomUUID();
    const first = await start(app(), cookie, key);

    expect((await start(app(), cookie, key)).id).toBe(first.id);
});

it('allows only one concurrent active run', async (): Promise<void> => {
    const cookie = await guest(app());

    const replies = await Promise.all(
        [ randomUUID(), randomUUID() ].map((key) =>
            send(app(), cookie, { method: 'POST', url: '/api/runs', payload: { key } }),
        ),
    );

    expect(replies.map((reply) => reply.statusCode).sort()).toEqual([ 200, 409 ]);
});

it('credits distance and kills exactly once under concurrent completion', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);

    const replies = await Promise.all(
        [ 1, 2 ].map(() =>
            send(app(), cookie, { method: 'POST', url: `/api/runs/${ run.id }/finish`, payload: VALID_REPORT }),
        ),
    );

    for (const reply of replies) {
        expect(reply.statusCode).toBe(200);

        const data: unknown = reply.json();

        expect(SettlementSchema.parse(data).reward).toBe(20);
    }

    const progress: unknown = (await send(app(), cookie, { url: '/api/progress' })).json();

    expect(ProgressSchema.parse(progress).balance).toBe(20);
});

it('rejects duplicate and unknown zombie identifiers', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);

    for (const killedZombieIds of [ [ 'zombie-0', 'zombie-0' ], [ 'invented' ] ]) {
        const reply = await send(app(), cookie, {
            method: 'POST',
            url: `/api/runs/${ run.id }/finish`,
            payload: { ...VALID_REPORT, killedZombieIds },
        });

        expect(reply.statusCode).toBe(422);
    }
});

it('rejects impossible distance and nonfinite payload values', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);

    expect(
        (
            await send(app(), cookie, {
                method: 'POST',
                url: `/api/runs/${ run.id }/finish`,
                payload: { ...VALID_REPORT, distance: 1000 },
            })
        ).statusCode,
    ).toBe(422);

    expect(
        (
            await send(app(), cookie, {
                method: 'POST',
                url: `/api/runs/${ run.id }/finish`,
                payload: { ...VALID_REPORT, distance: null },
            })
        ).statusCode,
    ).toBe(400);
});

it('does not reward a deliberately abandoned run', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);

    const data: unknown = (
        await send(app(), cookie, {
            method: 'POST',
            url: `/api/runs/${ run.id }/finish`,
            payload: { ...VALID_REPORT, reason: 'abandon' },
        })
    ).json();

    expect(SettlementSchema.parse(data).progress.balance).toBe(0);
});

it('does not reward an expired run', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);

    await pool.query("UPDATE runs SET expires_at = now() - interval '1 second' WHERE id = $1", [ run.id ]);

    const data: unknown = (
        await send(app(), cookie, {
            method: 'POST',
            url: `/api/runs/${ run.id }/finish`,
            payload: VALID_REPORT,
        })
    ).json();

    expect(SettlementSchema.parse(data).reward).toBe(0);
});

it('prevents another guest from finishing a run', async (): Promise<void> => {
    const owner = await guest(app());
    const run = await start(app(), owner);
    const other = await guest(app());

    expect(
        (
            await send(app(), other, {
                method: 'POST',
                url: `/api/runs/${ run.id }/finish`,
                payload: VALID_REPORT,
            })
        ).statusCode,
    ).toBe(404);
});

it('rejects a purchase without enough earnings and preserves the balance', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);

    await send(app(), cookie, { method: 'POST', url: `/api/runs/${ run.id }/finish`, payload: VALID_REPORT });

    const reply = await send(app(), cookie, {
        method: 'POST',
        url: '/api/purchases',
        payload: { key: randomUUID(), upgrade: 'engine', expectedLevel: 0 },
    });

    const current: unknown = (await send(app(), cookie, { url: '/api/progress' })).json();
    const progress = ProgressSchema.parse(current);

    expect(reply.statusCode).toBe(409);
    expect(progress.balance).toBe(20);
    expect(progress.upgrades.engine).toBe(0);
});

it('applies a purchase once and prevents concurrent level changes', async (): Promise<void> => {
    const cookie = await guest(app());

    await earnRewards(app(), cookie, 3);

    const payload = { key: randomUUID(), upgrade: 'engine', expectedLevel: 0 };
    const first = await send(app(), cookie, { method: 'POST', url: '/api/purchases', payload });

    expect(first.statusCode).toBe(200);

    const retry = await send(app(), cookie, { method: 'POST', url: '/api/purchases', payload });
    const data: unknown = retry.json();

    expect(ProgressSchema.parse(data).balance).toBe(30);

    const replies = await Promise.all(
        [ 1, 2 ].map(() =>
            send(app(), cookie, {
                method: 'POST',
                url: '/api/purchases',
                payload: { key: randomUUID(), upgrade: 'tires', expectedLevel: 0 },
            }),
        ),
    );

    expect(replies.map((reply) => reply.statusCode).sort()).toEqual([ 200, 409 ]);

    const current: unknown = (await send(app(), cookie, { url: '/api/progress' })).json();

    expect(ProgressSchema.parse(current).balance).toBe(5);
    expect(ProgressSchema.parse(current).upgrades).toMatchObject({ engine: 1, tires: 1 });
});

it('blocks writes from a different web origin', async (): Promise<void> => {
    const response = await app().inject({
        method: 'POST',
        url: '/api/session',
        payload: {},
        headers: { origin: 'https://other.example' },
    });

    expect(response.statusCode).toBe(403);
});

it('uses the stored economy even when current settings differ', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);

    await pool.query(
        "UPDATE runs SET rules = jsonb_set(jsonb_set(rules, '{distanceRate}', '3'), '{killRate}', '40') WHERE id = $1",
        [ run.id ],
    );

    const data: unknown = (
        await send(app(), cookie, {
            method: 'POST',
            url: `/api/runs/${ run.id }/finish`,
            payload: VALID_REPORT,
        })
    ).json();

    expect(SettlementSchema.parse(data).reward).toBe(200);
});
