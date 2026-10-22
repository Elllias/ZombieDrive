#!/bin/bash
set -euo pipefail

if [[ ! ${APP_DB_PASSWORD:-} =~ ^[0-9a-fA-F]{64}$ ]]; then
    echo 'APP_DB_PASSWORD must contain exactly 64 hexadecimal characters' >&2
    exit 1
fi

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=ON_ERROR_STOP=1 \
    --set=app_password="$APP_DB_PASSWORD" <<'SQL'
CREATE ROLE zombie_app LOGIN PASSWORD :'app_password';
REVOKE ALL ON DATABASE zombie_drive FROM PUBLIC;
GRANT CONNECT ON DATABASE zombie_drive TO zombie_app;
ALTER SCHEMA public OWNER TO zombie_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
SQL
