#!/bin/bash

# Replace ${REPLIT_DEV_DOMAIN} in .env with the actual value
sed -i "s/\${REPLIT_DEV_DOMAIN}/$REPLIT_DEV_DOMAIN/g" .env

# For development, remove APP_URL and ASSET_URL to use relative paths
sed -i '/^APP_URL=https/d' .env
sed -i '/^ASSET_URL=/d' .env

# Clear Laravel cache
php artisan config:clear
rm -rf bootstrap/cache/*.php

# Start the development servers
npx concurrently -c "#93c5fd,#c4b5fd,#fb7185" \
  "php artisan serve --host=0.0.0.0 --port=5000" \
  "php artisan queue:listen --tries=1" \
  "php artisan pail --timeout=0" \
  --names=server,queue,logs --kill-others
