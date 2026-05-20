#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/kenfinly}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-staging}"

cd "$APP_DIR"

git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"

php8.2 /usr/bin/composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi
npm run build

if [ -x ./install-wp.sh ]; then
    ./install-wp.sh
fi

php8.2 artisan optimize:clear
php8.2 artisan storage:link || true
php8.2 artisan migrate --force
php8.2 artisan config:cache
php8.2 artisan route:cache
php8.2 artisan view:cache

pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

if command -v sudo >/dev/null 2>&1; then
    sudo nginx -t
    sudo systemctl reload nginx
else
    nginx -t
fi
