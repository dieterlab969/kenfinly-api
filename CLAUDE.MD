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

## ⚛️ FRONTEND MIGRATION STANDARDS
- **TSX-First:** resources/js/app.tsx is the only active entry point. app.jsx is deprecated.
- **No Legacy Development:** Do not add or modify features in the JSX flow.
- **TypeScript Only:** All new code must use .ts / .tsx.
- **Migrate Forward:** Prefer migrating touched JSX code to TypeScript rather than extending legacy implementations.

## 🎨 DESIGN DNA STANDARDS
- **Preserve Design DNA:** All new features, pages, and components must follow the existing product's design language and UX patterns.
- **Analyze Before Building:** Review similar screens and reusable components before implementation. Reuse existing patterns whenever possible.
- **Maintain UI Consistency:** Keep consistency across layouts, navigation, forms, modals, buttons, typography, colors, spacing, responsiveness, validation, loading states, and empty states.
- **Component Reuse First:** Prefer extending existing components over creating new ones.
- **No Design Drift:** Do not introduce new visual styles, interaction patterns, spacing systems, or typography without explicit approval.
- **User Perception Rule:** New functionality should feel like a natural extension of the existing product, not a separately designed module.