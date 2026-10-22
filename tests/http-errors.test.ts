import { afterAll, afterEach, expect, it } from 'vitest';
import { Pool } from 'pg';
import type { FastifyInstance } from 'fastify';

import { createApp } from '../apps/api/src/createApp';

const pool = new Pool();
const applications: Array<FastifyInstance> = [];

afterAll(async (): Promise<void> => {
    await pool.end();
});

afterEach(async (): Promise<void> => {
    await Promise.all(applications.splice(0).map((app) => app.close()));
});

it.each([
    { payload: '{', contentType: 'application/json', status: 400 },
    { payload: '', contentType: 'application/json', status: 400 },
    { payload: 'x'.repeat(17000), contentType: 'application/json', status: 413 },
    { payload: '<data/>', contentType: 'application/xml', status: 415 },
])('preserves HTTP $status for invalid request bodies', async ({ payload, contentType, status }): Promise<void> => {
    const app = await createApp({ pool, origin: 'http://localhost:5173' });

    applications.push(app);

    const response = await app.inject({
        method: 'POST',
        url: '/api/session',
        headers: { 'content-type': contentType },
        payload,
    });

    expect(response.statusCode).toBe(status);
    expect(response.body).not.toContain('stack');
});
