import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { z } from 'zod';
import { beforeAll, afterAll, it, expect } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { ProgressSchema, SettlementSchema, stageConfig, nextStageId } from '@zombie-drive/shared';

import { createApp } from '../apps/api/src/createApp';
import { migrate } from '../apps/api/src/database/migrate';
import { transaction } from '../apps/api/src/database/transaction';

import { start, send } from './api.helpers';
import { finishFirst, select, earnStageFunds } from './stages-api.helpers';
import { finishSecond } from './third-stage-api.helpers';

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

it('keeps the pass locked until the second finish', async (): Promise<void> => {
    const { cookie } = await finishFirst(app(), pool);
    const reply = await send(app(), cookie, { method: 'POST', url: '/api/stages/select', payload: { stageId: 'pass' } });

    expect(reply.statusCode).toBe(409);
    expect((await select(app(), cookie, 'industrial')).stages).toHaveLength(2);
});

it('unlocks the R8 for free once with separate parts and the shared balance', async (): Promise<void> => {
    const { cookie, run } = await finishSecond(app(), pool);
    const progress = await select(app(), cookie, 'pass');
    const payload = { key: randomUUID(), stageId: 'pass', upgrade: 'plow', expectedLevel: 0 };

    expect(progress.balance).toBe(63522);
    expect(progress.upgrades).toEqual({ engine: 0, tank: 0, tires: 0, suspension: 0, plow: 0 });
    expect((await send(app(), cookie, { method: 'POST', url: '/api/purchases', payload })).statusCode).toBe(409);
    await earnStageFunds(app(), pool, cookie);
    expect((await send(app(), cookie, { method: 'POST', url: '/api/purchases', payload })).statusCode).toBe(200);
    expect((await send(app(), cookie, { method: 'POST', url: '/api/purchases', payload })).statusCode).toBe(200);
    expect((await select(app(), cookie, 'pass')).balance).toBe(513522);
    expect((await select(app(), cookie, 'industrial')).upgrades.plow).toBe(0);

    await send(app(), cookie, { method: 'POST',
        url: `/api/runs/${ run.id }/finish`,
        payload: { distance: 2100, elapsedSeconds: 160, killedZombieIds: [], reason: 'finish' } });

    const saved = await select(app(), cookie, 'pass');

    expect(saved.upgrades.plow).toBe(1);
    expect(saved.balance).toBe(513522);
    expect(saved.stages?.filter((stage) => stage.stageId === 'pass')).toHaveLength(1);
});

it('starts a stage-specific R8 run and settles all 90 zombies exactly once', async (): Promise<void> => {
    const { cookie } = await finishSecond(app(), pool);

    await select(app(), cookie, 'pass');

    const run = await start(app(), cookie);

    const payload = { distance: 2400,
        elapsedSeconds: 160,
        reason: 'finish',
        killedZombieIds: stageConfig('pass').zombies.map((zombie) => zombie.id) };

    await pool.query("UPDATE runs SET started_at = now() - interval '170 seconds' WHERE id = $1", [ run.id ]);

    const first: unknown = (await send(app(), cookie, { method: 'POST',
        url: `/api/runs/${ run.id }/finish`,
        payload })).json();

    const retry: unknown = (await send(app(), cookie, { method: 'POST',
        url: `/api/runs/${ run.id }/finish`,
        payload })).json();

    expect(run.stats.vehicleId).toBe('r8');
    expect(run.stageId).toBe('pass');
    expect(SettlementSchema.parse(first).reward).toBe(24480000);
    expect(SettlementSchema.parse(retry).progress.balance).toBe(24543522);
    expect(nextStageId('pass')).toBeNull();
});

it('migrates historical second-stage finishes without replacing current progress or active runs',
    async (): Promise<void> => {
        const { cookie, run } = await finishSecond(app(), pool);

        await seedHistoricalFinish(run.id);

        const active = await start(app(), cookie);

        await migrate(pool);
        await migrate(pool);

        const data: unknown = (await send(app(), cookie, { url: '/api/progress' })).json();
        const saved = ProgressSchema.parse(data);

        expect(saved.balance).toBe(63522);
        expect(saved.stageId).toBe('industrial');
        expect(saved.activeRun).toEqual(active);
        expect(saved.upgrades).toEqual({ engine: 3, tank: 4, tires: 2, suspension: 1, plow: 1 });
        expect(saved.stages?.find((stage) => stage.stageId === 'pass')?.bestDistance).toBe(0);
        expect(saved.stages?.filter((stage) => stage.stageId === 'pass')).toHaveLength(1);
    });

async function seedHistoricalFinish(runId: string): Promise<void> {
    await transaction(pool, async (client): Promise<void> => {
        await client.query('LOCK TABLE players IN ROW EXCLUSIVE MODE');

        await client.query("DELETE FROM stage_progress WHERE stage_id = 'pass' AND player_id = "
            + '(SELECT player_id FROM runs WHERE id = $1)', [ runId ]);

        await client.query(`UPDATE runs SET report = jsonb_set(report, '{distance}', '800'::jsonb),
            configuration_version = 'prototype-11' WHERE id = $1`, [ runId ]);

        await client.query(`UPDATE stage_progress SET completed = false, best_distance = 800,
            upgrades = '{"engine":3,"tank":4,"tires":2,"suspension":1,"plow":1}'
            WHERE stage_id = 'industrial' AND player_id = (SELECT player_id FROM runs WHERE id = $1)`, [ runId ]);
    });
}
