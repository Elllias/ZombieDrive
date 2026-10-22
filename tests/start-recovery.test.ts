import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { z } from 'zod';
import { beforeAll, afterAll, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { ProgressSchema, SettlementSchema, type Run } from '@zombie-drive/shared';

import { createApp } from '../apps/api/src/createApp';
import { migrate } from '../apps/api/src/database/migrate';
import { API } from '../apps/web/src/api/client';
import { AppActions } from '../apps/web/src/state/AppActions';
import type { AppState, GarageState } from '../apps/web/src/state/types';

import { guest, send, start, VALID_REPORT } from './api.helpers';
import { enteredRun, startRequest } from './start-recovery.helpers';

const pool = new Pool({ connectionString: z.string().parse(process.env.DATABASE_URL) });

let application: FastifyInstance | null = null;

function app(): FastifyInstance {
    if (!application) {
        throw new Error('Start recovery API is not ready');
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

it.each([ 'finished', 'abandoned', 'expired' ])(
    'rejects the consumed start key for a %s attempt without replacing it',
    async (state): Promise<void> => {
        const cookie = await guest(app());
        const key = randomUUID();
        const original = await start(app(), cookie, key);

        await closeAttempt(cookie, original, state);

        const retry = await send(app(), cookie, { method: 'POST', url: '/api/runs', payload: { key } });
        const fresh = await start(app(), cookie);
        const current = await progress(cookie);

        expect(retry.statusCode).toBe(410);
        expect(fresh.id).not.toBe(original.id);
        expect(current.activeRun?.id).toBe(fresh.id);
        expect(current.balance).toBe(state === 'finished' ? 20 : 0);
    },
);

async function closeAttempt(cookie: string, run: Run, state: string): Promise<void> {
    if (state === 'expired') {
        await pool.query("UPDATE runs SET expires_at = now() - interval '1 second' WHERE id = $1", [ run.id ]);

        return;
    }

    const response = await send(app(), cookie, {
        method: 'POST',
        url: `/api/runs/${ run.id }/finish`,
        payload: { ...VALID_REPORT, reason: state === 'abandoned' ? 'abandon' : 'fuel' },
    });

    expect(response.statusCode).toBe(200);
}

async function progress(cookie: string): Promise<z.infer<typeof ProgressSchema>> {
    const response = await send(app(), cookie, { url: '/api/progress' });
    const data: unknown = response.json();

    return ProgressSchema.parse(data);
}

it('recovers a lost expired start into a fresh playable run with normal earnings', async (): Promise<void> => {
    const cookie = await guest(app());
    const states: Array<AppState> = [];
    const requests: Array<string> = [];
    const state: GarageState = { screen: 'garage', progress: await progress(cookie), isBusy: false, error: null };
    const start = lostStart(cookie, requests);

    const actions = new AppActions({ ...API, start }, (state): void => {
        states.push(state);
    });

    await actions.start(state);
    await actions.start(state);

    const run = enteredRun(states);

    const response = await send(app(), cookie, {
        method: 'POST', url: `/api/runs/${ run.id }/finish`, payload: VALID_REPORT,
    });

    const data: unknown = response.json();

    expect(requests).toHaveLength(3);
    expect(requests[1]).toBe(requests[0]);
    expect(requests[2]).not.toBe(requests[0]);
    expect(response.statusCode).toBe(200);
    expect(SettlementSchema.parse(data).reward).toBe(20);
});

function lostStart(cookie: string, requests: Array<string>): typeof API.start {
    return async (key): Promise<Run> => {
        requests.push(key);

        const run = await startRequest(app(), cookie, key);

        if (requests.length === 1) {
            await pool.query("UPDATE runs SET expires_at = now() - interval '1 second' WHERE id = $1", [ run.id ]);

            throw new Error('Lost start response');
        }

        return run;
    };
}
