import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REMOTE_SCRIPT = new URL('../deploy/remote.sh', import.meta.url).pathname;
const RELEASE = '20261021T123456Z-123';
const PREVIOUS_IMAGE = 'zombie-drive:previous';

const DOCKER_MOCK = `#!/usr/bin/env bash
set -euo pipefail
printf '%s %s\\n' "\${APP_IMAGE:-default}" "$*" >> "$DEPLOY_TEST_ROOT/calls"
case "$1" in
    inspect) cat "$DEPLOY_TEST_ROOT/active-image" ;;
    cp) mkdir -p "$3"; printf 'old bundle' > "$3/old.js" ;;
    build) [[ \${DEPLOY_TEST_FAIL_BUILD:-0} != 1 ]] ;;
    run) cat >/dev/null; [[ \${DEPLOY_TEST_FAIL_RUNTIME:-0} != 1 ]] ;;
    compose)
        case " $* " in
            *" ps -q app "*) printf 'test-container\\n' ;;
            *" exec -T db pg_dump "*) printf 'PGDMP-test-backup' ;;
            *" up "*)
                printf '%s' "$APP_IMAGE" > "$DEPLOY_TEST_ROOT/active-image"
                if [[ \${DEPLOY_TEST_FAIL_START:-0} == 1 && $APP_IMAGE != zombie-drive:previous ]]; then
                    exit 1
                fi
                ;;
        esac
        ;;
esac
`;

const MOCKS = {
    sudo: '#!/bin/sh\n[ "$1" != "-n" ] || shift\nexec "$@"\n',
    docker: DOCKER_MOCK,
    curl: '#!/bin/sh\n[ "${DEPLOY_TEST_FAIL_HEALTH:-0}" != 1 ]\n',
    flock: '#!/bin/sh\nexit 0\n',
    tar: '#!/bin/sh\n[ "$1" != "--warning=no-unknown-keyword" ] || shift\nexec /usr/bin/tar "$@"\n',
};

export function deploymentFixture(): { root: string; work: string; run: typeof runDeployment } {
    const root = mkdtempSync(join(tmpdir(), 'zombie-drive-deploy-test-'));
    const work = join(root, 'releases', RELEASE);

    mkdirSync(work, { recursive: true });
    mkdirSync(join(root, 'bin'));
    writeFileSync(join(root, '.env'), `APP_IMAGE=${ PREVIOUS_IMAGE }\nOTHER=keep\n`, { mode: 0o600 });
    writeFileSync(join(root, 'active-image'), PREVIOUS_IMAGE);
    writeFileSync(join(root, 'compose.yaml'), 'services: {}\n');
    writeFileSync(join(root, 'calls'), '');

    Object.entries(MOCKS).forEach(([ name, content ]) => {
        writeFileSync(join(root, 'bin', name), content, { mode: 0o755 });
    });

    return { root, work, run: runDeployment };
}

function runDeployment(root: string, phase: string, environment: NodeJS.ProcessEnv = {}): ReturnType<typeof spawnSync> {
    return spawnSync('bash', [ REMOTE_SCRIPT, root, RELEASE, phase, 'https://game.example' ], {
        encoding: 'utf8',

        env: {
            ...process.env,
            PATH: `${ join(root, 'bin') }:${ process.env.PATH }`,
            DEPLOY_TEST_ROOT: root,
            ...environment,
        },
    });
}

export function preparedRelease(work: string): void {
    writeFileSync(join(work, 'prepared'), '');
    writeFileSync(join(work, 'before.dump'), 'PGDMP-test-backup');
    writeFileSync(join(work, 'previous-image'), PREVIOUS_IMAGE);
}

export function sourceArchive(root: string, work: string): void {
    const source = join(root, 'archive-source');

    mkdirSync(join(source, 'deploy'), { recursive: true });
    writeFileSync(join(source, 'deploy', 'verify-runtime.mjs'), '// runtime verification fixture\n');
    execFileSync('/usr/bin/tar', [ '-czf', join(work, 'source.tar.gz'), '-C', source, '.' ]);
}
