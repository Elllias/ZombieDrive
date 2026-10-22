import { randomUUID } from 'node:crypto';

import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { Pool } from 'pg';
import { z } from 'zod';
import { beforeAll, afterAll, it, expect } from 'vitest';

import { ProgressSchema, type Progress, type Purchase, type Run } from '@zombie-drive/shared';

import { createApp } from '../apps/api/src/createApp';
import { migrate } from '../apps/api/src/database/migrate';
import { transaction } from '../apps/api/src/database/transaction';

import { start, send } from './api.helpers';
import { finishFirst, select, earnStageFunds } from './stages-api.helpers';

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

function buy(cookie: string, payload: Purchase): Promise<LightMyRequestResponse> {
    return send(app(), cookie, { method: 'POST', url: '/api/purchases', payload });
}

async function newTruck(): Promise<string> {
    const { cookie } = await finishFirst(app(), pool);

    await select(app(), cookie, 'industrial');
    await earnStageFunds(app(), pool, cookie);

    return cookie;
}

async function progress(cookie: string): Promise<Progress> {
    const reply = await send(app(), cookie, { url: '/api/progress' });
    const data: unknown = reply.json();

    return ProgressSchema.parse(data);
}

it('charges once, rejects further plow tiers and retries the original purchase', async (): Promise<void> => {
    const cookie = await newTruck();
    const payload: Purchase = { stageId: 'industrial', key: randomUUID(), upgrade: 'plow', expectedLevel: 0 };

    expect((await buy(cookie, payload)).statusCode).toBe(200);
    expect((await buy(cookie, { ...payload, key: randomUUID(), expectedLevel: 1 })).statusCode).toBe(409);
    expect((await buy(cookie, { ...payload, key: randomUUID() })).statusCode).toBe(409);
    expect((await buy(cookie, payload)).statusCode).toBe(200);

    const purchased = await progress(cookie);
    const run = await start(app(), cookie);

    expect(purchased.balance).toBe(3522);
    expect(purchased.upgrades.plow).toBe(1);
    expect(run.stats.plowLevel).toBe(1);
});

async function seedLegacyPurchase(run: Run, key: string, level: number): Promise<void> {
    const upgrades = { engine: 3, tank: 4, tires: 2, suspension: 1, plow: level };

    await transaction(pool, async (client): Promise<void> => {
        await client.query('LOCK TABLE players IN ROW EXCLUSIVE MODE');

        await client.query(`UPDATE stage_progress SET upgrades = $2 WHERE stage_id = 'industrial'
            AND player_id = (SELECT player_id FROM runs WHERE id = $1)`, [ run.id, upgrades ]);

        await client.query(`UPDATE runs SET stats = jsonb_set(stats, '{plowLevel}', to_jsonb($2::integer)),
            configuration_version = 'prototype-11' WHERE id = $1`, [ run.id, level ]);

        await client.query(`INSERT INTO purchases (player_id, request_key, upgrade, expected_level, cost, stage_id)
            SELECT player_id, $2, 'plow', $3, 1000, 'industrial' FROM runs WHERE id = $1`, [ run.id, key, level - 1 ]);
    });
}

it.each([ 1, 2, 3, 4, 5 ])('migrates legacy plow %i without changing funds, parts or active snapshots',
    async (level): Promise<void> => {
        const cookie = await newTruck();
        const run = await start(app(), cookie);
        const key = randomUUID();

        await seedLegacyPurchase(run, key, level);
        await migrate(pool);
        await migrate(pool);

        const saved = await progress(cookie);

        expect(saved.balance).toBe(9522);
        expect(saved.upgrades).toEqual({ engine: 3, tank: 4, tires: 2, suspension: 1, plow: 1 });
        expect(saved.activeRun?.stats.plowLevel).toBe(level);
        expect(saved.activeRun?.configurationVersion).toBe('prototype-11');

        expect((await buy(cookie, { stageId: 'industrial', key, upgrade: 'plow', expectedLevel: level - 1 })).statusCode)
            .toBe(200);

        const finished = await send(app(), cookie, { method: 'POST',
            url: `/api/runs/${ run.id }/finish`,
            payload: { distance: 0, elapsedSeconds: 0, killedZombieIds: [], reason: 'abandon' } });

        expect(finished.statusCode).toBe(200);
        expect((await progress(cookie)).balance).toBe(9522);
    });
