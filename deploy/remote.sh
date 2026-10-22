#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

if [[ $# -ne 4 ]]; then
    exit 2
fi

root=$1
release=$2
phase=$3
public_url=$4

if [[ ! $root =~ ^/[a-zA-Z0-9/_-]+$ || $root == / || $root == *'/../'* || $root == */.. \
    || ! $release =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+$ \
    || ! $public_url =~ ^https://[a-zA-Z0-9][a-zA-Z0-9.:-]*$ ]]; then
    exit 2
fi

work="$root/releases/$release"
image="zombie-drive:$release"
cd "$root"
exec 9> .deploy.lock
flock -n 9 || { printf 'Another deploy is running\n' >&2; exit 1; }

compose() {
    sudo -n docker compose --project-directory "$root" -f "$root/compose.yaml" \
        -f "$work/source/deploy/telegram.compose.yaml" "$@"
}

with_image() {
    local selected_image=$1
    shift
    sudo -n env "APP_IMAGE=$selected_image" docker compose \
        --project-directory "$root" -f "$root/compose.yaml" \
        -f "$work/source/deploy/telegram.compose.yaml" "$@"
}

current_image() {
    local container
    container=$(compose ps -q app </dev/null)
    test -n "$container"
    sudo -n docker inspect --format '{{.Config.Image}}' "$container" </dev/null
}

prepare() {
    mkdir "$work/source" "$work/retained"
    tar --warning=no-unknown-keyword -xzf "$work/source.tar.gz" -C "$work/source"
    current_image > "$work/previous-image"
    local container
    container=$(compose ps -q app </dev/null)
    sudo -n docker cp "$container:/app/dist/web/assets" "$work/retained/assets" </dev/null
    sudo -n docker build --progress plain -t "$image-build" "$work/source" </dev/null 2>&1 | tee "$work/build.log"
    printf 'FROM %s-build\nCOPY --chown=node:node assets/ /app/dist/web/assets/\nUSER node\n' "$image" \
        > "$work/retained/Dockerfile"
    sudo -n docker build -t "$image" "$work/retained" </dev/null
    sudo -n docker run --rm -i --network none --entrypoint node "$image" --import tsx --input-type=module \
        < "$work/source/deploy/verify-runtime.mjs"
    compose exec -T db pg_dump -U postgres -d zombie_drive -Fc </dev/null > "$work/before.dump"
    test -s "$work/before.dump"
    touch "$work/prepared"
    printf 'Image checked; current app is still running.\n'
}

rollback() {
    trap - ERR HUP INT TERM
    printf 'Activation failed; restoring %s\n' "$previous_image" >&2
    with_image "$previous_image" up -d --no-deps --no-build --wait --wait-timeout 120 app </dev/null \
        || printf 'Rollback failed; inspect docker compose logs app\n' >&2
    exit 1
}

save_image() {
    local environment_file
    environment_file=$(mktemp "$root/.env.deploy.XXXXXX")
    awk -v image="$image" '/^APP_IMAGE=/ { next } { print } END { print "APP_IMAGE=" image }' \
        "$root/.env" > "$environment_file"
    chmod 600 "$environment_file"
    mv -- "$environment_file" "$root/.env"
}

activate() {
    test -f "$work/prepared"
    test -s "$work/before.dump"
    previous_image=$(cat "$work/previous-image")

    if [[ $(current_image) != "$previous_image" ]]; then
        printf 'The active image changed after preparation; run deploy again.\n' >&2
        exit 1
    fi

    trap rollback ERR HUP INT TERM
    with_image "$image" up -d --no-deps --no-build --wait --wait-timeout 120 app </dev/null
    curl --fail --silent --show-error --retry 2 --retry-all-errors --connect-timeout 5 --max-time 15 \
        "$public_url/api/health" >/dev/null
    save_image
    trap - ERR HUP INT TERM
    printf 'Active image: %s\nPrevious image: %s\n' "$image" "$previous_image"
}

case "$phase" in
    prepare) prepare ;;
    activate) activate ;;
    *) exit 2 ;;
esac
