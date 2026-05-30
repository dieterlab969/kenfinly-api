#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")" && pwd)"
cd "$repo_root"

requested_app_port="${APP_PORT:-5000}"
app_host="${APP_HOST:-0.0.0.0}"
app_port="$(bash "$repo_root/scripts/find-open-port.sh" "$requested_app_port" "$app_host")"

if [[ "$app_port" != "$requested_app_port" ]]; then
  echo "Port $requested_app_port is already in use. Falling back to $app_port for Laravel."
fi

if [[ -n "${REPLIT_DEV_DOMAIN:-}" ]] && [[ -f .env ]]; then
  REPLIT_DEV_DOMAIN="$REPLIT_DEV_DOMAIN" bash "$repo_root/scripts/php.sh" -r '
    $envFile = ".env";
    $contents = file_get_contents($envFile);
    $replitDomain = getenv("REPLIT_DEV_DOMAIN") ?: "";
    $contents = str_replace("\${REPLIT_DEV_DOMAIN}", $replitDomain, $contents);
    $contents = preg_replace("/^APP_URL=https.*\R/m", "", $contents);
    $contents = preg_replace("/^ASSET_URL=.*\R/m", "", $contents);
    file_put_contents($envFile, $contents);
  '
fi

bash "$repo_root/scripts/php.sh" artisan config:clear
rm -f bootstrap/cache/*.php

bash "$repo_root/scripts/ensure-storage-link.sh"

npx concurrently -c "#93c5fd,#c4b5fd,#fb7185" \
  "env PHP_CLI_SERVER_WORKERS=1 bash \"$repo_root/scripts/php.sh\" artisan serve --host=$app_host --port=$app_port" \
  "bash \"$repo_root/scripts/php.sh\" artisan queue:listen --tries=1" \
  "bash \"$repo_root/scripts/php.sh\" artisan pail --timeout=0" \
  --names=server,queue,logs --kill-others
