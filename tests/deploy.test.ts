import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { deploymentFixture, preparedRelease, sourceArchive } from './deploy.fixture';

const directories: Array<string> = [];

function fixture(): ReturnType<typeof deploymentFixture> {
    const deployment = deploymentFixture();

    directories.push(deployment.root);

    return deployment;
}

afterEach((): void => {
    directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }));
});

it('builds a release and backs up the database before allowing activation', (): void => {
    const deployment = fixture();

    sourceArchive(deployment.root, deployment.work);

    const result = deployment.run(deployment.root, 'prepare');

    expect(result.status, String(result.stderr)).toBe(0);
    expect(existsSync(join(deployment.work, 'prepared'))).toBe(true);
    expect(readFileSync(join(deployment.work, 'before.dump'), 'utf8')).toContain('PGDMP');
    expect(readFileSync(join(deployment.root, 'calls'), 'utf8')).not.toContain(' up ');
});

it.each([ 'DEPLOY_TEST_FAIL_BUILD', 'DEPLOY_TEST_FAIL_RUNTIME' ])(
    'leaves the running app untouched when %s fails', (failure): void => {
        const deployment = fixture();

        sourceArchive(deployment.root, deployment.work);

        const result = deployment.run(deployment.root, 'prepare', { [failure]: '1' });

        expect(result.status).not.toBe(0);
        expect(existsSync(join(deployment.work, 'prepared'))).toBe(false);
        expect(readFileSync(join(deployment.root, 'calls'), 'utf8')).not.toContain(' up ');
        expect(readFileSync(join(deployment.root, 'active-image'), 'utf8')).toBe('zombie-drive:previous');
    },
);

it('activates only the app and preserves all unrelated environment settings', (): void => {
    const deployment = fixture();

    preparedRelease(deployment.work);

    const result = deployment.run(deployment.root, 'activate');

    expect(result.status, String(result.stderr)).toBe(0);

    expect(readFileSync(join(deployment.root, '.env'), 'utf8')).toBe(
        'OTHER=keep\nAPP_IMAGE=zombie-drive:20261021T123456Z-123\n',
    );

    expect(readFileSync(join(deployment.root, 'calls'), 'utf8')).toContain(
        'up -d --no-deps --no-build --wait --wait-timeout 120 app',
    );
});

it.each([ 'DEPLOY_TEST_FAIL_START', 'DEPLOY_TEST_FAIL_HEALTH' ])(
    'restores the previous app image when %s fails', (failure): void => {
        const deployment = fixture();

        preparedRelease(deployment.work);

        const result = deployment.run(deployment.root, 'activate', { [failure]: '1' });

        expect(result.status).not.toBe(0);
        expect(readFileSync(join(deployment.root, '.env'), 'utf8')).toBe('APP_IMAGE=zombie-drive:previous\nOTHER=keep\n');
        expect(readFileSync(join(deployment.root, 'active-image'), 'utf8')).toBe('zombie-drive:previous');
        expect(readFileSync(join(deployment.root, 'calls'), 'utf8')).toContain('zombie-drive:previous compose');
    },
);

it('rejects a stale release when a different deployment already changed the running image', (): void => {
    const deployment = fixture();

    preparedRelease(deployment.work);
    writeFileSync(join(deployment.root, 'active-image'), 'zombie-drive:another-release');

    const result = deployment.run(deployment.root, 'activate');

    expect(result.status).not.toBe(0);
    expect(readFileSync(join(deployment.root, 'calls'), 'utf8')).not.toContain(' up ');
});
