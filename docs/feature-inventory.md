# Kenfinly Feature Inventory

This document identifies and describes the primary features implemented in the current Kenfinly staging branch.

## 1. Authentication System

- **Implementation**: JWT authentication powered by `tymon/jwt-auth`.
- **Key components**:
  - `App/Http/Controllers/Api/AuthController.php`
  - `App/Models/User.php`
  - `config/auth.php`
  - `resources/js/contexts/AuthContext.jsx`
  - Frontend pages: `Login.jsx`, `Register.jsx`, `VerifyEmail.jsx`, `VerificationPending.jsx`
- **Behavior**:
  - User registration with password confirmation and optional Google reCAPTCHA.
  - Login with email/password and optional reCAPTCHA.
  - JWT token issuance, refresh, and logout.
  - `auth:api` middleware protects all user-specific API endpoints.
  - Email verification flows are enforced during login and registration.

## 2. User Profile Management

- **Implementation**: User profile retrieval and update via profile endpoints.
- **Key components**:
  - `App/Http/Controllers/Api/ProfileController.php`
  - `resources/js/components/ProtectedRoute.jsx`
  - `resources/js/contexts/AuthContext.jsx`
- **Behavior**:
  - `GET /api/profile` returns the authenticated user's profile, roles, and language.
  - `PUT /api/profile` allows updating the user's name.
  - Frontend stores authenticated user state and uses it for route protection.

## 3. Dashboard Functionality

- **Implementation**: User-level Halo dashboard and summary analytics.
- **Key components**:
  - `App/Http/Controllers/Api/TransactionController.php#getDashboardData`
  - `App/Services/AttendanceService.php`
  - `resources/js/pages/halo/HaloDashboard.jsx`
  - `resources/js/components/halo/HaloLayout.jsx`
  - `resources/js/components/halo/HaloRitualCard.jsx` (within dashboard page)
- **Behavior**:
  - Monthly income/expense summaries and net values.
  - 7-day expense chart and 7-month balance history.
  - Recent transactions list and account summaries.
  - Halo session lifecycle with start/complete/kill actions.
  - Frontend countdown timer and session state display.

## 4. Transaction Handling

- **Implementation**: Full transaction CRUD, photo uploads, CSV import/export, categories, and accounts.
- **Key components**:
  - `App/Http/Controllers/Api/TransactionController.php`
  - `App/Http/Controllers/Api/HaloTransactionController.php`
  - `App/Models/Transaction.php`
  - `App/Services/LedgerSummaryService.php`
  - `App/Models/Category.php`, `Account.php`, `TransactionPhoto.php`, `TransactionChangeLog.php`
  - `resources/js/components/AddTransactionModal.jsx`
- **Behavior**:
  - `apiResource('transactions')` exposes create/read/update/delete.
  - Transaction immutability for halo/reward and non-manual source records.
  - Photo attachment endpoints for transaction receipts.
  - `CsvController` supports transaction export and import.
  - Transactions are tied to accounts and categories, and account balances are updated on create/update/delete.
  - Ledger rollup summary service updates `ledger_daily_summaries` on transaction writes.

## 5. Reporting Capabilities

- **Implementation**: Analytics endpoints and admin payment dashboards.
- **Key components**:
  - `App/Http/Controllers/Api/AnalyticsController.php`
  - `App/Http/Controllers/Api/TransactionController.php#getDashboardData`
  - `App/Http/Controllers/Api/PaymentController.php`
  - `resources/js/components/PaymentDashboard.jsx`
- **Behavior**:
  - User analytics: summary, category breakdown, trends.
  - Admin analytics: payment dashboard overview and transaction metrics.
  - `ledger_daily_summaries` for write-time rollup and efficient reporting.
  - Public stats endpoint for marketing/landing pages.

## 6. Notification System

- **Implementation**: email verification messaging, consent capture, and transactional notices.
- **Key components**:
  - `App/Services/EmailVerificationService.php`
  - `App/Http/Controllers/Api/EmailVerificationController.php`
  - `App/Http/Controllers/Api/ConsentController.php`
  - `resources/js/components/CookieConsent.jsx`
  - `resources/js/pages/VerifyEmail.jsx`
- **Behavior**:
  - Verification emails sent upon registration and login if email is unverified.
  - Consent capture for marketing and cookie preferences.
  - Email verification status endpoint for frontend checks.

## 7. Settings and Configuration

- **Implementation**: Global settings, logo/company assets, and admin settings management.
- **Key components**:
  - `App/Http/Controllers/Api/PublicSettingsController.php`
  - `App/Http/Controllers/Api/LogoController.php`
  - `App/Http/Controllers/Api/PublicLogoController.php`
  - `App/Http/Controllers/Admin/SettingsManagementController.php`
  - `resources/js/components/Logo.jsx`
  - `resources/js/components/admin/LogoManagement.jsx`
  - `resources/js/components/admin/FaviconManager.jsx`
- **Behavior**:
  - Public logo and company settings for landing pages.
  - Admin logo upload and favicon management.
  - Site settings and cache flush endpoints for administrators.

## Additional Noteworthy Features

- **Subscription and payment flows**: `subscription_plans`, `subscriptions`, payments, and payment methods.
- **Role-based admin management**: admin screens for accounts, users, roles, categories, languages, licenses, and translations.
- **WordPress integration**: headless CMS content endpoints for posts, pages, taxonomies, media, custom post types, search, and menus.
- **Saving habit tracker**: API resource endpoints for habits, tracking, statistics, and achievements under `saving-tracker`.
- **Halo session mechanics**: daily productivity sessions with reward transactions, reminders, and streak tracking.

## Summary

Kenfinly supports a broad financial product feature set with authentication, profile management, finance dashboards, transaction management, reporting, admin settings, and a native-looking React SPA. The application also includes CMS integration, consent handling, and a habit tracker feature beyond the requested core inventory.
