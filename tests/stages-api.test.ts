import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { z } from 'zod';
import { beforeAll, afterAll, it, expect } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { ProgressSchema, SettlementSchema } from '@zombie-drive/shared';

import { createApp } from '../apps/api/src/createApp';
import { migrate } from '../apps/api/src/database/migrate';

import { guest, start, send, VALID_REPORT } from './api.helpers';
import { finishFirst, select, earnStageFunds, waitForMigrationLock } from './stages-api.helpers';

const pool = new Pool({ connectionString: z.string().parse(process.env.DATABASE_URL) });
let application: FastifyInstance | null = null;

function app(): FastifyInstance {
    if (!application) {
        throw new Error('Test application not ready');
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

it('keeps the second stage locked for a new guest', async (): Promise<void> => {
    const cookie = await guest(app());

    const reply = await send(app(), cookie, {
        method: 'POST', url: '/api/stages/select', payload: { stageId: 'industrial' },
    });

    expect(reply.statusCode).toBe(409);
    expect((await select(app(), cookie, 'hills')).stages).toHaveLength(1);
});

it('unlocks the truck for free once and preserves separate upgrades on switching', async (): Promise<void> => {
    const { cookie, run } = await finishFirst(app(), pool);
    const unlocked = await select(app(), cookie, 'industrial');

    expect(unlocked.balance).toBe(522);
    expect(unlocked.upgrades.plow).toBe(0);

    const payload = { stageId: 'industrial', key: randomUUID(), upgrade: 'plow', expectedLevel: 0 };

    expect((await send(app(), cookie, { method: 'POST', url: '/api/purchases', payload })).statusCode).toBe(409);
    await earnStageFunds(app(), pool, cookie);
    expect((await send(app(), cookie, { method: 'POST', url: '/api/purchases', payload })).statusCode).toBe(200);
    await send(app(), cookie, { method: 'POST', url: '/api/purchases', payload });

    const truck = await select(app(), cookie, 'industrial');
    const first = await select(app(), cookie, 'hills');

    expect(truck.balance).toBe(3522);
    expect(truck.upgrades.plow).toBe(1);
    expect(first.upgrades).toEqual({ engine: 0, tank: 0, tires: 0, suspension: 0 });
    expect(first.bestDistance).toBe(1740);
    await send(app(), cookie, { method: 'POST', url: `/api/runs/${ run.id }/finish`, payload: VALID_REPORT });
    expect((await select(app(), cookie, 'industrial')).upgrades.plow).toBe(1);
});

it('starts the truck with stage rules and prevents changing stage during a run', async (): Promise<void> => {
    const { cookie } = await finishFirst(app(), pool);

    await select(app(), cookie, 'industrial');

    const run = await start(app(), cookie);

    const reply = await send(app(), cookie, {
        method: 'POST', url: '/api/stages/select', payload: { stageId: 'hills' },
    });

    expect(run.stageId).toBe('industrial');
    expect(run.stats.vehicleId).toBe('truck');
    expect(reply.statusCode).toBe(409);
});

it('rewards heavy zombies using the stored multiplier exactly once', async (): Promise<void> => {
    const { cookie } = await finishFirst(app(), pool);

    await select(app(), cookie, 'industrial');

    const run = await start(app(), cookie);
    const payload = { ...VALID_REPORT, killedZombieIds: [ 'industrial-zombie-0', 'industrial-zombie-1' ] };
    const reply = await send(app(), cookie, { method: 'POST', url: `/api/runs/${ run.id }/finish`, payload });
    const retry = await send(app(), cookie, { method: 'POST', url: `/api/runs/${ run.id }/finish`, payload });
    const first: unknown = reply.json();
    const again: unknown = retry.json();

    expect(SettlementSchema.parse(first).reward).toBe(2400);
    expect(SettlementSchema.parse(again).progress.balance).toBe(2922);
});

it('rejects stale purchases for another stage and a plow on the SUV', async (): Promise<void> => {
    const { cookie } = await finishFirst(app(), pool);

    const plow = await send(app(), cookie, { method: 'POST',
        url: '/api/purchases',
        payload: { key: randomUUID(), upgrade: 'plow', expectedLevel: 0 } });

    await select(app(), cookie, 'industrial');

    const stale = await send(app(), cookie, { method: 'POST',
        url: '/api/purchases',
        payload: { stageId: 'hills', key: randomUUID(), upgrade: 'engine', expectedLevel: 0 } });

    const current: unknown = (await send(app(), cookie, { url: '/api/progress' })).json();

    expect(plow.statusCode).toBe(409);
    expect(stale.statusCode).toBe(409);
    expect(ProgressSchema.parse(current).balance).toBe(522);
});

it('migrates existing progress without replacing balance or first-stage upgrades', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);

    await pool.query(`UPDATE players SET balance = 12345, best_distance = 1740,
        upgrades = '{"engine":5,"tank":4,"tires":3,"suspension":2}' WHERE id =
        (SELECT player_id FROM runs WHERE id = $1)`, [ run.id ]);

    await send(app(), cookie, { method: 'POST',
        url: `/api/runs/${ run.id }/finish`,
        payload: { distance: 0, elapsedSeconds: 0, killedZombieIds: [], reason: 'abandon' } });

    await migrate(pool);
    await migrate(pool);

    const first = await select(app(), cookie, 'hills');
    const truck = await select(app(), cookie, 'industrial');

    expect(first.balance).toBe(12345);
    expect(first.upgrades).toEqual({ engine: 5, tank: 4, tires: 3, suspension: 2 });
    expect(truck.upgrades).toEqual({ engine: 0, tank: 0, tires: 0, suspension: 0, plow: 0 });
});

it('lets an active player transaction complete while migration waits without a deadlock', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(`SELECT id FROM players WHERE id =
            (SELECT player_id FROM runs WHERE id = $1) FOR UPDATE`, [ run.id ]);

        const migrating = migrate(pool);

        await waitForMigrationLock(pool);
        await client.query('UPDATE runs SET reward = 0 WHERE id = $1', [ run.id ]);
        await client.query('COMMIT');
        await migrating;
    } finally {
        await client.query('ROLLBACK');
        client.release();
    }
});
