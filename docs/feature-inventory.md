# Kenfinly Feature Inventory

**Product:** Kenfinly personal finance and financial-discipline platform
**Status:** Current product-state reference
**Reviewed:** 2026-08-17
**Scope:** Active Laravel API and TypeScript/React SPA

## How to read this inventory

This document describes capabilities that are present in the current
repository. The implementation references point to the active code paths
rather than older template copies.

- **API-backed capability** means the frontend and backend have a defined
  integration surface.
- **Operational capability** means the backend or admin API is implemented for
  privileged workflows.
- **Registered UI flow** means a screen or flow is registered in the active
  frontend route registry. A registered screen is not, by itself, proof that
  every step is connected to a production backend workflow.

## Product snapshot

Kenfinly combines personal finance management with habit formation and the
Halo productivity system. The current product surface includes:

- JWT-authenticated user accounts with email and social sign-in options.
- Wallet/account, category, transaction, transfer, and reporting workflows.
- Profile, security, preferences, localization, and account self-service.
- Personal recurring-subscription tracking and platform subscription billing.
- Halo attendance, points, commitments, hourly-rate governance, and Pomodoro
  synchronization.
- Saving habits, tracking, statistics, and achievements.
- WordPress-backed content, public branding, consent, and administrative
  operations.

The active frontend entrypoint contains **127 route declarations**:
6 public routes, 2 authenticated-shell routes, and 119 feature routes. The
admin route registry is intentionally present but currently contains no active
TypeScript route declarations; the admin API and legacy admin page modules
remain separate operational surfaces.

## 1. Identity, authentication, and access

**Status:** API-backed

### Capabilities

- Register with password confirmation.
- Login, logout, JWT refresh, and authenticated-session lookup.
- Optional Google reCAPTCHA protection for registration and login.
- Email verification, verification-status lookup, and verification-email
  resend.
- Google and Facebook one-click OAuth redirect/callback flows.
- Beta-access verification and waitlist submission.
- Authenticated API protection through `auth:api`.
- Halo integrity middleware for protected financial and productivity
  workflows.

### Implementation

- **Backend:** `app/Http/Controllers/Api/AuthController.php`,
  `EmailVerificationController.php`, `GoogleAuthController.php`,
  `FacebookAuthController.php`, and `WaitlistController.php`
- **Frontend:** `resources/js/contexts/AuthContext.jsx`,
  `resources/js/pages/SignIn.tsx`, `SignUp.tsx`, `VerifyEmail.jsx`,
  `GoogleAuthSuccess.tsx`, and `FacebookAuthSuccess.tsx`
- **Routes:** `/api/auth/register`, `/api/auth/login`,
  `/api/auth/logout`, `/api/auth/refresh`, `/api/v1/auth/google/*`,
  `/api/v1/auth/facebook/*`, and `/api/email/*`

## 2. Profile, preferences, and account self-service

**Status:** API-backed

### Capabilities

- View and update profile name, email, phone, address, date of birth, and
  gender.
- Upload and replace a profile avatar.
- Persist marketing-preference toggles.
- Persist notification preferences with optimistic frontend updates and
  server-side validation.
- View and update security settings.
- Change password and PIN.
- Save a preferred language and currency.
- Deactivate an account or schedule account deletion.
- Capture and remove consent preferences.
- Securely log out from the account experience.

### Implementation

- **Backend:** `ProfileController`, `ProfileUpdateService`,
  `AvatarUploadService`, `UserPreferenceController`,
  `NotificationSettingController`, `SecuritySettingsController`, and
  `UserAccountController`
- **Frontend:** `resources/js/pages/PersonalInfo.tsx`,
  `NotificationSetting.tsx`, `Security.tsx`, `Language.tsx`, `Currency.tsx`,
  `DeactiveAccount.tsx`, `DeleteAccount.tsx`, and
  `DeleteDeactivateAccount.tsx`
- **Routes:** `/api/profile`, `/api/profile/avatar`,
  `/api/user/preferences/marketing`, `/api/user/notification-settings`,
  `/api/v1/user/security-settings`, `/api/v1/user/change-password`,
  `/api/v1/user/change-pin`, `/api/v1/user/deactivate`,
  `/api/v1/user/account`, `/api/user/language`, and `/api/currency/save`

### Avatar handling

Avatars are validated as image files up to 2 MB, checked by MIME bytes,
scaled down to a maximum 400×400 image, encoded as JPEG, stored on the public
disk, and replaced files are cleaned up safely. External OAuth avatar URLs are
not deleted as local files.

## 3. Accounts, wallets, and collaboration

**Status:** API-backed

### Capabilities

- Account CRUD with account balances and account metadata.
- Wallet-to-wallet transfers performed atomically across both transaction
  records and balances.
- Transfer safeguards, including same-currency restrictions where applicable.
- Bank name and account-type metadata.
- Account participants and invitations:
  - invite a participant,
  - accept an invitation,
  - list account participants,
  - remove a participant.

### Implementation

- **Backend:** `AccountController`, `TransferController`,
  `ParticipantController`, `Account` model, and transaction balance
  services
- **Frontend:** `WalletManagement.tsx`, `BankAndCard.tsx`, and the registered
  send/transfer flow pages
- **Routes:** `/api/accounts`, `/api/v1/accounts/transfer`,
  `/api/participants/invite`, `/api/invitations/{token}/accept`, and the
  account-participant routes

## 4. Transactions, categories, and data portability

**Status:** API-backed

### Capabilities

- Transaction create, list, view, update, and delete.
- Income, expense, and transfer transaction flows.
- Account and category association.
- User-owned category creation, editing, and deletion.
- Hierarchical category reads, including system categories.
- Protection for system categories from user mutation.
- Receipt/photo attachment and deletion.
- Transaction change logging.
- CSV transaction import and export.
- Balance updates and daily/category ledger rollups on transaction writes.
- Immutability rules for Halo, reward, and other non-manual source records.

### Implementation

- **Backend:** `TransactionController`, `CategoryController`,
  `CsvController`, `TransactionPhoto`, `TransactionChangeLog`,
  `LedgerSummaryService`, and related models
- **Frontend:** `Home.tsx`, `WalletManagement.tsx`,
  `CategoryManagement.tsx`, `AddTransactionModal.tsx`, and
  `EditTransactionModal.tsx`
- **Routes:** `apiResource('transactions')`,
  `apiResource('accounts')`, category CRUD routes, transaction-photo routes,
  and `/api/csv/import` plus `/api/csv/export`

## 5. Dashboard and reporting

**Status:** API-backed

### Capabilities

- Dashboard overview with income, expenses, net values, and account
  summaries.
- Recent transaction visibility.
- Time-series reporting for expense and balance history.
- Analytics summary, category breakdown, and trend endpoints.
- Public aggregate statistics for marketing surfaces.
- Write-time ledger summaries to support efficient reporting.
- Chart-oriented frontend surfaces for area, bar, pie, and line views.

### Implementation

- **Backend:** `TransactionController::getDashboardData`,
  `AnalyticsController`, `PublicAnalyticsController`, and
  `LedgerSummaryService`
- **Frontend:** `Home.tsx`, `Analytics.tsx`, `AreaChart.tsx`,
  `BarChart.tsx`, `PieChart.tsx`, and `LineChart.tsx`
- **Routes:** `/api/dashboard`, `/api/analytics/summary`,
  `/api/analytics/category-breakdown`, `/api/analytics/trends`,
  `/api/v1/analytics/summary`, and `/api/analytics/public-stats`

## 6. Halo productivity and financial-discipline system

**Status:** API-backed

### Capabilities

- Daily Halo attendance status.
- Start, complete, and kill attendance sessions.
- Persistent current-session state for countdown continuity.
- Halo-aware transaction creation and history.
- Halo points, point-ledger activity, welcome rewards, and streak-related
  user state.
- Commitment creation, listing, viewing, completion, and termination.
- Secure commitment asset uploads where required by the workflow.
- Hourly-rate update and history.
- Pomodoro start, state, and completion synchronization.

### Implementation

- **Backend:** `AttendanceController`, `HaloSessionController`,
  `HaloTransactionController`, `CommitmentController`,
  `HourlyRateController`, `PomodoroController`,
  `HaloPointLedgerService`, and `AttendanceService`
- **Frontend:** `resources/js/pages/halo/HaloDashboard.tsx`,
  `resources/js/components/halo/HaloLayout.tsx`, and the `/halo` route
- **Routes:** `/api/attendance/*`, `/api/halo/current-session`,
  `/api/halo/transactions`, `/api/commitments/*`,
  `/api/v1/user/hourly-rate*`, and `/api/v1/pomodoro/*`

## 7. Saving habit tracker

**Status:** API-backed

### Capabilities

- Create, list, view, update, and delete user saving habits.
- Toggle completion for individual dates.
- Retrieve tracking history for a habit.
- Bulk-track multiple dates.
- Per-habit and overall statistics.
- Achievement catalog and unlocked-achievement views.
- Achievement checks after qualifying completed tracking activity.

### Implementation

- **Backend:** `app/Http/Controllers/Api/SavingTracker/`,
  `Habit`, `HabitTracking`, and achievement services
- **Routes:** `/api/saving-tracker/habits`,
  `/api/saving-tracker/tracking/*`, `/api/saving-tracker/stats/*`, and
  `/api/saving-tracker/achievements/*`
- These routes require authentication and Halo integrity checks.

## 8. Subscriptions, payments, and commerce

**Status:** Mixed: API-backed user and platform workflows; privileged
operational administration

Kenfinly has two distinct subscription concepts and they should not be
conflated:

### Personal recurring-subscription tracker

Tracks services a user pays for personally, such as streaming or software
subscriptions.

- User-subscription CRUD.
- Ownership checks scoped to the authenticated user.
- Payment-history retrieval.
- Reminder records and scheduled reminder delivery.
- Dedicated frontend management surface:
  `SubscriptionManagement.tsx`.

**Backend:** `UserSubscriptionController`, `UserSubscriptionService`,
`UserSubscriptionReminder`, and `UserPaymentHistory`.

### Kenfinly platform subscriptions and payments

Supports the product’s own plans, licenses, payment methods, payment records,
and gateway processing.

- Public subscription-plan listing.
- Payment-intent and payment-information flows.
- Payment-method list, add, update, delete, and default selection.
- Payment history and license lookup.
- Payment webhooks and processed-payment tracking.
- Payment retry handling.
- WooCommerce payment callback with signature verification and throttling.
- Super-admin payment-gateway CRUD, activation toggles, encrypted credential
  management, credential verification, and audit logs.
- Subscription reminder scheduling for personal subscriptions.

**Backend:** `PaymentController`, `PaymentProcessingService`,
`SubscriptionController`, `SubscriptionPlanController`,
`PaymentGatewayController`, `PaymentDashboardController`,
`WooCommerceWebhookController`, and `ProcessPremiumActivation`.

## 9. Localization and currency

**Status:** API-backed

### Capabilities

- Language catalog retrieval.
- Per-language translation retrieval.
- Authenticated user language preference updates.
- React language context and `react-i18next` integration.
- English and Vietnamese locale resources.
- Currency catalog retrieval.
- Currency detection and authenticated currency preference saving.
- Currency-aware frontend display and subscription-pricing support.

### Implementation

- **Backend:** `LanguageController` and `CurrencyController`
- **Frontend:** `LanguageContext.tsx`, `CurrencyContext.tsx`,
  `resources/js/i18n.ts`, `resources/js/locales/en.json`,
  `resources/js/locales/vi.json`, `Language.tsx`, and `Currency.tsx`

## 10. Public content, branding, and consent

**Status:** Mixed: public API-backed content and operational administration

### Capabilities

- Public company settings, logo, and public logo listings.
- Authenticated logo upload.
- Admin logo and favicon management.
- Site settings CRUD and cache clearing.
- Sitemap generation.
- Cookie/marketing consent capture, retrieval, and deletion.
- WordPress headless CMS access for:
  - site information and connection status,
  - posts and pages,
  - slug lookups,
  - categories and tags,
  - media,
  - custom post types,
  - search,
  - menus.
- WordPress cache management for administrators.

### Implementation

- **Backend:** `PublicSettingsController`, `PublicLogoController`,
  `LogoController`, `LogoManagementController`,
  `FaviconManagementController`, `SettingsManagementController`,
  `ConsentController`, `WordPressController`, and `SitemapController`
- **Frontend:** `LogoContext.tsx`, `Logo.tsx`, public information pages,
  `CookieConsent.tsx`, and the registered support/content screens
- **Routes:** `/api/settings/*`, `/api/logo*`, `/api/consent/*`,
  `/api/wordpress/*`, and admin branding/settings routes

## 11. Administrative operations

**Status:** Operational backend surface; active TypeScript admin registry is
not yet populated

The super-admin API provides:

- Admin dashboard summaries.
- User, role, account, category, language, license, and transaction
  management.
- Site settings, logo, favicon, cache, and translation management.
- Payment gateway and payment-dashboard operations.
- WordPress cache management.

The repository also contains legacy admin page modules under
`resources/js/pages/admin/`. They are not included in the active
`adminRoutes.tsx` registry, so this inventory treats them as available
operational modules rather than claiming they are currently reachable through
the active TypeScript router.

## 12. Frontend delivery and application architecture

**Status:** Implemented platform capability

- TypeScript/React is the active frontend entrypoint.
- Public, authenticated, feature, and admin route ownership is explicit.
- Route pages are loaded through React lazy modules and Vite dynamic imports.
- A shared loading state handles lazy navigation.
- A route error boundary provides recoverable failures for lazy modules.
- Feature CSS is loaded at the route boundary instead of shipping the former
  global feature stylesheet collection to every screen.
- The authenticated shell and feature-only providers are isolated from public
  routes.
- The production frontend build, route registry tests, TypeScript checks,
  PHP lint, Laravel tests, and quality-gate workflows are available through
  the repository’s validation scripts.

### Current route-surface note

The active route registry contains many financial-service screens for sending
money, requesting money, invoices, bills, QR payments, cards, investments,
and related flows. These are recorded as **registered UI flows** until their
end-to-end API coverage has been independently confirmed. Core accounts,
transactions, transfers, reporting, profile, settings, subscriptions, and
Halo workflows are documented above as API-backed because their backend
contracts are present in the current route and controller surface.

## Source-of-truth references

- Active frontend composition: `resources/js/App.tsx`
- Route registries: `resources/js/app/routes/`
- API route definitions: `routes/api.php`
- Frontend route inventory: `docs/issues/frontend-route-inventory.md`
- Backend controller inventory: `docs/issues/backend-controller-inventory.md`
- Refactor and quality-gate status:
  `docs/issues/frontend-backend-quality-gates.md`
- Feature-specific implementation notes: `docs/features/`

## Summary

Kenfinly is currently a broad, API-backed personal-finance product with a
working foundation for identity, wallets, transactions, reporting,
preferences, subscriptions, and Halo productivity. The repository also
contains substantial commerce, CMS, administrative, saving-tracker, and
financial-service UI coverage. The most important product-state distinction is
between the core API-backed workflows and the larger set of registered UI
flows that still require end-to-end verification before being presented as
fully shipped capabilities.