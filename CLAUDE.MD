# Claude Project Rules - Kenfinly + Halo Engine

## 🚨 SYSTEM CRITICAL BOUNDARIES (ZERO-ERROR TOLERANCE)
- **Production Is Live:** The production system has active users. Data safety is the absolute highest priority.
- **Strictly Forbidden:** Never execute `php artisan migrate:fresh`, `migrate:refresh`, or `migrate:reset`. Doing so will destroy live data and violate safety protocols.
- **No Overwriting Migrations:** Never modify existing migration files. All database mutations for existing tables (like `transactions` or `users`) MUST be performed using incremental `Schema::table()` migrations (ALTER macros).

## 🛠️ ARCHITECTURAL STANDARDS

### 1. The Core High-Load Architecture
- One modular monolith: each domain owns its code and talks through contracts only.
- Hot paths use flat reads, precomputed data, and tight indexes.
- The standard is simple: core responses target 1ms.

### 2. The Unfair Advantage & Truth
- Stateless JWT only. No server sessions.
- Every critical record joins a secure SHA-256 Halo Point chain for absolute immutability.
- Stay PWA-ready: offline-safe, sync-friendly, and resilient without network.

### 3. The Financial & Security Mandates
- Strict ALC everywhere: users can access only their own data.
- Money stays exact; discipline beats complexity.
- The September milestone is non-negotiable: 16M VND in recurring revenue.