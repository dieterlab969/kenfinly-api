# Overview

Kenfinly is a personal finance application designed to help users track, understand, and improve their financial health. It offers features such as expense/income tracking (multi-account, multi-currency), budget planning, analytical dashboards, goal-oriented savings, and smart spending notifications. The project aims to provide a comprehensive and intuitive tool for personal financial management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend

Built with Laravel 12 (PHP 8.2+), providing a REST API.
- **Authentication**: JWT via `tymon/jwt-auth`.
- **Database**: PostgreSQL with Eloquent ORM.
- **Authorization**: Role-Based Access Control (RBAC) with 'owner', 'editor', 'viewer' roles.
- **Core Models**: `users`, `roles`, `user_roles`, `accounts`, `categories`, `transactions`.
- **Features**: Multi-currency support (USD, VND), web-based CSV import/export, payment module (licenses, subscriptions), multi-user collaboration, participant management, comprehensive API endpoints.
- **Email Verification**: Two-step email verification for new users with secure tokens, rate limiting, and status tracking.
- **Bot Prevention**: Google reCAPTCHA v3 on forms, email validation (syntax, DNS/MX, disposable email detection), bot pattern analysis (username, rapid registration, suspicious user agent), IP blocking, API rate limiting, and email bounce tracking. Configurable via Artisan commands.
- **Transaction Management**: Detailed transaction views with photo uploads (server-side optimization), and comprehensive change history tracking.

## Frontend

A Single Page Application (SPA) using React 19.2, Vite 7.x, and Tailwind CSS 4.0.
- **Styling**: Tailwind CSS for utility-first design.
- **Framework**: React with React Router.
- **State Management**: React Context API for authentication and user session.
- **UI/UX**: Responsive design, blue gradient theme, interactive dashboards (Recharts), modals for transaction entry.
- **Multilanguage**: Full English and Vietnamese support via a shared JSON manifest, with graceful degradation for offline use.

## Multilanguage System

- **Architecture**: `resources/lang/translations.json` as a single source of truth. Backend seeds database, Frontend uses manifest for fallbacks.
- **Functionality**: Supports English and Vietnamese, with offline mode ensuring UI remains functional.

## CSV Import/Export System

- **Export**: Date range and account-specific filtering, role-based access, proper CSV formatting.
- **Import**: File validation (size, MIME type, headers), multiple date format support, row-by-row validation with error reporting, automatic rollback on errors, automatic category creation.

## Transaction Detail and Photo Management

- **Detail View**: Transaction details, photos, and history tabs. Role-based editing permissions (Owner/Editor vs. Viewer).
- **Photo Management**: Multiple receipt photo uploads (up to 10 photos, 20MB/photo), JPEG, PNG, GIF, WebP support. Server-side image optimization (resizing, compression).
- **Change History**: Audit trail of all transaction changes, including user, timestamp, and detailed diffs.

## Development & Deployment

- **Environment**: Dockerized using Laravel Sail.
- **Concurrency**: `npm-concurrently` for simultaneous service execution.
- **Tooling**: Composer, npm, Laravel Pint, PHPUnit, Laravel Pail, Laravel Tinker.
- **CI/CD**: GitHub Actions.

# External Dependencies

- **HTTP Client**: Guzzle 7.x.
- **Error Handling**: Whoops (development).
- **CORS**: Fruitcake PHP-CORS.
- **Testing & Development**: Faker, Mockery, Hamcrest.
- **Utilities**: Carbon, Monolog, Ramsey UUID, Symfony Components.
- **Cron Expression Parsing**: `dragonmantank/cron-expression`.
- **String Manipulation**: `doctrine/inflector`, `doctrine/lexer`.
- **Image Processing**: Intervention Image.
- **Email Delivery**: SendGrid (via Replit integrations).
- **Bot Protection**: Google reCAPTCHA v3.