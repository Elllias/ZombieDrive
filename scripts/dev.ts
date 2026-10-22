import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

import { localDatabase } from './localDatabase';
import { stopChildren } from './stopChildren';

const database = process.env.DATABASE_URL
    ? null
    : await localDatabase({
        directory: resolve('.local/postgres'),
        port: 55432,
        persistent: true,
    });

const environment = { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? database?.url };

const children = [
    spawn(process.execPath, [ '--import', 'tsx', '--watch', 'apps/api/src/main.ts' ], {
        stdio: 'inherit',
        env: environment,
    }),

    spawn(process.execPath, [ 'node_modules/vite/bin/vite.js', '--config', 'apps/web/vite.config.ts' ], {
        stdio: 'inherit',
        env: environment,
    }),
];

let isStopping = false;

async function stop(code = 0): Promise<void> {
    if (isStopping) {
        return;
    }

    isStopping = true;
    await stopChildren(children);
    await database?.stop();
    process.exitCode = code;
}

for (const signal of [ 'SIGINT', 'SIGTERM' ]) {
    process.once(signal, (): void => {
        void stop();
    });
}

children.forEach((child): void => {
    child.once('exit', (code): void => {
        if (!isStopping) {
            void stop(code ?? 1);
        }
    });
});

console.log(`Zombie Drive: http://localhost:${ process.env.WEB_PORT ?? '5173' } — Ctrl+C stops all services.`);
