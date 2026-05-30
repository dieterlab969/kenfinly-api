#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")" && pwd)"
cd "$repo_root"

requested_app_port="${APP_PORT:-5000}"
requested_wp_port="${WP_PORT:-8080}"
app_host="${APP_HOST:-0.0.0.0}"
wp_host="${WP_HOST:-0.0.0.0}"
app_port="$(bash "$repo_root/scripts/find-open-port.sh" "$requested_app_port" "$app_host")"
wp_port="$(bash "$repo_root/scripts/find-open-port.sh" "$requested_wp_port" "$wp_host")"

if [[ "$app_port" != "$requested_app_port" ]]; then
    echo "Port $requested_app_port is already in use. Falling back to $app_port for Laravel."
fi

if [[ "$wp_port" != "$requested_wp_port" ]]; then
    echo "Port $requested_wp_port is already in use. Falling back to $wp_port for WordPress."
fi

cleanup() {
    echo "Stopping servers..."
    kill "${LARAVEL_PID:-}" 2>/dev/null || true
    kill "${WP_PID:-}" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

bash "$repo_root/scripts/ensure-storage-link.sh"

echo "Starting Laravel server on port $app_port..."
env PHP_CLI_SERVER_WORKERS=1 bash "$repo_root/scripts/php.sh" artisan serve --host="$app_host" --port="$app_port" &
LARAVEL_PID=$!

echo "Starting WordPress server on port $wp_port..."
(cd public/wordpress && bash "$repo_root/scripts/php.sh" -S "$wp_host:$wp_port") &
WP_PID=$!

echo "Both servers started. Laravel: http://$app_host:$app_port, WordPress: http://$wp_host:$wp_port"

wait
