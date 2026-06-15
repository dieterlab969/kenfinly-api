#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/kenfinly}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-staging}"

cd "$APP_DIR"

git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"

php8.2 /usr/bin/composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

#==============================================================================
# UPDATE: Activate NVM to force Node v20 (or newer)
# ==============================================================================
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
    nvm use 20 || nvm install 20
else
    echo "WARNING: NVM not found. Using system default Node.js."
fi
# ==============================================================================

# Clear old node_modules to avoid Tailwind (Oxide/Rust) binary conflicts when changing Node versions
echo "Cleaning old build artifacts..."
rm -rf node_modules package-lock.json

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

# Ensure PM2 runs with the new Node environment using --update-env
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

if command -v sudo >/dev/null 2>&1; then
    sudo nginx -t
    sudo systemctl reload nginx
else
    nginx -t
fi
