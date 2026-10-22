import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Fastify from 'fastify';
import { afterAll, beforeAll, expect, it } from 'vitest';

import { serveWeb } from '../apps/api/src/serveWeb';

const app = Fastify();
let root = '';

beforeAll(async (): Promise<void> => {
    root = await mkdtemp(join(tmpdir(), 'zombie-web-'));
    await writeFile(join(root, 'index.html'), '<html>Game build</html>');
    await mkdir(join(root, 'art'));
    await writeFile(join(root, 'art', 'wheel.webp'), 'image fixture');
    await serveWeb(app, { root, required: true });
});

afterAll(async (): Promise<void> => {
    await app.close();
    await rm(root, { recursive: true, force: true });
});

it('serves the built client and assets', async (): Promise<void> => {
    expect((await app.inject('/')).body).toContain('Game build');
    expect((await app.inject('/art/wheel.webp')).body).toBe('image fixture');
});

it('returns 404 for missing assets and API endpoints instead of HTML', async (): Promise<void> => {
    for (const url of [ '/art/missing.webp', '/assets/missing.js', '/api/missing', '/api' ]) {
        const response = await app.inject(url);

        expect(response.statusCode).toBe(404);
        expect(response.body).not.toContain('Game build');
    }
});

it('supports navigation to a client route', async (): Promise<void> => {
    const response = await app.inject({ url: '/garage', headers: { accept: 'text/html' } });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Game build');
});

it('does not use the SPA fallback for missing files opened as a document', async (): Promise<void> => {
    for (const url of [ '/art/missing.webp', '/assets/missing.js', '/fonts/missing.woff2', '/api?test=1' ]) {
        const response = await app.inject({ url, headers: { accept: 'text/html' } });

        expect(response.statusCode).toBe(404);
    }
});

it('fails production startup when index.html is missing', async (): Promise<void> => {
    const unbuilt = Fastify();

    try {
        await expect(serveWeb(unbuilt, { root: join(root, 'missing'), required: true })).rejects.toThrow('Client build is missing');
    } finally {
        await unbuilt.close();
    }
});
