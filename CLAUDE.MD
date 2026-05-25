# Claude Project Rules - Kenfinly + Halo Engine

## 🚨 SYSTEM CRITICAL BOUNDARIES (ZERO-ERROR TOLERANCE)
- **Production Is Live:** The production system has active users. Data safety is the absolute highest priority.
- **Strictly Forbidden:** Never execute `php artisan migrate:fresh`, `migrate:refresh`, or `migrate:reset`. Doing so will destroy live data and violate safety protocols.
- **No Overwriting Migrations:** Never modify existing migration files. All database mutations for existing tables (like `transactions` or `users`) MUST be performed using incremental `Schema::table()` migrations (ALTER macros).

## 🛠️ ARCHITECTURAL STANDARDS
- **Flat Table Architecture:** Maintain optimized flat tables for hot paths to handle millions of requests/day. Avoid EAV models.
- **Anti-Table-Locking Indexing:** Always apply multi-column composite indexes after data backfills (e.g., `['user_id', 'ledger_type', 'transaction_date', 'id']` for transactions).
- **No Floating Points:** All monetary fields and rates must use `bigInteger` (`amount_minor`). Never use `decimal` or `float` for new implementations.
- **Strict Access Control (ALC):** Every data-modifying or data-viewing API must be protected by Laravel Sanctum. Implement Laravel Policies (`view`, `create`, `update`) for Attendances, Transactions, and Commitments to strictly enforce that a user can ONLY access or mutate their own data (`$user->id === $resource->user_id`). Block Admin-only routes using a custom Role middleware.

## 🧠 LESSONS LEARNED & PAST MISTAKES (MEMORIAL)
- TBD
