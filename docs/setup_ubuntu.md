# Kenfinly Local Setup on Ubuntu 22.04 / 24.04 LTS

> **Target:** New developer onboarding  
> **Goal:** Get Kenfinly running locally in **5–15 minutes** on **Ubuntu 22.04 or 24.04 LTS** using **Nginx**, **MySQL**, **PHP 8.2**, and **php8.2-fpm**.
>
> **Architecture correction:** Kenfinly uses **PHP 8.2** for local development — **not PHP 7.2**.

---

## What this guide sets up

You will install and configure:

- **Nginx**
- **MySQL Server**
- **PHP 8.2**
- **php8.2-fpm**
- **Composer**
- Kenfinly database, environment file, and Laravel schema

> **Frontend note:** If `public/build/manifest.json` already exists in your checkout, you can boot the app without Node.js on first setup.  
> Install Node.js later only if you need to rebuild the React/Vite frontend assets.

---

## Local URL used in this guide

This guide uses:

- **Application URL:** `http://kenfinly.test`
- **FastCGI socket:** `/var/run/php/php8.2-fpm.sock`

---

## 1) Update APT and add the PHP 8.2 repository

Install the repository helper packages first:

```bash
sudo apt update
sudo apt install -y software-properties-common ca-certificates curl unzip git
```

Add **Ondřej Surý’s PHP PPA** so Ubuntu 22.04 and 24.04 both get native PHP 8.2 packages:

```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
```

---

## 2) Install the stack

```bash
sudo apt install -y \
  nginx \
  mysql-server \
  php8.2 \
  php8.2-cli \
  php8.2-common \
  php8.2-fpm \
  php8.2-mbstring \
  php8.2-xml \
  php8.2-bcmath \
  php8.2-mysql \
  php8.2-curl \
  php8.2-zip \
  php8.2-opcache \
  php8.2-gd \
  composer
```

> **Why `php8.2-gd` is included:** the project uses image-processing packages, so this keeps local upload/image flows working.

---

## 3) Make sure `php` points to PHP 8.2

On machines with multiple PHP versions installed, set PHP 8.2 as the active CLI version:

```bash
sudo update-alternatives --set php /usr/bin/php8.2
```

Verify the version and required extensions:

```bash
which php
which composer
php -v
composer --version
php -m | egrep 'mbstring|xml|bcmath|pdo_mysql|curl|zip|Zend OPcache|gd'
```

> **Why Composer is installed after PHP 8.2:** Composer is a PHP script, so installing PHP 8.2 first and then setting `update-alternatives` helps ensure `composer install` runs on the correct PHP version.

---

## 4) Start and enable the services

```bash
sudo systemctl enable --now php8.2-fpm
sudo systemctl enable --now nginx
sudo systemctl enable --now mysql
```

Optional quick status check:

```bash
systemctl --no-pager --full status php8.2-fpm nginx mysql
```

---

## 5) Clone the project

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone git@github.com:dieterlab969/kenfinly-api.git kenfinly
cd kenfinly
```

---

## 6) Create the database and application user

Ubuntu MySQL typically uses `auth_socket` for root, so use `sudo mysql`:

```bash
sudo mysql <<'SQL'
CREATE DATABASE IF NOT EXISTS kenfinly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'kenfinly'@'localhost' IDENTIFIED BY 'kenfinly123';
GRANT ALL PRIVILEGES ON kenfinly.* TO 'kenfinly'@'localhost';
FLUSH PRIVILEGES;
SQL
```

---

## 7) Create and configure `.env`

Copy the example file:

```bash
cp .env.example .env
```

Update the environment for **MySQL** and the local domain:

```bash
sed -i 's/^APP_NAME=.*/APP_NAME=Kenfinly/' .env
sed -i 's#^APP_URL=.*#APP_URL=http://kenfinly.test#' .env
sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=mysql/' .env
sed -i 's/^# DB_HOST=127.0.0.1/DB_HOST=127.0.0.1/' .env
sed -i 's/^# DB_PORT=3306/DB_PORT=3306/' .env
sed -i 's/^# DB_DATABASE=laravel/DB_DATABASE=kenfinly/' .env
sed -i 's/^# DB_USERNAME=root/DB_USERNAME=kenfinly/' .env
sed -i 's/^# DB_PASSWORD=/DB_PASSWORD=kenfinly123/' .env
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

## 8) Install dependencies and bootstrap Laravel

> **Why not `composer setup`?**  
> This repository includes a broader Composer setup script that also installs Node packages and builds frontend assets.  
> For the fastest **PHP 8.2 + Nginx + MySQL** onboarding path, use the commands below first.

Run the project initialization commands:

```bash
composer install --no-interaction --prefer-dist
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

> **Important:** This repository’s source of truth for the schema is the Laravel migration set under `database/migrations`.

### Optional: import a team-provided SQL snapshot

If the team hands you a `.sql` dump for a special dataset, import it into a **fresh** `kenfinly` database **instead of** running `php artisan migrate --seed`:

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

## 9) Fix Laravel write permissions

Give the web stack write access to Laravel’s runtime directories:

```bash
sudo chown -R "$USER":www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

If your machine uses stricter group rules and PHP still cannot write, fall back to:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
```

---

## 10) Configure the Nginx server block

Create the site file:

```bash
PROJECT_ROOT="$(pwd)"

sudo tee /etc/nginx/sites-available/kenfinly >/dev/null <<EOF_NGINX
server {
    listen 80;
    listen [::]:80;
    server_name kenfinly.test localhost;

    root ${PROJECT_ROOT}/public;
    index index.php index.html;

    charset utf-8;
    client_max_body_size 25m;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
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

Enable the site and disable the Ubuntu default page:

```bash
sudo ln -sf /etc/nginx/sites-available/kenfinly /etc/nginx/sites-enabled/kenfinly
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Clean server block sample

If you prefer to manage the file manually, use this exact pattern:

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
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
    }
}
```

---

## 11) Add the local domain to `/etc/hosts`

```bash
grep -q 'kenfinly.test' /etc/hosts || echo '127.0.0.1 kenfinly.test' | sudo tee -a /etc/hosts
```

---

## 12) Verify the local environment

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

If you used `php artisan migrate --seed`, these accounts should exist:

- **Super Admin:** `admin@kenfinly.com` / `Admin@123`
- **Owner:** `owner@example.com` / `password123`
- **Editor:** `editor@example.com` / `password123`
- **Viewer:** `viewer@example.com` / `password123`

> If you imported a team-provided SQL snapshot instead, the available users and passwords depend on that dump.

Open the app in your browser:

```text
http://kenfinly.test
```

---

## Optional: install Node.js for frontend work

Only do this if you need to rebuild assets or work on the React/Vite frontend.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install
npm run build
```

---

## Quick troubleshooting

### `502 Bad Gateway`

Check that PHP-FPM is running:

```bash
systemctl --no-pager status php8.2-fpm
ls -l /var/run/php/php8.2-fpm.sock
```

### Permission error in `storage` or `bootstrap/cache`

Run:

```bash
sudo chown -R "$USER":www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Nginx still shows the Ubuntu welcome page

Run:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Done

If all steps completed successfully, you now have a working Ubuntu local environment for Kenfinly on:

```text
http://kenfinly.test
```