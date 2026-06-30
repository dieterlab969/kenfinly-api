# Kenfinly Architecture Analysis

> This document summarizes the current Kenfinly staging branch architecture based on a read-only code analysis.

## High-level System Architecture Overview

- **Backend**: Laravel 12 PHP application serving JSON APIs and a single-page React app.
- **Frontend**: React 19 app built with Vite, using Tailwind CSS and React Router v7.
- **Authentication**: JWT-based API guard (`auth:api`) with `tymon/jwt-auth` and SPA token storage.
- **Content/Marketing**: WordPress is integrated as a headless CMS under `public/wordpress` and exposed through API routes.
- **Deployment model**: Monolithic Laravel app with `routes/web.php` rendering the SPA fallback and `routes/api.php` handling REST API endpoints.

## Frontend Structure and Organization (Updated for TSX Migration)

- **Frontend source code is now located in** `resources/ts` (migrated from `resources/js`), reflecting the transition to TypeScript React (`.tsx` files).
- **Entry point:**  
  `resources/ts/app.tsx` initializes global app configuration and wraps the SPA with React Router and optional Google reCAPTCHA. This replaces the previous `app.jsx`.
- **Main application shell:**  
  `resources/ts/components/App.tsx` defines public, authenticated, and super-admin routes, updated to use strict typing and TypeScript interfaces.
- **Route protection components:**
  - `ProtectedRoute.tsx` handles route guarding for authenticated users.
  - `SuperAdminRoute.tsx` restricts access to super-admin-only administrative routes.  
    Both components now leverage TypeScript for enhanced type safety.
- **State and context providers:**
  - `AuthContext.tsx` manages authentication flows including login, registration, logout, and token management with typed context values.
  - `TranslationContext.tsx` loads translations via API with fallback to a manifest, now typed for better reliability.
  - `LogoContext.tsx` fetches brand logo assets with explicit typing.
- **API client:**
  - `resources/ts/utils/api.ts` creates a centralized Axios instance configured with baseURL `/api` and JWT token injection, fully typed.
  - Note: Some legacy pages may still use raw `axios` calls directly, leading to inconsistent API client usage. Refactoring these is recommended to ensure uniformity and type safety.
- **UI organization:**
  - `pages/` contains top-level views including public pages, admin pages, and the `halo` dashboard, all migrated to `.tsx`.
  - `components/` holds reusable UI elements, modals, forms, and layout wrappers, rewritten in TypeScript.
  - `components/admin/` and `pages/admin/` contain admin-management screens, updated for TSX and strict typing.
  - `components/halo/` and `pages/halo/` contain the Halo habit/workflow experience, fully migrated.
  - `components/subscription/` contains checkout and plan selection flows, now with typed components and hooks.

---

### Notes on Migration Status and Next Steps

- The previous frontend structure based on `.jsx` files is now **obsolete** following the migration plan to TSX. All new development and maintenance should be conducted in the TypeScript React codebase under `resources/ts`.
- Ensure all components and utilities adhere to strict typing to maximize the benefits of the migration.
- Prioritize refactoring legacy raw `axios` calls to use the centralized, typed API client for consistency and maintainability.
- Review route protection and context providers to leverage TypeScript interfaces fully, improving developer experience and reducing runtime errors.
- Maintain the Tailwind CSS integration within TSX files as per the migration roadmap to keep UI styling consistent and modern.

---

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
