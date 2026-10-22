import { randomUUID } from 'node:crypto';

import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';

import { RunSchema, type Run } from '@zombie-drive/shared';

export async function guest(app: FastifyInstance): Promise<string> {
    const result = await app.inject({ method: 'POST', url: '/api/session', payload: {} });

    return readCookie(result);
}

export function readCookie(result: LightMyRequestResponse): string {
    const header = result.headers['set-cookie'];
    const value = Array.isArray(header) ? header[0] : header;

    if (typeof value !== 'string') {
        throw new Error('Guest cookie not returned');
    }

    return value.split(';')[0] ?? '';
}

export function send(
    app: FastifyInstance,
    cookie: string,
    options: InjectOptions,
): Promise<LightMyRequestResponse> {
    return app.inject({
        ...options,
        headers: { ...options.headers, cookie, origin: 'http://localhost:5173' },
    });
}

export async function start(app: FastifyInstance, cookie: string, key = randomUUID()): Promise<Run> {
    const reply = await send(app, cookie, { method: 'POST', url: '/api/runs', payload: { key } });

    if (reply.statusCode !== 200) {
        throw new Error(`Start failed with HTTP ${ reply.statusCode }: ${ reply.body }`);
    }

    const data: unknown = reply.json();

    return RunSchema.parse(data);
}

export const VALID_REPORT = {
    distance: 40,
    elapsedSeconds: 2,
    killedZombieIds: [ 'zombie-0', 'zombie-1' ],
    reason: 'rollover',
} as const;

export async function earnRewards(app: FastifyInstance, cookie: string, attempts: number): Promise<void> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const run = await start(app, cookie);

        const reply = await send(app, cookie, {
            method: 'POST',
            url: `/api/runs/${ run.id }/finish`,
            payload: VALID_REPORT,
        });

        if (reply.statusCode !== 200) {
            throw new Error('Could not fund the test garage from completed runs');
        }
    }
}
