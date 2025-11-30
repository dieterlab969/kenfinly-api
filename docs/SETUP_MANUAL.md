# Kenfinly - Developer Setup Manual

**Version**: 1.0  
**Last Updated**: October 28, 2025  
**Target Audience**: New Team Members, Developers, QA Engineers

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Architecture](#2-database-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Step-by-Step Installation](#4-step-by-step-installation)
5. [Environment Configuration](#5-environment-configuration)
6. [Running the Application](#6-running-the-application)
7. [Verifying Your Setup](#7-verifying-your-setup)
8. [Common Issues & Troubleshooting](#8-common-issues--troubleshooting)
9. [Development Workflow](#9-development-workflow)
10. [Team Contacts](#10-team-contacts)

---

## 1. System Architecture Overview

Kenfinly uses a **headless architecture** with three main components working together:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     REACT FRONTEND (SPA)                                │ │
│  │                  Vite + Tailwind CSS + Recharts                         │ │
│  └─────────────────────────────┬──────────────────────────────────────────┘ │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 │ API Requests (JSON)
                                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        LARAVEL 12 MIDDLEWARE                                │
│                         (PHP REST API Layer)                                │
│                                                                              │
│  ┌──────────────────────┐              ┌──────────────────────────────────┐ │
│  │   Authentication     │              │    WordPress Service             │ │
│  │   (JWT Auth)         │              │    (HTTP Client)                 │ │
│  └──────────┬───────────┘              └─────────────┬────────────────────┘ │
│             │                                        │                      │
└─────────────┼────────────────────────────────────────┼──────────────────────┘
              │                                        │
              ▼                                        ▼
┌─────────────────────────────┐        ┌─────────────────────────────────────┐
│   MySQL Database (Prod)      │        │       WordPress (Headless CMS)      │
│   PostgreSQL (Dev/Replit)    │        │       with SQLite Database          │
│      (Application Data)      │        │                                     │
│                              │        │  • Blog Posts & Pages               │
│  • Users & Roles             │        │  • Financial Tips                   │
│  • Accounts                  │        │  • News Articles                    │
│  • Transactions              │        │  • FAQs                             │
│  • Categories                │        │  • Media Files                      │
│  • Budgets & Licenses        │        │                                     │
└─────────────────────────────┘        └─────────────────────────────────────┘
```

### Why This Architecture?

| Component | Purpose | Why We Chose It |
|-----------|---------|-----------------|
| **WordPress** | Content Management | Marketing team can easily manage blog posts, landing pages, and FAQs without developer help |
| **Laravel** | API Middleware | Provides security, data validation, business logic, and acts as a unified API gateway |
| **React** | User Interface | Modern, fast, interactive frontend with real-time updates |
| **MySQL** | Core Application Data (Production) | Our production database - reliable, ACID-compliant for financial transactions |
| **PostgreSQL** | Core Application Data (Development) | Used in Replit development environment (built-in database) |
| **SQLite** (WordPress) | CMS Content | Lightweight, no external database server needed for WordPress |

### Data Flow Examples

**User logs in and views dashboard:**
```
User → React UI → Laravel API → MySQL/PostgreSQL → Returns account/transaction data
```

**User reads a blog post:**
```
User → React UI → Laravel API → WordPress REST API → SQLite → Returns blog content
```

---

## 2. Database Architecture

### Two Separate Databases

We use **TWO databases** that serve different purposes:

| Database | Type | Environment | Purpose |
|----------|------|-------------|---------|
| **Application Database** | MySQL | Production | Core business data (users, transactions, accounts) |
| **Application Database** | PostgreSQL | Development (Replit) | Same schema, built-in Replit database |
| **CMS Database** | SQLite | All Environments | WordPress content (blog, pages, FAQs) |

> **Note**: The application code is database-agnostic. Laravel's Eloquent ORM handles the differences between MySQL and PostgreSQL automatically. No code changes are needed when switching environments.

### Why Two Databases?

1. **Separation of Concerns**: Application data and content data have different requirements
2. **Security**: Sensitive financial data is isolated from public content
3. **Performance**: Each database is optimized for its specific use case
4. **Independence**: WordPress can be updated or migrated without affecting the core application

### Database Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│        APPLICATION DATABASE (MySQL in Prod / PostgreSQL in Dev)  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐    ┌─────────────┐    ┌─────────────────┐          │
│  │  users   │───▶│ user_roles  │◀───│     roles       │          │
│  └────┬─────┘    └─────────────┘    └─────────────────┘          │
│       │                                                           │
│       ▼                                                           │
│  ┌──────────┐    ┌─────────────┐    ┌─────────────────┐          │
│  │ accounts │───▶│transactions │◀───│   categories    │          │
│  └──────────┘    └─────────────┘    └────────┬────────┘          │
│                                              │ (self-referencing) │
│                                              ▼                    │
│                                     ┌─────────────────┐          │
│                                     │  subcategories  │          │
│                                     └─────────────────┘          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CMS DATABASE (WordPress/SQLite)                │
│  Location: storage/wordpress/.ht.sqlite                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐    ┌─────────────────────────────────────┐ │
│  │  wp_posts        │    │  wp_postmeta (custom fields)        │ │
│  │  - blog posts    │    └─────────────────────────────────────┘ │
│  │  - pages         │                                            │
│  │  - financial_tip │    ┌─────────────────────────────────────┐ │
│  │  - news          │    │  wp_terms / wp_term_taxonomy        │ │
│  │  - faq           │    │  (categories, tags)                 │ │
│  └──────────────────┘    └─────────────────────────────────────┘ │
│                                                                   │
│  Note: WordPress manages its own tables independently            │
└─────────────────────────────────────────────────────────────────┘
```

### No Direct Database Link

**Important**: The two databases do NOT share data directly. Laravel acts as the bridge:

- When React needs application data → Laravel queries PostgreSQL
- When React needs content → Laravel calls WordPress REST API → WordPress queries SQLite
- This separation provides security and flexibility

---

## 3. Prerequisites

Before starting, ensure you have the following installed on your machine:

### Required Software

| Software | Minimum Version | Check Command | Download Link |
|----------|-----------------|---------------|---------------|
| PHP | 8.2+ | `php -v` | [php.net](https://www.php.net/downloads) |
| Composer | 2.x | `composer -V` | [getcomposer.org](https://getcomposer.org) |
| Node.js | 18+ | `node -v` | [nodejs.org](https://nodejs.org) |
| npm | 8+ | `npm -v` | Comes with Node.js |
| Git | 2.x | `git --version` | [git-scm.com](https://git-scm.com) |

### Required PHP Extensions

```bash
# Check installed extensions
php -m

# Required extensions:
# - pdo_pgsql (PostgreSQL)
# - pdo_sqlite (SQLite for WordPress)
# - curl
# - mbstring
# - xml
# - openssl
# - json
# - fileinfo
# - gd (image processing)
```

### For Replit Environment

If you're using Replit, most dependencies are pre-configured. Just ensure:
- PHP 8.3 module is installed
- Node.js 20 module is installed
- PostgreSQL database is created

---

## 4. Step-by-Step Installation

### Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/getkenka/kenfinly.git

# Navigate to the project directory
cd kenfinly
```

### Step 2: Install PHP Dependencies

```bash
# Install Composer dependencies
composer install

# This may take 2-5 minutes depending on your internet connection
# Expected output: "Generating optimized autoload files"
```

### Step 3: Install JavaScript Dependencies

```bash
# Install npm packages
npm install

# Expected output: "added XXX packages"
```

### Step 4: Set Up Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env
```

### Step 5: Configure the Environment File

Open `.env` in your editor and update the following sections:

```env
# Application Settings
APP_NAME=Kenfinly
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:5000

# Database Configuration (PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=your-database-host
DB_PORT=5432
DB_DATABASE=your-database-name
DB_USERNAME=your-username
DB_PASSWORD=your-password

# For Replit: Use these environment variable references
# DB_HOST=${PGHOST}
# DB_PORT=${PGPORT}
# DB_DATABASE=${PGDATABASE}
# DB_USERNAME=${PGUSER}
# DB_PASSWORD=${PGPASSWORD}

# WordPress Configuration (Optional - for content features)
WORDPRESS_API_URL=http://localhost:5000/wordpress
WORDPRESS_USERNAME=admin
WORDPRESS_APPLICATION_PASSWORD=your-app-password
WORDPRESS_TIMEOUT=30
WORDPRESS_RETRIES=3
```

### Step 6: Generate Security Keys

```bash
# Generate Laravel application key
php artisan key:generate
# Expected: "Application key set successfully."

# Generate JWT secret for authentication
php artisan jwt:secret
# Expected: "jwt-auth secret [xxx] set successfully."
```

### Step 7: Set Up the Database

```bash
# Run database migrations
php artisan migrate

# Expected output:
# "Running migrations..."
# Multiple "DONE" messages for each table

# Seed initial data (roles, categories, test users)
php artisan db:seed

# Expected: "Database seeding completed successfully."
```

### Step 8: Set Up WordPress (Optional)

If you need the content management features:

```bash
# Run WordPress installation script (recommended)
./install-wp.sh

# This script automatically:
# 1. Creates storage/wordpress/ directory for SQLite database
# 2. Deploys wp-config.php from wordpress-custom/configs/
# 3. Copies custom plugins and must-use plugins
# 4. Sets up required permissions
# 5. Creates the SQLite database at storage/wordpress/.ht.sqlite
```

**File Structure:**
```
public/wordpress/          # WordPress core (downloaded via Composer)
wordpress-custom/          # Custom configurations and plugins
├── configs/               # wp-config.php and other configs
├── mu-plugins/            # Must-use plugins
└── plugins/               # Custom plugins
storage/wordpress/         # SQLite database location
└── .ht.sqlite             # WordPress SQLite database
```

**Access WordPress Admin:**
After installation, access: `http://localhost:5000/wordpress/wp-admin/`

### Step 9: Build Frontend Assets

```bash
# For development (with hot reload)
npm run dev

# For production build
npm run build
```

### Step 10: Start the Application

```bash
# Option 1: Using the provided script
./start-dev.sh

# Option 2: Manual start
php artisan serve --host=0.0.0.0 --port=5000 & npm run dev

# Option 3: For Replit
# The workflow is pre-configured to start automatically
```

---

## 5. Environment Configuration

### Complete .env Reference

```env
#===================================================================
# APPLICATION SETTINGS
#===================================================================
APP_NAME=Kenfinly
APP_ENV=local              # local, staging, production
APP_KEY=                   # Auto-generated by php artisan key:generate
APP_DEBUG=true             # Set to false in production
APP_URL=http://localhost:5000
APP_LOCALE=en
APP_FALLBACK_LOCALE=en

#===================================================================
# DATABASE CONFIGURATION
#===================================================================
# PRODUCTION (MySQL):
# DB_CONNECTION=mysql
# DB_HOST=your-mysql-host.com
# DB_PORT=3306
# DB_DATABASE=kenfinly
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# DEVELOPMENT (PostgreSQL - Replit built-in):
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kenfinly
DB_USERNAME=postgres
DB_PASSWORD=

# For Replit environment (uses system environment variables):
# DB_HOST=${PGHOST}
# DB_PORT=${PGPORT}
# DB_DATABASE=${PGDATABASE}
# DB_USERNAME=${PGUSER}
# DB_PASSWORD=${PGPASSWORD}

#===================================================================
# JWT AUTHENTICATION
#===================================================================
JWT_SECRET=                # Auto-generated by php artisan jwt:secret
JWT_TTL=60                 # Token lifetime in minutes (default: 60)
JWT_REFRESH_TTL=20160      # Refresh token lifetime (default: 2 weeks)

#===================================================================
# WORDPRESS HEADLESS CMS (Optional)
#===================================================================
WORDPRESS_API_URL=http://localhost:5000/wordpress
WORDPRESS_USERNAME=admin
WORDPRESS_APPLICATION_PASSWORD=
WORDPRESS_TIMEOUT=30
WORDPRESS_RETRIES=3
WORDPRESS_CACHE_ENABLED=true
WORDPRESS_CACHE_POSTS=300      # 5 minutes
WORDPRESS_CACHE_PAGES=600      # 10 minutes
WORDPRESS_CACHE_CATEGORIES=3600 # 1 hour

#===================================================================
# EMAIL CONFIGURATION (Optional)
#===================================================================
MAIL_MAILER=log            # Use 'smtp' for real emails
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@kenfinly.com
MAIL_FROM_NAME="${APP_NAME}"

#===================================================================
# CACHE & SESSION
#===================================================================
CACHE_STORE=database
SESSION_DRIVER=database
SESSION_LIFETIME=120

#===================================================================
# LOGGING
#===================================================================
LOG_CHANNEL=stack
LOG_LEVEL=debug
```

---

## 6. Running the Application

### Development Mode

```bash
# Start both Laravel and Vite dev servers
php artisan serve --host=0.0.0.0 --port=5000 & npm run dev

# Or use the convenience script
./start-dev.sh
```

**What runs:**
- Laravel API server on port 5000
- Vite dev server on port 5173 (hot module replacement)

### Production Mode

```bash
# Build optimized assets
npm run build

# Start Laravel server
php artisan serve --host=0.0.0.0 --port=5000

# Or use a production-ready server like:
# php-fpm with Nginx (recommended)
```

### Accessing the Application

| URL | Description |
|-----|-------------|
| `http://localhost:5000` | Main application |
| `http://localhost:5000/api/auth/login` | Login API endpoint |
| `http://localhost:5000/wordpress/wp-admin/` | WordPress admin panel |

---

## 7. Verifying Your Setup

### Quick Verification Checklist

Run these commands to verify your installation:

```bash
# 1. Check PHP version
php -v
# Expected: PHP 8.2+ 

# 2. Check Laravel is working
php artisan --version
# Expected: Laravel Framework 12.x.x

# 3. Check database connection
php artisan migrate:status
# Expected: List of migrations with "Ran" status

# 4. Check JWT is configured
php artisan tinker --execute="echo config('jwt.secret') ? 'JWT OK' : 'JWT NOT SET';"
# Expected: JWT OK

# 5. Test the API
curl http://localhost:5000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"password"}'
# Expected: JSON response with access_token
```

### Test User Accounts

After running seeders, these test accounts are available:

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| owner@example.com | password | Owner | Full access |
| viewer@example.com | password | Viewer | Read-only access |

### API Health Check

```bash
# Check API is responding
curl http://localhost:5000/up
# Expected: 200 OK

# Check WordPress integration (if configured)
curl http://localhost:5000/api/wordpress/status
# Expected: {"configured": true, ...}
```

---

## 8. Common Issues & Troubleshooting

### Issue: "Class not found" or autoload errors

**Solution:**
```bash
composer dump-autoload
php artisan optimize:clear
```

### Issue: Database connection refused

**Solution:**
1. Verify database credentials in `.env`
2. Ensure PostgreSQL is running
3. Check firewall settings
```bash
# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();
# Should return PDO object without errors
```

### Issue: JWT token not working

**Solution:**
```bash
# Regenerate JWT secret
php artisan jwt:secret --force

# Clear config cache
php artisan config:clear
```

### Issue: WordPress API not responding

**Solution:**
1. Verify WordPress is installed by running `./install-wp.sh`
2. Check that `public/wordpress/` directory exists (downloaded via Composer)
3. Verify SQLite database exists at `storage/wordpress/.ht.sqlite`
4. Check `WORDPRESS_API_URL` in `.env`
5. Ensure WordPress REST API is enabled
```bash
# Verify WordPress installation
ls -la public/wordpress/
ls -la storage/wordpress/

# Test API
curl http://localhost:5000/wordpress/wp-json/
# Should return WordPress API root
```

### Issue: Vite HMR not working

**Solution:**
```bash
# For Replit, ensure vite.config.js has correct HMR settings:
server: {
    host: '0.0.0.0',
    hmr: {
        host: process.env.REPLIT_DEV_DOMAIN || 'localhost',
        clientPort: 443,
        protocol: 'wss',
    },
}
```

### Issue: Permission denied errors

**Solution:**
```bash
# Fix storage permissions
chmod -R 775 storage bootstrap/cache
```

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 9. Development Workflow

### Daily Development Routine

```bash
# 1. Pull latest changes
git pull origin main

# 2. Update dependencies (if needed)
composer install
npm install

# 3. Run any new migrations
php artisan migrate

# 4. Start development servers
./start-dev.sh

# 5. Open browser to http://localhost:5000
```

### Code Quality Commands

```bash
# Run PHP code style fixer
./vendor/bin/pint

# Run tests
php artisan test

# Run specific test
php artisan test --filter UserTest
```

### Useful Artisan Commands

```bash
# Clear all caches
php artisan optimize:clear

# Create a new controller
php artisan make:controller Api/MyController

# Create a new model with migration
php artisan make:model MyModel -m

# Create a new migration
php artisan make:migration create_my_table

# Rollback last migration
php artisan migrate:rollback

# Fresh database with seeds
php artisan migrate:fresh --seed
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# After changes
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# Create Pull Request on GitHub
```

---

## 10. Team Contacts

### Company Information

- **Company**: Getkenka Ltd
- **Tax Code**: 0318304909
- **Email**: purchasevn@getkenka.com
- **Phone**: +84 0941069969
- **Address**: 2nd Floor, 81 CMT8 Street, Ben Thanh Ward, Dist 1, HCMC

### Project Resources

| Resource | URL |
|----------|-----|
| GitHub Repository | https://github.com/getkenka/kenfinly |
| Issue Tracker | GitHub Issues |
| API Documentation | `/docs/API.md` |
| WordPress API Docs | `/docs/WORDPRESS_HEADLESS_CMS_API.md` |

---

## Quick Reference Card

### Essential Commands

| Task | Command |
|------|---------|
| Install PHP deps | `composer install` |
| Install JS deps | `npm install` |
| Start dev server | `./start-dev.sh` |
| Run migrations | `php artisan migrate` |
| Seed database | `php artisan db:seed` |
| Clear cache | `php artisan optimize:clear` |
| Run tests | `php artisan test` |
| Build for prod | `npm run build` |

### Essential URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:5000` | Application |
| `http://localhost:5000/api` | API Endpoints |
| `http://localhost:5000/wordpress/wp-admin/` | WordPress Admin |

### Test Credentials

| Account | Email | Password |
|---------|-------|----------|
| Owner | owner@example.com | password |
| Viewer | viewer@example.com | password |
| WP Admin | admin | (set during WordPress setup) |

---

**Document Maintainer**: Development Team  
**Last Review Date**: October 28, 2025  
**Next Review**: When major architecture changes occur
