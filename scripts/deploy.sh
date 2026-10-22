#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$project_root"
umask 077

DEPLOY_HOST=${DEPLOY_HOST:-deploy@178.154.250.113}
DEPLOY_KEY=${DEPLOY_KEY:-$HOME/.ssh/zombie-drive-yc}
DEPLOY_DIR=${DEPLOY_DIR:-/opt/zombie-drive}
DEPLOY_URL=${DEPLOY_URL:-https://178-154-250-113.sslip.io}

if [[ $# -ne 0 || ! $DEPLOY_HOST =~ ^[a-z_][a-z0-9_-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*$ \
    || ! $DEPLOY_DIR =~ ^/[a-zA-Z0-9/_-]+$ || $DEPLOY_DIR == / \
    || $DEPLOY_DIR == *'/../'* || $DEPLOY_DIR == */.. \
    || ! $DEPLOY_URL =~ ^https://[a-zA-Z0-9][a-zA-Z0-9.:-]*$ ]]; then
    printf 'Invalid deploy configuration; see docs/deployment-yc.md\n' >&2
    exit 2
fi

if [[ ! -f $DEPLOY_KEY ]]; then
    printf 'SSH key not found: %s\n' "$DEPLOY_KEY" >&2
    exit 2
fi

release="$(date -u +%Y%m%dT%H%M%SZ)-$RANDOM"
remote="$DEPLOY_DIR/releases/$release"
temporary=$(mktemp -d "${TMPDIR:-/tmp}/zombie-drive-deploy.XXXXXX")
ssh_options=(-i "$DEPLOY_KEY" -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=10
    -o ServerAliveInterval=15 -o ServerAliveCountMax=4 -o ControlMaster=auto -o ControlPersist=60
    -o "ControlPath=$temporary/ssh")

cleanup() {
    ssh "${ssh_options[@]}" -O exit "$DEPLOY_HOST" >/dev/null 2>&1 || true
    rm -rf -- "$temporary"
}

trap cleanup EXIT

remote_phase() {
    ssh "${ssh_options[@]}" "$DEPLOY_HOST" \
        "bash -s -- '$DEPLOY_DIR' '$release' '$1' '$DEPLOY_URL'" < deploy/remote.sh
}

printf 'Deploy %s → %s\n' "$release" "$DEPLOY_HOST"
COPYFILE_DISABLE=1 tar --exclude=node_modules --exclude=.DS_Store --exclude='._*' --exclude='.env*' \
    -czf "$temporary/source.tar.gz" \
    .dockerignore AGENTS.md Dockerfile package.json package-lock.json tsconfig.json \
    vitest.config.ts eslint.config.mjs apps packages scripts tests deploy docs README.md
ssh "${ssh_options[@]}" "$DEPLOY_HOST" "mkdir -p '$DEPLOY_DIR/releases' && mkdir '$remote'"
scp "${ssh_options[@]}" "$temporary/source.tar.gz" "$DEPLOY_HOST:$remote/source.tar.gz"
remote_phase prepare

node --env-file-if-exists=.env -e 'process.stdout.write(process.env.TELEGRAM_BOT_TOKEN ?? "")' | \
    ssh "${ssh_options[@]}" "$DEPLOY_HOST" \
        "python3 '$remote/source/deploy/configure-telegram.py' '$DEPLOY_DIR/.env'"

mkdir -p .local/deployment-backups
backup=".local/deployment-backups/$release.dump"
scp "${ssh_options[@]}" "$DEPLOY_HOST:$remote/before.dump" "$backup"
test -s "$backup"
chmod 600 "$backup"
remote_phase activate
printf 'Published: %s\nDatabase backup: %s/%s\n' "$DEPLOY_URL" "$project_root" "$backup"
