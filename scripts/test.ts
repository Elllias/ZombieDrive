import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';

import { localDatabase } from './localDatabase';

async function availablePort(): Promise<number> {
    const server = createServer();

    await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address();

    if (!address || typeof address === 'string') {
        throw new Error('No local TCP port available');
    }

    await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });

    return address.port;
}

const directory = await mkdtemp(join(tmpdir(), 'zombie-drive-tests-'));

const database = await localDatabase({ directory, port: await availablePort(), persistent: false });

let testExitCode: number;

try {
    const child = spawn('node', [ 'node_modules/vitest/vitest.mjs', 'run' ], {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: database.url, NODE_ENV: 'test' },
    });

    testExitCode = await new Promise<number>((resolve, reject) => {
        child.once('error', reject);
        child.once('exit', (code) => resolve(code ?? 1));
    });
} finally {
    await database.stop();
    await rm(directory, { recursive: true, force: true });
}

// embedded-postgres registers a beforeExit hook that otherwise replaces a failed exit code with zero.
process.exit(testExitCode);
