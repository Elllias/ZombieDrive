import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it, vi } from 'vitest';

const SCRIPT = new URL('../deploy/configure-telegram.py', import.meta.url).pathname;
const TOKEN = '123456:fictional-deployment-token';
const directories: Array<string> = [];

function environment(source: string): string {
    const directory = mkdtempSync(join(tmpdir(), 'zombie-drive-telegram-deploy-test-'));
    const path = join(directory, '.env');

    directories.push(directory);
    writeFileSync(path, source);

    return path;
}

function configure(path: string, input = ''): ReturnType<typeof spawnSync> {
    const result = spawnSync('python3', [ SCRIPT, path ], { input, encoding: 'utf8' });

    if (result.error) {
        throw result.error;
    }

    if (result.status === null) {
        throw new Error(`Telegram configuration helper terminated: ${ result.signal ?? 'unknown cause' }`);
    }

    return result;
}

afterEach((): void => {
    vi.unstubAllEnvs();
    directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
});

it('transfers the token without printing secrets and preserves unrelated server configuration', (): void => {
    const previous = 'APP_IMAGE=zombie-drive:current\nAPP_DB_PASSWORD=private-database-password\n';
    const path = environment(previous);
    const result = configure(path, TOKEN);

    expect(result.status).toBe(0);
    expect(readFileSync(path, 'utf8')).toBe(previous + `TELEGRAM_BOT_TOKEN=${ TOKEN }\n`);
    expect(readFileSync(path + '.before-telegram', 'utf8')).toBe(previous);
    expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(statSync(path + '.before-telegram').mode & 0o777).toBe(0o600);
    expect(String(result.stdout) + String(result.stderr)).not.toContain(TOKEN);
    expect(String(result.stdout) + String(result.stderr)).not.toContain('private-database-password');
});

it('keeps the server token unchanged when no local token is provided', (): void => {
    const previous = `OTHER=keep\nTELEGRAM_BOT_TOKEN="${ TOKEN }" # server configuration\n`;
    const path = environment(previous);

    expect(configure(path).status).toBe(0);
    expect(readFileSync(path, 'utf8')).toBe(previous);
});

it('rejects missing configuration instead of silently deploying broken Telegram login', (): void => {
    const path = environment('APP_IMAGE=zombie-drive:current\n');
    const result = configure(path);

    expect(result.status).toBe(2);
    expect(readFileSync(path, 'utf8')).toBe('APP_IMAGE=zombie-drive:current\n');
});

it('replaces old token assignments and keeps a private backup for recovery', (): void => {
    const previous = 'OTHER=keep\nexport TELEGRAM_BOT_TOKEN=123:old\nTELEGRAM_BOT_TOKEN=123:previous\n';
    const path = environment(previous);

    expect(configure(path, TOKEN).status).toBe(0);
    expect(readFileSync(path, 'utf8')).toBe(`OTHER=keep\nTELEGRAM_BOT_TOKEN=${ TOKEN }\n`);
    expect(readFileSync(path + '.before-telegram', 'utf8')).toBe(previous);
});

it('rejects a malformed token without changing the file or logging the supplied value', (): void => {
    const previous = 'OTHER=keep\n';
    const path = environment(previous);
    const input = '123:secret\nEXTRA_SETTING=unexpected';
    const result = configure(path, input);

    expect(result.status).toBe(2);
    expect(readFileSync(path, 'utf8')).toBe(previous);
    expect(String(result.stdout) + String(result.stderr)).not.toContain('123:secret');
});

it('reports a missing Python executable instead of treating it as a configuration rejection', (): void => {
    const path = environment('OTHER=keep\n');

    vi.stubEnv('PATH', '');

    expect(() => configure(path, TOKEN)).toThrow(/ENOENT/);
    expect(readFileSync(path, 'utf8')).toBe('OTHER=keep\n');
});
