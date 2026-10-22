import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';

import { SettlementSchema, type Run } from '@zombie-drive/shared';

import { send, start } from './api.helpers';
import { finishFirst, select } from './stages-api.helpers';

export async function finishSecond(app: FastifyInstance, pool: Pool): Promise<{ cookie: string; run: Run }> {
    const { cookie } = await finishFirst(app, pool);

    await select(app, cookie, 'industrial');

    const run = await start(app, cookie);

    await pool.query("UPDATE runs SET started_at = now() - interval '170 seconds' WHERE id = $1", [ run.id ]);

    const reply = await send(app, cookie, { method: 'POST',
        url: `/api/runs/${ run.id }/finish`,
        payload: { distance: 2100, elapsedSeconds: 160, killedZombieIds: [], reason: 'finish' } });

    const data: unknown = reply.json();

    SettlementSchema.parse(data);

    return { cookie, run };
}
