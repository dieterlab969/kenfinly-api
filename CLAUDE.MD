# Claude Project Rules - Kenfinly + Halo Engine

## 🚨 SYSTEM CRITICAL BOUNDARIES (ZERO-ERROR TOLERANCE)
- **Production Is Live:** The production system has active users. Data safety is the absolute highest priority.
- **Strictly Forbidden:** Never execute `php artisan migrate:fresh`, `migrate:refresh`, or `migrate:reset`. Doing so will destroy live data and violate safety protocols.
- **No Overwriting Migrations:** Never modify existing migration files. All database mutations for existing tables (like `transactions` or `users`) MUST be performed using incremental `Schema::table()` migrations (ALTER macros).

## 🛠️ ARCHITECTURAL STANDARDS

### 1. High-Load Mitigation & Data Design (12-Year Scalability)
- **Modular Monolith Pattern:** All core logic MUST be organized strictly into isolated modules under `app/Modules/` (e.g., `Attendance/`, `Payments/`, `Inspirations/`, `Promotions/`, `Reports/`). Every module must be entirely self-contained with its own Controllers, Services, Models, and Tests. Cross-module database calling is strictly forbidden; communication between modules MUST go through strict Interfaces/Contracts.
- **Flat Table Architecture:** Maintain optimized flat tables for hot paths to handle millions of requests/day. Avoid EAV (Entity-Attribute-Value) models.
- **Advanced Analytics Aggregations (Mimic Engine):** Advanced report API endpoints (`GET /api/reports/analytics`) supporting multi-timeframe filters (7 days, 31 days, custom ranges) MUST NEVER query heavy raw transactional tables directly on user hits. All mathematical charts (Donut category breakdown, temporal Bar charts) must read pre-calculated metrics directly from the indexed `ledger_daily_summaries` flat table or Redis Cache to keep response latency strictly below 5ms.
- **Anti-Table-Locking Indexing:** Always apply multi-column composite indexes after data backfills (e.g., `['user_id', 'ledger_type', 'transaction_date', 'id']` for transactions).

### 2. Future-Proofing & PWA-Ready Foundation (1-Year Horizon)
- **Strict Stateless Architecture:** The backend operates 100% as a stateless JSON API. No server-side session dependencies or blade view rendering are allowed, ensuring all payloads are completely decoupled and cacheable via future frontend Service Workers.
- **Database Primary Keys (ULID/UUID):** All transactional database tables (`attendances`, `transactions`, `inspirations`) MUST utilize ULID or UUID as primary keys instead of auto-incrementing integers. This strictly supports client-side offline ID generation and data syncing without collisions.

### 3. Internationalization & Strict Monetary Rules
- **No Floating Points:** All monetary fields and rates must use `bigInteger` (`amount_minor`). Never use `decimal` or `float` for new implementations. All financial fields MUST accurately represent currency minor units (e.g., Cents for USD, native units for VND).
- **Data Isolation:** Enforce strict ISO mapping across all ledger tables (`currency_code` via ISO 4217, `country_code` via ISO 3166-1).
- **Asynchronous Exchange Rates:** Implement `ExchangeRateService` integrated with an external currency rate API. Rates MUST be fetched once daily via a Scheduled Cron Job and stored in Redis. Dynamic currency conversion must read straight from cache (<0.5ms) and never hit external APIs synchronously.

### 4. Strict Access Control (ALC) & Security
- **Sanctum Protection:** Every data-modifying or data-viewing API must be protected by Laravel Sanctum.
- **Laravel Policies:** Implement Laravel Policies (`view`, `create`, `update`) for Attendances, Transactions, and Commitments to strictly enforce that a user can ONLY access or mutate their own data (`$user->id === $resource->user_id`). Block Admin-only routes using a custom Role middleware.

### 5. Subscription Management & Promotion Lifecycle
- **No Instant Revocation:** When a user cancellation request is received, invoke Stripe's `cancel_at_period_end = true`. The database MUST retain the `premium_ends_at` timestamp and keep the user's Pro tier fully active until the period expires. Downgrades only trigger via Stripe webhooks (`customer.subscription.deleted`).
- **Automated Promotion Engine:** Implement a scheduled `PromotionTargetJob` that runs asynchronously under the hood to parse `ledger_daily_summaries` and award highly disciplined Free users with a special reward tier. Directly modify `premium_ends_at` to `now()->addMonths(3)` and flag `tier = 'promo_pro'` without generating fake Stripe gateway objects.