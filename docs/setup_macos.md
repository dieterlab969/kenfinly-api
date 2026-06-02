# Kenfinly Local Setup on macOS

> **Target:** New developer onboarding  
> **Goal:** Get Kenfinly running locally in **5–15 minutes** on **macOS** using **Homebrew**, **PHP 8.2**, **Nginx**, and **MySQL**.
>
> **Architecture correction:** Kenfinly uses **PHP 8.2** for local development — **not PHP 7.2**.

---

## What this guide sets up

You will install and configure:

- **PHP 8.2** with FPM
- **Nginx**
- **MySQL**
- **Composer**
- Kenfinly database, environment file, and Laravel schema

> **Frontend note:** If `public/build/manifest.json` already exists in your checkout, you can boot the app without installing Node.js on day one.  
> If you plan to work on the React/Vite frontend, install Node.js 20+ later and run `npm install && npm run build`.

---

## Local URL used in this guide

This guide uses:

- **Application URL:** `http://kenfinly.test`
- **Project root example:** `~/Projects/kenfinly`

If you clone into a different folder, the commands below still work because the Nginx config is generated from your current directory.

---

## 1) Install Homebrew if it is missing

Check whether Homebrew is already installed:

```bash
brew --version
```

If that command fails, install Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

if [ -x /opt/homebrew/bin/brew ]; then
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -x /usr/local/bin/brew ]; then
  echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/usr/local/bin/brew shellenv)"
fi
```

> **Why the extra check?** Apple Silicon Macs use `/opt/homebrew`, while Intel Macs usually use `/usr/local`.

---

## 2) Install the local stack

**Install PHP 8.2, Nginx, MySQL, and Composer:**

```bash
brew update
brew install php@8.2 nginx mysql composer
brew link php@8.2 --force --overwrite
```

**Make sure your shell resolves the Homebrew PHP 8.2 and Composer binaries first:**

```bash
echo 'export PATH="$(brew --prefix php@8.2)/bin:$(brew --prefix php@8.2)/sbin:$(brew --prefix composer)/bin:$PATH"' >> ~/.zprofile
export PATH="$(brew --prefix php@8.2)/bin:$(brew --prefix php@8.2)/sbin:$(brew --prefix composer)/bin:$PATH"
hash -r
```

**Verify the required PHP 8.2 extensions are available:**

```bash
which php
which composer
php -v
composer --version
php -m | egrep 'mbstring|xml|bcmath|pdo_mysql|curl|zip|gd|Zend OPcache'
```

> **Important:** On Homebrew, **PHP-FPM is included with `php@8.2`**. You do not install `php-fpm` separately.
>
> The `gd` extension is required for receipt/photo upload features (`intervention/image`). Homebrew's `php@8.2` includes it by default.
>
> If `which php` or `which composer` points to an older XAMPP, MAMP, or system binary, close and reopen Terminal after updating `~/.zprofile`, then run the verification block again.

---

## 3) Start the services

```bash
brew services start php@8.2
brew services start nginx
brew services start mysql
```

Optional quick status check:

```bash
brew services list | egrep 'php@8.2|nginx|mysql'
```

---

## 4) Clone the project

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone git@github.com:dieterlab969/kenfinly-api.git kenfinly
cd kenfinly
```

---

## 5) Create the MySQL database and developer user

On a standard Homebrew MySQL install, this usually works without a password on first boot:

```bash
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS kenfinly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'kenfinly'@'localhost' IDENTIFIED BY 'kenfinly123';
GRANT ALL PRIVILEGES ON kenfinly.* TO 'kenfinly'@'localhost';
FLUSH PRIVILEGES;
SQL
```

If your local MySQL root account already has a password, use this instead:

```bash
mysql -u root -p
```

Then run the same SQL manually.

---

## 6) Create and configure `.env`

Copy the example file:

```bash
cp .env.example .env
```

Update the project to use **MySQL** and your local domain:

```bash
sed -i '' 's/^APP_NAME=.*/APP_NAME=Kenfinly/' .env
sed -i '' 's#^APP_URL=.*#APP_URL=http://kenfinly.test#' .env
sed -i '' 's/^DB_CONNECTION=.*/DB_CONNECTION=mysql/' .env
sed -i '' 's/^# DB_HOST=127.0.0.1/DB_HOST=127.0.0.1/' .env
sed -i '' 's/^# DB_PORT=3306/DB_PORT=3306/' .env
sed -i '' 's/^# DB_DATABASE=laravel/DB_DATABASE=kenfinly/' .env
sed -i '' 's/^# DB_USERNAME=root/DB_USERNAME=kenfinly/' .env
sed -i '' 's/^# DB_PASSWORD=/DB_PASSWORD=kenfinly123/' .env
```

Your important database section should end up looking like this:

```env
APP_NAME=Kenfinly
APP_URL=http://kenfinly.test

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kenfinly
DB_USERNAME=kenfinly
DB_PASSWORD=kenfinly123
```

---

## 7) Install PHP dependencies and bootstrap Laravel

> **Why not `composer setup`?**  
> This repository includes a `composer setup` script that also installs Node packages and builds frontend assets. However, it requires your `.env` to already have the correct `DB_*` values (step 6) so that `migrate --seed` can connect to MySQL. Complete steps 5 and 6 first, then you can use either approach:
>
> **Option A — manual (recommended for first-time setup):**

```bash
composer install --no-interaction --prefer-dist
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan storage:link
php artisan config:clear
```

> **Option B — all-in-one script (after `.env` is already configured):**

```bash
composer setup
```

### What the bootstrap commands do

- **`composer install`** — installs Laravel/PHP dependencies
- **`php artisan key:generate`** — creates `APP_KEY`
- **`php artisan jwt:secret`** — creates `JWT_SECRET` for token-based auth (required — app will not authenticate without it)
- **`php artisan migrate --seed`** — creates all database tables and loads baseline data (roles, categories, languages, test users)
- **`php artisan storage:link`** — creates the `public/storage` symlink for uploaded files
- **`php artisan config:clear`** — flushes the config cache so fresh `.env` values take effect

### Optional: import a team-provided SQL snapshot

If the team gives you a `.sql` dump for a specific environment snapshot, import it into a **fresh** `kenfinly` database **instead of** running `php artisan migrate --seed`:

```bash
mysql -u kenfinly -p kenfinly < /absolute/path/to/kenfinly.sql
```

> **Important:** Choose **one schema path**:
>
> - **Normal onboarding:** `php artisan migrate --seed`
> - **Snapshot onboarding:** import the provided `.sql` file
>
> Do **not** do both on the same database unless you intentionally want to merge data.

---

## 8) Configure Nginx for the Laravel app

Homebrew Nginx loads site files from:

```text
$(brew --prefix nginx)/etc/nginx/servers/*
```

> **Important Homebrew note:** A fresh Homebrew `nginx.conf` usually still contains a sample server on **port 8080**.  
> That does **not** block this setup. The `kenfinly.conf` file below adds a **separate server on port 80** so you can use `http://kenfinly.test` without a port suffix.

Generate a local site config from the current repo path:

```bash
PROJECT_ROOT="$(pwd)"
NGINX_DIR="$(brew --prefix nginx)/etc/nginx"
PHP_FPM_LISTEN_RAW="$(awk -F' = ' '/^listen = / {print $2}' "$(brew --prefix php@8.2)/etc/php-fpm.d/www.conf")"

if [[ "$PHP_FPM_LISTEN_RAW" = /* ]]; then
  PHP_FPM_LISTEN="unix:${PHP_FPM_LISTEN_RAW}"
else
  PHP_FPM_LISTEN="$PHP_FPM_LISTEN_RAW"
fi

cat > "${NGINX_DIR}/servers/kenfinly.conf" <<EOF_NGINX
server {
    listen 80;
    server_name kenfinly.test localhost;

    root ${PROJECT_ROOT}/public;
    index index.php index.html;

    charset utf-8;
    client_max_body_size 25m;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        include ${NGINX_DIR}/fastcgi_params;
        fastcgi_pass ${PHP_FPM_LISTEN};
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT \$realpath_root;
        fastcgi_hide_header X-Powered-By;
    }

    location ~* \.(?:css|js|mjs|map|jpg|jpeg|gif|png|webp|avif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files \$uri =404;
    }

    location ~ /(?:\.env|composer\.(?:json|lock)|package(?:-lock)?\.json|vite\.config\.js|artisan) {
        deny all;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF_NGINX
```

### Clean site block sample

If you prefer to create the file manually, this is the exact structure to use:

First, check the real PHP-FPM `listen` value on your machine:

```bash
grep '^listen = ' "$(brew --prefix php@8.2)/etc/php-fpm.d/www.conf"
```

```nginx
server {
    listen 80;
    server_name kenfinly.test localhost;

    root /absolute/path/to/kenfinly/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include /opt/homebrew/etc/nginx/fastcgi_params;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
    }
}
```

> **Important:** If your `listen` value is a Unix socket instead of `127.0.0.1:9000`, use that exact value in `fastcgi_pass`.  
> That is why the generated config above reads the real `listen` value directly from `php@8.2`.
>
> **Path note:** `/opt/homebrew` is the standard Homebrew prefix on Apple Silicon.  
> On Intel Macs, the equivalent paths are usually under `/usr/local`.

Test and reload Nginx:

```bash
nginx -t
brew services restart nginx
```

If `nginx -t` reports that port **80** is unavailable on your machine, change the site block to **8080** instead:

```bash
sed -i '' 's/listen 80;/listen 8080;/' "$(brew --prefix nginx)/etc/nginx/servers/kenfinly.conf"
nginx -t
brew services restart nginx
```

If you use this fallback, open the app at **`http://kenfinly.test:8080`**.

---

## 9) Add the local domain to `/etc/hosts`

```bash
grep -q 'kenfinly.test' /etc/hosts || echo '127.0.0.1 kenfinly.test' | sudo tee -a /etc/hosts
```

---

## 10) Verify the local environment

### Verify Nginx is serving the app

```bash
curl -I http://kenfinly.test
curl -I http://localhost
```

You want to see an HTTP response such as `200 OK` or `302 Found`.

If you switched your site block to **8080** in the previous step, verify with:

```bash
curl -I http://kenfinly.test:8080
curl -I http://localhost:8080
```

> **Recommendation:** Use **`http://kenfinly.test`** as your canonical local URL.  
> `http://localhost` is included as a convenience alias and only works for Kenfinly if this server block is the active/default local site in Nginx.

### Verify the database schema exists

```bash
mysql -u kenfinly -p -e "USE kenfinly; SHOW TABLES;"
```

### Verify Laravel can boot cleanly

```bash
php artisan about
```

### Seeded local login accounts

If you used `php artisan migrate --seed`, these accounts exist:

| Email | Password | Role |
|-------|----------|------|
| `admin@kenfinly.com` | `Admin@123` | Super Admin |
| `owner@example.com` | `password123` | Owner |
| `editor@example.com` | `password123` | Editor |
| `viewer@example.com` | `password123` | Viewer |

> If you imported a team-provided SQL snapshot instead, the available users and passwords depend on that dump.

Open the app in your browser:

```text
http://kenfinly.test
```

If you switched Nginx to **8080**, use:

```text
http://kenfinly.test:8080
```

---

## Optional: install Node.js 20+ for frontend work

Only do this if you need to rebuild assets or work on the React/Vite frontend.  
Kenfinly requires **Node.js 20 or newer** (React 19 + Vite 7).

```bash
brew install node@20
brew link node@20 --force --overwrite
node --version   # must print v20.x.x or higher
npm install
npm run build
```

> **`npm run build` vs `npm run dev`:**
>
> - **`npm run build`** — compiles assets to `public/build/` (used once, or after code changes). Required for production and for Nginx to serve the frontend.
> - **`npm run dev`** — starts the Vite hot-reload dev server on port 5173. Use this when actively editing React/Vite files; changes appear in the browser instantly without rebuilding.

---

## Quick start with the built-in PHP server (no Nginx required)

If you want to skip the Nginx setup and start hacking immediately, use the built-in PHP development server with Vite side-by-side:

```bash
# Terminal 1 — Laravel backend (port 8000)
php artisan serve

# Terminal 2 — Vite frontend hot-reload (port 5173)
npm run dev
```

Then open **`http://localhost:8000`** in your browser.

> This is faster to set up but not a substitute for the Nginx + MySQL stack for production-parity testing.  
> `php artisan serve` does not support concurrent connections well — use Nginx for load/performance testing.

---

## Quick troubleshooting

### `php artisan` says the DB connection failed

Check that MySQL is running:

```bash
brew services list | grep mysql
```

### JWT authentication fails / "JWT Secret not set"

Make sure you ran `php artisan jwt:secret`. Check that `JWT_SECRET=` is populated in your `.env`:

```bash
grep JWT_SECRET .env
```

If it is empty, run:

```bash
php artisan jwt:secret
```

### Nginx shows the default page or a 404

Check the generated config file and test Nginx again:

```bash
cat "$(brew --prefix nginx)/etc/nginx/servers/kenfinly.conf"
nginx -t
brew services restart nginx
```

Also confirm whether Homebrew's base config still includes its sample **8080** server:

```bash
grep -nE 'listen\s+[0-9]+' /opt/homebrew/etc/nginx/nginx.conf 2>/dev/null || true
```

### PHP pages return `502 Bad Gateway`

Check the PHP-FPM listen value:

```bash
grep '^listen = ' "$(brew --prefix php@8.2)/etc/php-fpm.d/www.conf"
brew services restart php@8.2
brew services restart nginx
```

---

## Done

If all steps completed successfully, you now have a working macOS local environment for Kenfinly on:

```text
http://kenfinly.test
```
