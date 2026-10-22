import { setTimeout } from 'node:timers/promises';

import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { z } from 'zod';

import { ProgressSchema, SettlementSchema, type Progress, type Run, type StageId, type Settlement } from '@zombie-drive/shared';

import { guest, start, send } from './api.helpers';

export async function finishFirst(app: FastifyInstance, pool: Pool): Promise<{ cookie: string; run: Run }> {
    const cookie = await guest(app);
    const run = await start(app, cookie);

    await pool.query("UPDATE runs SET started_at = now() - interval '160 seconds' WHERE id = $1", [ run.id ]);

    const reply = await send(app, cookie, {
        method: 'POST',
        url: `/api/runs/${ run.id }/finish`,
        payload: { distance: 1740, elapsedSeconds: 150, killedZombieIds: [], reason: 'finish' },
    });

    const result: unknown = reply.json();

    SettlementSchema.parse(result);

    return { cookie, run };
}

export async function select(app: FastifyInstance, cookie: string, stageId: StageId): Promise<Progress> {
    const result = await send(app, cookie, {
        method: 'POST', url: '/api/stages/select', payload: { stageId },
    });

    const data: unknown = result.json();

    return ProgressSchema.parse(data);
}

export async function waitForMigrationLock(pool: Pool): Promise<void> {
    const deadline = Date.now() + 5000;

    while (Date.now() < deadline) {
        const result = await pool.query(`SELECT EXISTS (
            SELECT 1 FROM pg_locks WHERE relation = 'players'::regclass
                AND mode = 'AccessExclusiveLock' AND NOT granted
        ) AS waiting`);

        const row = z.object({ waiting: z.boolean() }).parse(result.rows[0]);

        if (row.waiting) {
            return;
        }

        await setTimeout(10);
    }

    throw new Error('Migration did not wait for the player transaction');
}

export async function earnStageFunds(app: FastifyInstance, pool: Pool, cookie: string): Promise<Settlement> {
    const run = await start(app, cookie);

    await pool.query("UPDATE runs SET started_at = now() - interval '31 seconds' WHERE id = $1", [ run.id ]);

    const response = await send(app, cookie, {
        method: 'POST',
        url: `/api/runs/${ run.id }/finish`,
        payload: { distance: 300, elapsedSeconds: 30, killedZombieIds: [], reason: 'fuel' },
    });

    const data: unknown = response.json();

    return SettlementSchema.parse(data);
}
