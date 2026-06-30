# PayFast UI Migration Roadmap

## Goal
Create an actionable migration plan that preserves Kenfinly business logic and APIs while adopting PayFast UI patterns for customer-facing screens.

## Phase 1: Authentication

### Objectives
- Preserve Kenfinly JWT auth / email verification flows.
- Replace PayFast static auth pages with Kenfinly auth backend integration.
- Establish auth state and protected route handling.

### Tasks
1. Choose base screens:
   - Reuse PayFast `SignIn.tsx` and `SignUp.tsx` layouts.
   - Use `ConfirmOtp.tsx`, `ForgetPassword.tsx`, and `CreateNewPassword.tsx` as template patterns.
2. Implement Kenfinly auth data layer:
   - Map login/register to `/api/auth/login`, `/api/auth/register`.
   - Add `/api/auth/me`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/config` calls.
   - Preserve email verification as a required step using `/api/email/verify`, `/api/email/resend`.
3. Add application contexts:
   - `AuthContext` for token storage and session state.
   - `TranslationContext` and `LogoContext` for public-branding reuse.
4. Migrate form validation and reCAPTCHA as needed.
5. Validate route guards with `ProtectedRoute` and `SuperAdminRoute` equivalents.

### Acceptance Criteria
- Users can login/register using Kenfinly backend.
- Auth state persists and protects `/dashboard` and other authenticated routes.
- Email verification and password reset are functional.

## Phase 2: Dashboard

### Objectives
- Port Kenfinly dashboard metrics and analytics into PayFast UI patterns.
- Keep backend dashboard data intact.

### Tasks
1. Select PayFast dashboard-like pages:
   - Reuse `Home.tsx`, `Activity.tsx`, and chart page layouts.
2. Build a new Kenfinly dashboard module:
   - Integrate `/api/dashboard`, `/api/analytics/summary`, `/api/analytics/category-breakdown`, `/api/analytics/trends`.
   - Include account balance summaries, recent transactions, charts, and halo session cards.
3. Preserve halo session flow:
   - `GET /api/halo/current-session`, `POST /api/halo/transactions`.
   - `attendance` lifecycle endpoints (`/api/attendance/start`, `/complete`, `/kill`).
4. Migrate data visualization components:
   - Use PayFast chart styles but render Kenfinly data.
   - Create reusable `DashboardCard`, `AnalyticsChart`, and `RecentTransactions` components.
5. Ensure responsive behavior and layout consistency.

### Acceptance Criteria
- Dashboard screens display real Kenfinly data.
- Halo session state and transactions update correctly.
- Analytics charts use Kenfinly endpoints.

## Phase 3: Profile

### Objectives
- Migrate user profile and account settings screens.
- Keep Kenfinly profile update APIs as the source of truth.

### Tasks
1. Use PayFast settings screens as shells:
   - `PersonalInfo.tsx`, `Security.tsx`, `Language.tsx`, `Currency.tsx`, `NotificationSetting.tsx`.
2. Connect to Kenfinly endpoints:
   - `/api/profile`, `/api/profile` PUT.
   - `/api/user/language` for language preference.
   - `/api/settings/company` and `/api/logo` for branding if public-facing.
3. Preserve account deletion and deactivation logic only if Kenfinly backend supports it; otherwise implement custom endpoints.
4. Add consent and notification settings integration via `/api/consent`.

### Acceptance Criteria
- Profile and settings screens read and write Kenfinly user data.
- Language preferences and notification consent are preserved.

## Phase 4: Transactions

### Objectives
- Map transaction workflows to PayFast payment screens without changing Kenfinly business logic.
- Preserve account/category models, transaction photo handling, and CSV support.

### Tasks
1. Identify reusable templates:
   - `SendMoney*`, `RequestPayment`, `TransferBank*`, `PayBills`, `SendInvoice*`.
2. Connect Kenfinly transaction APIs:
   - `apiResource('transactions')`, `POST /api/transactions/{transaction}/photos`, `DELETE /api/photos/{photoId}`.
   - Account list from `GET /api/accounts` and category list from `GET /api/categories`.
3. Build reusable transaction flows:
   - `TransactionCreate`, `TransactionReview`, `TransactionDetail`, `TransactionList`.
   - Use PayFast payment review layouts.
4. Incorporate bill payment and invoice screens only for UX patterns; actual Kenfinly model remains transaction-centric.
5. Add `CsvController` import/export UI if required by Kenfinly.

### Acceptance Criteria
- Transaction create/read/update/delete works through PayFast-derived flows.
- Receipt photo upload and deletion use Kenfinly endpoints.
- Account and category selection works and preserves balance updates.

## Phase 5: Remaining Modules

### Objectives
- Migrate noncore modules while leaving Kenfinly backend logic intact.
- Build or keep custom screens for features PayFast does not provide.

### Tasks
1. Admin / management:
   - Replace PayFast with Kenfinly admin screens for accounts, users, roles, categories, languages, licenses, settings, cache, translations.
2. Content / CMS:
   - Keep WordPress integration and Kenfinly public blog pages.
3. Additional features:
   - Saving habit tracker and custom tools.
   - Payment method management: `/api/payments/methods`.
   - Participant invitations and account sharing.
   - Public stat and waitlist flows (`/api/analytics/public-stats`, `/api/waitlist`).
4. Final polish:
   - Add consistent navigation and layout wrapper.
   - Remove unused PayFast pages not used by Kenfinly.
   - Ensure build works in the Vite + Laravel deployment pipeline.

### Acceptance Criteria
- All Kenfinly features have a mapped and implemented screen.
- No business logic is lost in the migration.
- Admin and CMS modules are intact.
- Build and deployment path is stable.

## 1. Recommended Integration Pattern

- Convert PayFast from CRA to the Kenfinly Vite/React build system where possible.
- Use PayFast screens as React component templates rather than full page replacements.
- Keep the backend API contract unchanged during migration.
- Introduce `axios` service wrappers and shared context providers first, then connect screens incrementally.
