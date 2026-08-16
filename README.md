# Kenfinly

> A personal finance platform for tracking money, understanding spending, and
> building better financial habits.

Kenfinly is a personal finance application designed to help individuals understand, track, and improve their financial health. Its core purpose is to turn financial data into clear, actionable information that helps people make better money decisions.

**Project status:** MVP / active development. The codebase is functional but
still evolving. Expect some areas to be refined as product requirements and
user feedback become clearer.

## Contents

- [What Kenfinly does](#what-kenfinly-does)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment configuration](#environment-configuration)
- [Run the application](#run-the-application)
- [Database and seed data](#database-and-seed-data)
- [Testing](#testing)
- [Build and deployment](#build-and-deployment)
- [Project structure](#project-structure)
- [API and integrations](#api-and-integrations)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Contributing](#contributing)

## What Kenfinly does

### Personal finance

- Track income and expenses across multiple accounts.
- Organize transactions with categories and subcategories.
- Support multiple currencies, including USD and VND.
- View balances, spending summaries, trends, and historical activity.
- Import and export transaction data with CSV validation and error reporting.
- Upload transaction photos with client-side compression and server-side
  processing.

### Planning and habits

- Plan budgets and monitor spending.
- Create savings habits with schedules, streaks, milestones, and achievements.
- View progress and overall savings statistics.
- Use productivity features such as the Pomodoro workflow.

### Accounts, collaboration, and administration

- Register, sign in, verify email, reset credentials, and manage profiles.
- Share accounts with participants using role-based permissions.
- Manage user roles, categories, settings, translations, logos, and transactions
  through the admin area.
- Manage subscription and payment-related features.
- Provide English and Vietnamese localization.

### Content and public experience

- Serve marketing pages, FAQs, blog content, financial tips, and news.
- Optionally connect to a headless WordPress CMS through the Laravel API.
- Support public analytics, consent, sitemap, and company-information features.

## Architecture

Kenfinly is a Laravel monolith with a React SPA frontend. The browser uses
Laravel's Vite integration to load the compiled frontend bundle, while Laravel
provides the API, authentication, business rules, and server-rendered shell.

```text
┌──────────────────────┐
│      Browser         │
│  React SPA + Vite    │
└──────────┬───────────┘
           │ JSON API requests
           ▼
┌──────────────────────┐
│   Laravel 12 app     │
│ Auth, API, business   │
│ rules, admin, CMS     │
└───────┬───────┬──────┘
        │       │
        │       └──────────────────────┐
        ▼                              ▼
┌──────────────────────┐     ┌──────────────────────┐
│ Application database  │     │ Optional WordPress   │
│ Users, accounts,      │     │ headless CMS         │
│ transactions, roles   │     │ posts, pages, FAQs   │
└──────────────────────┘     └──────────────────────┘
```

### Data boundaries

- **Application database:** Users, roles, accounts, transactions, budgets,
  subscriptions, settings, and other product data.
- **WordPress database:** CMS content only. WordPress is accessed through its
  REST API; it is not joined directly to the application database.
- **Laravel:** The trusted boundary for authentication, authorization,
  validation, financial business rules, and calls to WordPress.
- **React:** User interface, client-side interaction, charts, and API
  consumption.

The application database can be MySQL or PostgreSQL. The code uses Laravel
Eloquent so the same application model can run in different environments.

## Technology stack

| Layer | Technology |
|---|---|
| Backend | PHP 8.2+, Laravel 12 |
| API authentication | JWT via `tymon/jwt-auth` |
| Frontend | React 19, TypeScript, React Router |
| Frontend tooling | Vite 7, Laravel Vite Plugin |
| UI | Bootstrap 5, React Bootstrap, Tailwind CSS 4 |
| Charts | Recharts and Chart.js |
| Data access | Laravel Eloquent, Axios |
| Application database | MySQL or PostgreSQL |
| CMS | Optional headless WordPress |
| Payments | PayOS and PayPal integrations are present in the backend |
| Testing | PHPUnit/Laravel tests, Vitest, Testing Library |
| Image processing | Intervention Image and client-side compression |

## Prerequisites

Install the following before setting up the project:

| Tool | Version |
|---|---|
| PHP | 8.2 or newer |
| Composer | 2.x |
| Node.js | 18 or newer recommended |
| npm | Included with Node.js |
| MySQL or PostgreSQL | A database supported by the configured Laravel environment |
| Git | Current stable version |

Useful checks:

```bash
php -v
composer --version
node --version
npm --version
```

Some optional integrations require their own accounts or services, such as
WordPress, Google/Facebook OAuth, PayOS, PayPal, email delivery, analytics, or
reCAPTCHA. They are not required for the basic application to boot.

## Quick start

### 1. Clone and enter the repository

```bash
git clone <repository-url>
cd kenfinly
```

### 2. Install dependencies

```bash
composer install
npm install
```

### 3. Create the environment file

```bash
cp .env.example .env
```

Open `.env` and configure at least:

```env
APP_NAME=Kenfinly
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kenfinly
DB_USERNAME=kenfinly
DB_PASSWORD=
```

Use the database connection that exists in your environment. Do not copy
production credentials into a local `.env` file.

### 4. Generate application secrets

```bash
php artisan key:generate
php artisan jwt:secret --force
```

`JWT_SECRET` is required for protected API routes. If it is empty, login and
other authenticated requests will fail.

### 5. Prepare storage and database

```bash
php artisan storage:link
php artisan migrate --seed
```

The seeders create baseline roles, languages, categories, settings, and
development data where applicable. Review seeders before using them against any
database containing real user data.

### 6. Build the frontend

```bash
npm run build
```

### 7. Start the application

For the repository's PHP built-in server configuration:

```bash
php -S 0.0.0.0:5000 server.php
```

Open <http://localhost:5000>.

The custom `server.php` router serves Laravel from `public/`, serves compiled
assets, and handles the optional `/wordpress` path.

## Run the application

There are two useful development modes.

### Static compiled-asset mode

This is the simplest mode and matches the configured Replit workflow:

```bash
npm run build
php -S 0.0.0.0:5000 server.php
```

Run `npm run build` again after changing frontend TypeScript, JavaScript, CSS,
or imported assets.

### Vite hot-reload mode

Use two terminals when actively developing the frontend:

**Terminal 1 — Laravel API and web server**

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

**Terminal 2 — Vite**

```bash
npm run dev
```

Vite runs on port `5173` by default. Laravel's Blade shell loads the Vite
entrypoint from `resources/js/main.tsx`. If the application is being accessed
through a proxy or a non-default host, adjust `APP_URL` and the Vite host
configuration as appropriate.

### Available npm scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production frontend bundle in `public/build` |
| `npm test` | Run the frontend Vitest suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with coverage |
| `npm run php:dev` | Start the custom PHP server on port 5000 |

## Environment configuration

`.env.example` is the authoritative list of supported environment variables.
Never commit `.env` or secret values.

### Core variables

| Variable | Required | Purpose |
|---|---|---|
| `APP_KEY` | Yes | Laravel application encryption |
| `APP_URL` | Yes | Canonical application URL |
| `APP_ENV` | Yes | Environment name |
| `APP_DEBUG` | Local only | Enable detailed local errors |
| `JWT_SECRET` | Yes | JWT signing secret |
| `DB_CONNECTION` | Yes | `mysql` or `pgsql` |
| `DB_HOST`, `DB_PORT` | Usually | Database connection |
| `DB_DATABASE` | Yes | Application database name |
| `DB_USERNAME`, `DB_PASSWORD` | Usually | Database credentials |
| `QUEUE_CONNECTION` | Recommended | Queue backend, database by default |
| `MAIL_*` | Feature-dependent | Email delivery configuration |

### Optional integrations

| Integration | Main variables |
|---|---|
| WordPress CMS | `WORDPRESS_API_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APPLICATION_PASSWORD` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| Facebook OAuth | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI` |
| Google reCAPTCHA | `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` |
| PayOS | `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` |
| PayPal | PayPal sandbox/live client and payment variables |
| Analytics | `GA4_ENABLED`, `GOOGLE_ANALYTICS_PROPERTY_ID`, credentials path |
| Company metadata | `COMPANY_NAME`, `COMPANY_EMAIL`, `COMPANY_ADDRESS`, and related fields |

An integration can be left blank or disabled when it is not being used. The
application should degrade gracefully for optional content and analytics
features, but payment and authentication integrations must be configured before
their related flows are enabled.

## Database and seed data

### Development

Run migrations and seed data:

```bash
php artisan migrate --seed
```

Inspect migration state:

```bash
php artisan migrate:status
```

Useful development commands:

```bash
php artisan db:seed
php artisan migrate:fresh --seed  # destructive: development databases only
php artisan tinker
```

### Production

Back up the database before changing the schema. Apply structural migrations
without development seed data:

```bash
php artisan migrate --force
```

Do not use `migrate:fresh` in production. Do not run broad seeders against
production unless the specific seeder is known to be additive and idempotent.

### Core domain data

The main application data model includes:

- Users, roles, and participant permissions
- Accounts and account balances
- Categories and subcategories
- Income and expense transactions
- Budgets, savings habits, subscriptions, and payment records
- Preferences, translations, logos, settings, and audit history

## Testing

### Frontend tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

Frontend tests live in `resources/js/__tests__` and use Vitest, jsdom,
Testing Library, and user-event.

### Backend tests

```bash
php artisan test
```

Run a subset:

```bash
php artisan test --filter AccountControllerTest
php artisan test tests/Feature/TransactionPhotoUploadTest.php
```

Before backend tests, ensure the test database and `.env` configuration are
available. Tests should not point at a production database.

### Recommended pre-commit checks

```bash
npm test
npm run build
php artisan test
```

If a frontend source file changes, the compiled assets in `public/build` must
be regenerated for the PHP static-asset workflow.

## Build and deployment

### Production build

```bash
composer install --no-dev --optimize-autoloader
npm install
npm run build
```

Configure production environment variables securely, then run:

```bash
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

If queues are enabled, run a queue worker using the deployment platform's
process manager:

```bash
php artisan queue:work --tries=1
```

### Web server

For production, point Nginx or Apache at the Laravel `public/` directory and
route requests through `public/index.php`. Serve the Vite output generated in
`public/build`.

The PHP built-in server and `server.php` are convenient for development and
small previews; they are not a replacement for a production web server.

### Deployment safety

Before deploying:

1. Back up the production database.
2. Review pending migrations.
3. Test in a non-production environment.
4. Build frontend assets.
5. Run only intended migrations with `--force`.
6. Check `/health`, authentication, database access, queues, and logs.

See [`docs/SETUP_MANUAL.md`](docs/SETUP_MANUAL.md) for the longer operational
checklist and safe migration guidance.

## Project structure

```text
.
├── app/                         # Laravel controllers, models, services, policies
├── bootstrap/                   # Laravel bootstrap files
├── config/                     # Laravel and integration configuration
├── database/
│   ├── factories/              # Test data factories
│   ├── migrations/             # Database schema changes
│   └── seeders/                # Development and baseline data
├── docs/                        # Setup, architecture, API, and issue reports
├── public/                     # Web root and compiled frontend assets
├── resources/
│   ├── css/                    # Application styles
│   ├── js/
│   │   ├── App.tsx             # React application composition and routes
│   │   ├── main.tsx            # Vite/browser bootstrap entry
│   │   ├── components/         # Reusable UI components
│   │   ├── contexts/           # Application-wide React contexts
│   │   ├── hooks/              # Reusable React hooks
│   │   ├── pages/              # Route-level screens
│   │   ├── services/           # External and feature service clients
│   │   ├── utils/              # Shared frontend utilities
│   │   └── __tests__/          # Frontend tests
│   ├── lang/                   # Laravel translations
│   └── views/                  # Blade shell and server-rendered pages
├── routes/
│   ├── api.php                 # API routes
│   ├── web.php                 # Web and SPA fallback routes
│   └── console.php             # Artisan console routes
├── storage/                    # Logs, uploads, cache, and generated files
├── tests/                      # Laravel feature and unit tests
├── composer.json               # PHP dependencies and Artisan scripts
├── package.json                # Frontend dependencies and npm scripts
├── server.php                 # Custom PHP built-in server router
└── vite.config.js              # Vite and Vitest configuration
```

### Frontend entry points

- `resources/js/main.tsx` is the active browser entrypoint registered with
  Laravel Vite.
- `resources/js/App.tsx` composes providers, routes, layouts, and page screens.
- `resources/js/legacy-app.js` is retained only as a legacy bootstrap file and
  is not the active Vite entry.

## API and integrations

The API is defined in [`routes/api.php`](routes/api.php). Common public and
authentication endpoints include:

| Endpoint | Purpose |
|---|---|
| `GET /health` | Application health check |
| `GET /api/status` | API status |
| `POST /api/auth/register` | Create an account |
| `POST /api/auth/login` | Authenticate |
| `GET /api/auth/config` | Read public auth configuration |
| `POST /api/email/verify` | Verify an email |
| `POST /api/email/resend` | Resend verification |
| `GET /api/wordpress/posts` | Read CMS posts when WordPress is enabled |
| `GET /api/wordpress/pages` | Read CMS pages when WordPress is enabled |
| `GET /api/wordpress/search` | Search CMS content |

Most account, transaction, admin, and payment endpoints require JWT
authentication and role checks. Use the route file and controller validation
as the source of truth for request and response details.

API documentation and testing references:

- [`docs/api-testing-guide.md`](docs/api-testing-guide.md)
- [`docs/WORDPRESS_HEADLESS_CMS_API.md`](docs/WORDPRESS_HEADLESS_CMS_API.md)
- [`docs/WORDPRESS_LARAVEL_API_TESTING.md`](docs/WORDPRESS_LARAVEL_API_TESTING.md)

## Security notes

- Never commit `.env`, API keys, OAuth secrets, payment credentials, private
  keys, or production database dumps.
- Generate a unique `APP_KEY` and `JWT_SECRET` per environment.
- Use HTTPS in production.
- Keep `APP_DEBUG=false` in production.
- Use least-privilege database and integration credentials.
- Review authorization and participant permissions when changing account or
  transaction endpoints.
- Back up production data before migrations.
- Treat receipt photos and financial records as sensitive personal data.
- Review privacy, retention, email, payment, and consumer-protection
  obligations with qualified professionals before production expansion.

## Troubleshooting

### `JWT_SECRET` is missing

Generate it and clear cached configuration:

```bash
php artisan jwt:secret --force
php artisan optimize:clear
```

### The browser shows old frontend code

The PHP workflow serves compiled assets. Rebuild them:

```bash
npm run build
```

### Database connection errors

Check `DB_CONNECTION`, host, port, database name, username, and password.
Then verify the database is reachable and run:

```bash
php artisan migrate:status
```

### Uploaded files or images are unavailable

Create Laravel's public storage link:

```bash
php artisan storage:link
```

### Vite cannot connect

Use `npm run dev` in a separate terminal, confirm port `5173` is available,
and check `APP_URL` and the host/proxy configuration. For the compiled-asset
workflow, stop Vite and use `npm run build` instead.

### An authenticated page returns `401`

This usually means there is no valid JWT session, the token has expired, or
the API is using a different environment's secret. Sign in again and verify
that `JWT_SECRET` is configured consistently.

## Documentation

| Document | Purpose |
|---|---|
| [`docs/SETUP_MANUAL.md`](docs/SETUP_MANUAL.md) | Detailed developer setup and operations manual |
| [`docs/architecture-analysis.md`](docs/architecture-analysis.md) | Architecture analysis and technical boundaries |
| [`docs/api-testing-guide.md`](docs/api-testing-guide.md) | API testing guidance |
| [`docs/WORDPRESS_HEADLESS_CMS_API.md`](docs/WORDPRESS_HEADLESS_CMS_API.md) | WordPress integration API reference |
| [`docs/security-center-requirements.md`](docs/security-center-requirements.md) | Security-center requirements |
| [`docs/payment_subscription_plan.md`](docs/payment_subscription_plan.md) | Subscription and payment planning |
| [`docs/technical-debt-report.md`](docs/technical-debt-report.md) | Known technical debt and follow-up areas |
| [`docs/issues/`](docs/issues/) | Issue reports and change plans |

## Contributing

1. Create a focused branch.
2. Read the relevant setup and architecture documentation.
3. Keep business rules in Laravel services/controllers and keep frontend API
   calls consistent with existing utilities.
4. Add or update tests for behavior changes.
5. Run the relevant frontend and backend checks.
6. Run `npm run build` when frontend source or assets change.
7. Keep migrations additive and review production impact before merging.
8. Update documentation when setup, routes, environment variables, or
   operational behavior changes.

When in doubt, prefer a small, tested change that preserves existing API
contracts and user data.