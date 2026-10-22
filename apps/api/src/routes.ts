import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';

import { StartSchema, PurchaseSchema, ReportSchema, SelectStageSchema } from '@zombie-drive/shared';

import { authenticate } from './session';
import { registerSession, type SessionOptions } from './auth/registerSession';
import { transaction } from './database/transaction';
import { lockPlayer } from './domain/lockPlayer';
import { readProgress } from './domain/readProgress';
import { startRun } from './domain/startRun';
import { finishRun } from './domain/finishRun';
import { purchase } from './domain/purchase';
import { selectStage } from './domain/selectStage';

const RunParametersSchema = z.object({ id: z.string().uuid() });

export function registerRoutes(app: FastifyInstance, pool: Pool, session: SessionOptions): void {
    app.get('/api/health', async (): Promise<{ status: string }> => {
        await pool.query('SELECT 1');

        return { status: 'ok' };
    });

    registerSession(app, pool, session);
    registerProgressRoutes(app, pool);
}

function registerProgressRoutes(app: FastifyInstance, pool: Pool): void {
    app.get('/api/progress', async (request) => withPlayer(pool, request, readProgress));

    app.post('/api/stages/select', async (request) => {
        const { stageId } = SelectStageSchema.parse(request.body);

        return withPlayer(pool, request, (client, playerId) => selectStage(client, playerId, stageId));
    });

    app.post('/api/runs', async (request) => {
        const input = StartSchema.parse(request.body);

        return withPlayer(pool, request, (client, playerId) => startRun(client, playerId, input.key));
    });

    app.post('/api/runs/:id/finish', async (request) => {
        const { id } = RunParametersSchema.parse(request.params);
        const report = ReportSchema.parse(request.body);

        return withPlayer(pool, request, (client, playerId) =>
            finishRun(client, { playerId, runId: id, report }),
        );
    });

    app.post('/api/purchases', async (request) => {
        const input = PurchaseSchema.parse(request.body);

        return withPlayer(pool, request, (client, playerId) => purchase(client, playerId, input));
    });
}

async function withPlayer<T>(
    pool: Pool,
    request: FastifyRequest,
    action: (client: PoolClient, playerId: string) => Promise<T>,
): Promise<T> {
    const playerId = await authenticate(request, pool);

    return transaction(pool, async (client) => {
        await lockPlayer(client, playerId);

        return action(client, playerId);
    });
}
