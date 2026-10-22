import assert from 'node:assert/strict';
import { log } from 'node:console';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import process from 'node:process';

import { z } from 'zod';

await import('fastify');
await import('@zombie-drive/shared');

const manifest = z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)).parse(
    JSON.parse(readFileSync('/app/dist/web/audio/manifest.json', 'utf8')),
);

assert.equal(process.getuid(), 1000);
readFileSync('/app/dist/web/index.html');

for (const [ name, expected ] of Object.entries(manifest)) {
    const bytes = readFileSync(`/app/dist/web/audio/${ name }`);

    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, name);
}

for (const name of readdirSync('/app/dist/web/assets')) {
    readFileSync(`/app/dist/web/assets/${ name }`);
}

log('Runtime UID, API imports, audio hashes and retained bundles: passed');
