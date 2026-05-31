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
> If you plan to work on the React/Vite frontend, install Node.js later and run `npm install && npm run build`.

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

**Verify the required PHP 8.2 extensions are available:**

```bash
php -v
php -m | egrep 'mbstring|xml|bcmath|pdo_mysql|curl|zip|Zend OPcache'
```

> **Important:** On Homebrew, **PHP-FPM is included with `php@8.2`**. You do not install `php-fpm` separately.

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
> This repository includes a broader Composer setup script that also installs Node packages and builds frontend assets.  
> For the fastest **PHP 8.2 + Nginx + MySQL** onboarding path, use the commands below first.

Run the core project initialization commands:

```bash
composer install
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan storage:link
php artisan config:clear
```

### What these commands do

- **`composer install`** — installs Laravel/PHP dependencies
- **`php artisan key:generate`** — creates `APP_KEY`
- **`php artisan jwt:secret`** — creates `JWT_SECRET` for auth
- **`php artisan migrate --seed`** — **imports the application schema** from Laravel migrations and loads baseline data
- **`php artisan storage:link`** — creates the public storage symlink

> **Important:** This repository’s canonical schema lives in `database/migrations`.  
> For normal local onboarding, **`php artisan migrate --seed` is the correct schema import path**.

### Optional: import a team-provided SQL snapshot

If the team gives you a `.sql` dump for a specific environment snapshot, import it like this:

```bash
mysql -u kenfinly -p kenfinly < /absolute/path/to/kenfinly.sql
```

---

## 8) Configure Nginx for the Laravel app

Homebrew Nginx loads site files from:

```text
$(brew --prefix nginx)/etc/nginx/servers/*
```

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
        fastcgi_pass unix:/opt/homebrew/var/run/php-fpm-alpha-8.2.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
    }
}
```

> **Important:** On macOS/Homebrew, the exact PHP-FPM socket can vary.  
> That is why the generated config above reads the real `listen` value directly from `php@8.2`.
>
> **Path note:** `/opt/homebrew` is the standard Homebrew prefix on Apple Silicon.  
> On Intel Macs, the equivalent paths are usually under `/usr/local`.

Test and reload Nginx:

```bash
nginx -t
brew services restart nginx
```

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

After `php artisan migrate --seed`, these accounts should exist:

- **Super Admin:** `admin@kenfinly.com` / `Admin@123`
- **Owner:** `owner@example.com` / `password123`
- **Editor:** `editor@example.com` / `password123`
- **Viewer:** `viewer@example.com` / `password123`

Open the app in your browser:

```text
http://kenfinly.test
```

---

## Optional: install Node.js for frontend work

Only do this if you need to rebuild assets or work on the React/Vite frontend.

```bash
brew install node
npm install
npm run build
```

---

## Quick troubleshooting

### `php artisan` says the DB connection failed

Check that MySQL is running:

```bash
brew services list | grep mysql
```

### Nginx shows the default page or a 404

Check the generated config file and test Nginx again:

```bash
cat "$(brew --prefix nginx)/etc/nginx/servers/kenfinly.conf"
nginx -t
brew services restart nginx
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