# Kenfinly Architecture Analysis

> This document summarizes the current Kenfinly staging branch architecture based on a read-only code analysis.

## High-level System Architecture Overview

- **Backend**: Laravel 12 PHP application serving JSON APIs and a single-page React app.
- **Frontend**: React 19 app built with Vite, using Tailwind CSS and React Router v7.
- **Authentication**: JWT-based API guard (`auth:api`) with `tymon/jwt-auth` and SPA token storage.
- **Content/Marketing**: WordPress is integrated as a headless CMS under `public/wordpress` and exposed through API routes.
- **Deployment model**: Monolithic Laravel app with `routes/web.php` rendering the SPA fallback and `routes/api.php` handling REST API endpoints.

## Frontend Structure and Organization

- Frontend source is in `resources/js`.
- Entry point: `resources/js/app.jsx` initializes global app config and wraps the SPA with React Router and optional Google reCAPTCHA.
- Main application shell: `resources/js/components/App.jsx` defines public, authenticated, and super-admin routes.
- Route protection: `ProtectedRoute.jsx` for authenticated users and `SuperAdminRoute.jsx` for super-admin-only administrative routes.
- State/context providers:
  - `AuthContext.jsx` manages authentication, login/register/logout, and token setup.
  - `TranslationContext.jsx` loads translations through API and falls back to a manifest.
  - `LogoContext.jsx` fetches brand logo assets.
- API client:
  - `resources/js/utils/api.js` creates a centralized axios instance with baseURL `/api` and JWT token injection.
  - Some pages still use raw `axios` directly, creating inconsistent API client usage.
- UI organization:
  - `pages/` contains top-level views including public pages, admin pages, and the `halo` dashboard.
  - `components/` contains reusable UI pieces, modals, forms, and layout wrappers.
  - `components/admin/` and `pages/admin/` contain admin-management screens.
  - `components/halo/` and `pages/halo/` contain the Halo habit/workflow experience.
  - `components/subscription/` contains checkout and plan selection flows.

## Backend Structure and Organization

- Routes:
  - `routes/api.php` defines all REST API endpoints.
  - `routes/web.php` exposes a simple `/up` health check and SPA wildcard fallback.
- Controllers: `app/Http/Controllers/Api` contains API controllers, while admin APIs and sitemap logic are included in dedicated controllers.
- Models: `app/Models` includes domain entities such as `User`, `Account`, `Transaction`, `Category`, `Attendance`, `Commitment`, `Payment`, `Subscription`, `Role`, `License`, `Translation`, and many others.
- Services: `app/Services` encapsulates key business logic, including attendance handling, payment processing, ledger rollups, email verification, and WordPress integration.
- Policies: `app/Policies` contains at least transaction-level authorization. Authorization is also implemented in controllers and middleware.
- Observers/providers: The codebase uses Laravel service providers and model factories, though some standard providers are absent from the repo listing.

## API Architecture and Endpoints

### Public API Endpoints

- `/api/logo`
- `/api/subscription-plans`
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/config`
- `/api/settings/logos`
- `/api/settings/company`
- `/api/analytics/public-stats`
- `/api/consent`
- `/api/email/verify`
- `/api/email/resend`
- `/api/email/verification-status` (protected)
- `/api/languages`
- `/api/languages/{code}/translations`
- `/api/waitlist`
- `/api/webhooks/payment`
- `/api/wordpress/*` for WordPress content endpoints

### Authenticated API Endpoints

- `/api/auth/logout`
- `/api/auth/refresh`
- `/api/auth/me`
- `/api/logo/upload`
- `/api/dashboard`
- `/api/attendance/*`
- `/api/halo/current-session`
- `/api/halo/transactions`
- `/api/user/hourly-rate`
- `/api/user/hourly-rate/history`
- `/api/commitments/*`
- `/api/categories`
- `/api/accounts`
- `/api/transactions`
- `/api/profile`
- `/api/csv/import`
- `/api/csv/export`
- `/api/payments/*`
- `/api/licenses/my-licenses`
- `/api/participants/*`
- `/api/invitations/{token}/accept`
- `/api/analytics/*`

### Admin API Endpoints

Protected by `auth:api` and `SuperAdminMiddleware` under `/api/admin`:

- `/api/admin/payment-gateways/*`
- `/api/admin/subscriptions`
- `/api/admin/payments/*`
- `/api/admin/payment-dashboard/overview`
- `/api/admin/dashboard`
- `/api/admin/accounts`
- `/api/admin/users`
- `/api/admin/roles`
- `/api/admin/categories`
- `/api/admin/languages`
- `/api/admin/licenses`
- `/api/admin/settings`
- `/api/admin/cache/*`
- `/api/admin/translations`
- `/api/admin/transactions`
- `/api/admin/logos`
- `/api/admin/favicon`
- `/api/admin/wordpress/cache/clear`
- `/api/admin/sitemap/generate`

## Authentication and Authorization Flow

- The application uses JWT authentication for API access via the `api` guard in `config/auth.php`.
- `AuthController` handles:
  - registration (`/auth/register`)
  - login (`/auth/login`)
  - logout (`/auth/logout`)
  - token refresh (`/auth/refresh`)
  - the current user endpoint (`/auth/me`)
  - application config retrieval (`/auth/config`)
- Email verification is enforced during login and registration via `EmailVerificationController` and `EmailVerificationService`.
- `AuthContext` stores JWT tokens in `localStorage` and applies them to axios requests.
- Access control is applied through:
  - `auth:api` middleware for protected endpoints
  - `SuperAdminMiddleware` for admin routes
  - per-controller `authorizeResource()` and policy checks for transactions
  - explicit owner checks in controllers such as `CommitmentController` and `CsvController`
- Super-admin route access is enforced in the frontend by `SuperAdminRoute.jsx` and backend by `SuperAdminMiddleware`.

## Database Schema: Entities, Relationships, and Data Models

### Core Entities

- `users`
  - Core identity record with JWT auth support
  - Stores email verification status, timezone, hourly rate, Halo streak data, language preference, and status
- `accounts`
  - Belongs to a user and holds a balance, currency, icon, and color
- `transactions`
  - Linked to user, account, and category
  - Supports income/expense types and real/halo ledger types
  - Tracks `amount_minor`, `currency`, `source_type`, `source_id`, and idempotency keys
  - Includes transactional receipt/photo support
- `categories`
  - Hierarchical category tree with parent/child relationships
- `attendances`
  - Halo session records with status, duration, expected end time, ratings, reward transaction linkage, and reminders
- `commitments`
  - Savings/goal commitments with goal/current amounts, images, deadlines, completion and kill statuses

### Payments and Subscriptions

- `subscription_plans`
  - price, currency, billing cycle, features, active flag
- `subscriptions`
  - user subscription state, plan relation, gateway reference, status and lifecycle timestamps
- `payments`
  - user payments, gateway transaction references, status, metadata, and failed/complete timestamps
- `payment_methods`
  - stored payment instruments per user, default selection, provider metadata
- `payment_gateways` / `payment_gateway_credentials`
  - gateway management and credential storage for admin operations
- `licenses`
  - license records tied to users and status

### Authorization and Collaboration

- `roles` and `user_roles`
  - role-based access control, including `super_admin`
- `account_participants`
  - multi-user account participation model
- `invitations`
  - invite-based account access

### Localization and Consent

- `languages`, `translations`
  - language catalog and runtime translations
- `user_consents`
  - user consent and marketing consent tracking

### Audit, Media, and Summaries

- `email_verifications`
  - token-based email verification tracking
- `transaction_photos`
  - transaction attachments
- `transaction_change_logs`
  - audit history for transaction changes and photo events
- `ledger_daily_summaries`
  - write-time daily rollup summaries for reporting
- `halo_histories`
  - persisted Halo session history per day

## Service Layer Architecture and Patterns

- The project uses a service layer in `app/Services` to encapsulate business logic and transactional flows.
- Notable services:
  - `EmailVerificationService` – email verification token lifecycle and email dispatch through `SendGridService`
  - `AttendanceService` – Halo session lifecycle, duration calculation, auto-close, reward transaction creation, streak tracking, and history writes
  - `LedgerSummaryService` – write-time daily rollup updates to `ledger_daily_summaries`
  - `TransactionPhotoService` – photo storage and cleanup logic
  - `TransactionChangeLogService` – transaction audit trail
  - `PaymentProcessingService` – payment processing orchestration for subscription payments
  - `CommitmentService` – commitment creation and lifecycle changes
  - `WordPressService` – headless CMS access
  - `GoogleAnalyticsService` – analytics integration
- Controllers generally orchestrate requests, validate input, delegate to services, and format JSON responses.
- Some business rules are still embedded in controllers, especially in transaction and payment controllers.

## Summary

Kenfinly is implemented as a Laravel SPA monolith with a React frontend and a clearly separated REST API. The backend includes a domain-rich finance-oriented model, a Halo session workflow, subscription/payment flows, and admin controls. Frontend routing is centralized in `App.jsx`, backed by contexts for authentication and translation. The system has a layered service architecture but also contains some controller-level complexity and repeated patterns.
