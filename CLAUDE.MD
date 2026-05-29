# Claude Project Rules - Kenfinly + Halo Engine
The architectural standards for Kenfinly demand a modular monolith design with strictly isolated, self-contained modules communicating only through defined interfaces, ensuring no cross-module database calls. The system must support 12-year scalability by using flat table structures optimized for high-load scenarios, avoiding complex EAV models, and relying on pre-aggregated metrics from indexed summary tables or Redis caches for sub-5ms report responses. All transactional tables must use ULID or UUID primary keys to enable stateless, PWA-ready APIs without server-side sessions. Monetary values are stored as fixed-point integers (minor units) to avoid floating-point errors, with strict ISO currency and country code enforcement. The HaloPoint ledger requires cryptographic chaining with SHA-256 hashes for tamper-proof auditability, supported by background integrity checks. Security is enforced via JWT authentication and Laravel policies, and subscription and promotion logic must respect asynchronous, event-driven workflows without instant revocation. This framework ensures robust, scalable, secure, and future-proof operation over a multi-decade horizon.

(Vietnamese:
Các tiêu chuẩn kiến trúc của Kenfinly yêu cầu thiết kế monolith mô-đun với các mô-đun độc lập, tự chứa, chỉ giao tiếp qua các interface đã định nghĩa, đảm bảo không có truy vấn cơ sở dữ liệu chéo giữa các mô-đun.

Hệ thống phải hỗ trợ khả năng mở rộng trong 12 năm bằng cách sử dụng cấu trúc bảng phẳng tối ưu cho các kịch bản tải cao, tránh các mô hình EAV phức tạp, và dựa vào các chỉ số tổng hợp trước từ bảng tóm tắt có chỉ mục hoặc bộ nhớ đệm Redis để đáp ứng báo cáo dưới 5ms.

Tất cả các bảng giao dịch phải sử dụng khóa chính ULID hoặc UUID để hỗ trợ API không trạng thái, sẵn sàng cho PWA mà không cần phiên máy chủ. Giá trị tiền tệ được lưu dưới dạng số nguyên điểm cố định (đơn vị nhỏ) để tránh lỗi số thực, đồng thời tuân thủ nghiêm ngặt mã tiền tệ và mã quốc gia theo chuẩn ISO.

Sổ cái HaloPoint yêu cầu chuỗi mã hóa với hàm băm SHA-256 để đảm bảo khả năng kiểm toán chống giả mạo, được hỗ trợ bởi các kiểm tra tính toàn vẹn nền tảng.

Bảo mật được thực thi qua xác thực JWT và chính sách Laravel, trong khi logic quản lý đăng ký và khuyến mãi phải tuân thủ quy trình bất đồng bộ, sự kiện kích hoạt, không cho phép hủy bỏ ngay lập tức.

Khung này đảm bảo vận hành bền vững, có khả năng mở rộng, an toàn và phù hợp với tương lai trong nhiều thập kỷ.
)

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
- **JWT Protection:** Every data-modifying or data-viewing API must be protected using JWT (JSON Web Token) authentication. All protected endpoints must require a valid bearer token, enforce token verification on every request, and deny unauthorized access by default.
- **Laravel Policies:** Implement Laravel Policies (`view`, `create`, `update`) for Attendances, Transactions, and Commitments to strictly enforce that a user can ONLY access or mutate their own data (`$user->id === $resource->user_id`). Block Admin-only routes using a custom Role middleware.

### 5. Subscription Management & Promotion Lifecycle
- **No Instant Revocation:** When a user cancellation request is received, invoke Stripe's `cancel_at_period_end = true`. The database MUST retain the `premium_ends_at` timestamp and keep the user's Pro tier fully active until the period expires. Downgrades only trigger via Stripe webhooks (`customer.subscription.deleted`).
- **Automated Promotion Engine:** Implement a scheduled `PromotionTargetJob` that runs asynchronously under the hood to parse `ledger_daily_summaries` and award highly disciplined Free users with a special reward tier. Directly modify `premium_ends_at` to `now()->addMonths(3)` and flag `tier = 'promo_pro'` without generating fake Stripe gateway objects.

### 🦅 6. Halo Tokenomics & P2P Ledger Standards
- **Dynamic Valuation:** Halo Point values must be dynamically adjusted quarterly using a global formula balancing variables: Total Users, Country Count, Avg Weekly Usage, and Monthly Commitment Ratios.
- **Cryptographic Chaining Pattern:** Implement a centralized immutable ledger for the `HaloPoint` module. Each transaction record MUST store a `previous_hash` and a `current_hash`. The `current_hash` is calculated by hashing the combination of the `previous_hash`, `user_id`, `points`, and `timestamp` using SHA-256.
- **Tamper-Proof Audit:** Write a background `LedgerAuditJob` that regularly validates the integrity of the hash chain. Any hash mismatch or breaking chain must immediately flag the ledger as compromised and freeze mutations.

## 🤖 AI PAIR-PROGRAMMING WORKFLOW (90-DAY MVP RUNTIME)
- **Daily 1-Hour Focus (Replit AI):** Focus strictly on shipping micro-slices, database migrations, clean CRUD services, and writing comprehensive feature tests. Keep code structure light and human-readable.
- **Weekly Thursday Session (OpenAI Codex PhD):** - Execute a comprehensive Code & Security Audit over the past week's commits to maintain zero technical debt.
    - Implement heavy algorithmic systems: Dynamic Multi-Currency Exchange rate triggers, Hacker News Gravity core queries, and the Cryptographic SHA-256 Chaining Ledger for Halo Points.
