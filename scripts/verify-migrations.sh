#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

if [[ "${MIGRATION_ALLOW_DISPOSABLE_DATABASE:-0}" != "1" ]]; then
    echo "Refusing migration verification: set MIGRATION_ALLOW_DISPOSABLE_DATABASE=1." >&2
    echo "This check must never run against the configured development database." >&2
    exit 2
fi

artisan=(php artisan)
fresh_connection="${MIGRATION_FRESH_DB_CONNECTION:-sqlite}"
fresh_database="${MIGRATION_FRESH_DB_DATABASE:-}"
fresh_database_is_temporary=0

cleanup() {
    if [[ "$fresh_database_is_temporary" == "1" && -n "$fresh_database" ]]; then
        rm -f "$fresh_database"
    fi
}
trap cleanup EXIT

if [[ "$fresh_connection" == "sqlite" && -z "$fresh_database" ]]; then
    fresh_database="$(mktemp /tmp/kenfinly-migration-fresh-XXXXXX.sqlite)"
    rm -f "$fresh_database"
    fresh_database_is_temporary=1
fi

if [[ "$fresh_connection" == "sqlite" && ! -f "$fresh_database" ]]; then
    mkdir -p "$(dirname "$fresh_database")"
    touch "$fresh_database"
fi

echo "== Fresh install migration check =="
env \
    APP_ENV=testing \
    DB_CONNECTION="$fresh_connection" \
    DB_DATABASE="$fresh_database" \
    "${artisan[@]}" config:clear >/dev/null
env \
    APP_ENV=testing \
    DB_CONNECTION="$fresh_connection" \
    DB_DATABASE="$fresh_database" \
    "${artisan[@]}" migrate:fresh --seed --force --no-interaction
env \
    APP_ENV=testing \
    DB_CONNECTION="$fresh_connection" \
    DB_DATABASE="$fresh_database" \
    "${artisan[@]}" migrate:status --no-ansi

if [[ -z "${MIGRATION_UPGRADE_DATABASE_URL:-}" ]]; then
    echo
    echo "Fresh install check passed."
    echo "Upgrade check not run: set MIGRATION_UPGRADE_DATABASE_URL to a disposable current-schema copy." >&2
    exit 3
fi

echo
echo "== Upgrade-from-current-schema migration check =="
env \
    APP_ENV=testing \
    DATABASE_URL="$MIGRATION_UPGRADE_DATABASE_URL" \
    DB_URL="$MIGRATION_UPGRADE_DATABASE_URL" \
    "${artisan[@]}" config:clear >/dev/null
env \
    APP_ENV=testing \
    DATABASE_URL="$MIGRATION_UPGRADE_DATABASE_URL" \
    DB_URL="$MIGRATION_UPGRADE_DATABASE_URL" \
    "${artisan[@]}" migrate --force --no-interaction
env \
    APP_ENV=testing \
    DATABASE_URL="$MIGRATION_UPGRADE_DATABASE_URL" \
    DB_URL="$MIGRATION_UPGRADE_DATABASE_URL" \
    "${artisan[@]}" migrate:status --no-ansi

echo
echo "Fresh install and upgrade-from-current-schema migration checks passed."