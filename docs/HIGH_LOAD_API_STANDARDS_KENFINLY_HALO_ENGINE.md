# 🌐 12 High-Load API Standards for KENFINLY + Halo Engine

Date: 2026-05-21

Scope: define backend engineering standards, API governance rules, concurrency protection, financial integrity requirements, and scalability principles for the KENFINLY + Halo Engine architecture.

---

# Executive Decision

These APIs are not prototype-level endpoints.
The system must be designed as:
- financially immutable,
- timezone-safe,
- concurrency-safe,
- encryption-ready,
- and scalable to millions of requests without data corruption or performance collapse.

The architecture must prioritize:
- UTC normalization,
- integer-only monetary calculations,
- immutable ledger principles,
- real-time summary rollups,
- persistent state consistency,
- and query-efficient API execution.

The backend implementation should follow Laravel best practices while remaining compatible with:
- k6 load testing,
- large transaction tables,
- multi-device synchronization,
- and long-term operational scalability.

---

# API Governance Standards
## 1. Immutable Time Principle (Idempotency & UTC)
### Requirement
All APIs receiving timestamps from the Frontend (such as `started_at` when the user presses HELLO) must convert values into UTC before storing them in the database.

### Backend Rules

- Use Laravel Carbon for timezone validation and normalization.
- Resolve timezone from `users.timezone`.
- Reject invalid or malformed datetime payloads.
- A session must never allow:
    - `ended_at < started_at`
### Engineering Notes

- All persisted timestamps must use UTC.
- Frontend local timezone is presentation-only.
- Backend is the single source of truth.

---

## 2. Safe Currency Calculations (No Floating Point)

### Requirement

Because the database uses `amount_minor (BIGINT)`, APIs must never receive or return floating-point decimal values.


### Backend Rules

- All calculations must use integers only.
- Never use float or decimal arithmetic for money.
- Convert:
    - `$10.25`
      into:
    - `1025`
      before processing business logic.

### Engineering Notes

Examples:
- hourly payout
- penalties
- commitment rewards
- ledger balances
  must all operate on integer math only.

---
## 3. Strict 6-Month Hourly Rate Governance

### Requirement

`POST /api/user/hourly-rate` must be protected by strict validation and governance rules.

### Backend Rules

- Check latest record from:
    - `user_hourly_rate_changes`
- If latest update < 180 days:
    - reject immediately.

### Response

```http
HTTP 422 Unprocessable Entity
```

### Engineering Notes
- No bypass allowed.
- All rate changes must remain immutable.
- Full audit history is mandatory.


---
## 4. Real-Time Ledger Rollup (Write-Time Summary)
Requirement

Whenever a transaction is created, the system must immediately update:

ledger_daily_summaries
Backend Rules

Use:

DB::transaction()
or Eloquent Events
Engineering Notes

If summary update fails:

rollback the original transaction.

Never allow:

partial writes
inconsistent summaries
stale chart data

---
## 5. Financial Ledger Immutability
### Requirement

The ledger system must be append-only.

Forbidden APIs
PUT /api/transactions
DELETE /api/transactions
Allowed APIs
POST /api/transactions
GET /api/transactions
Engineering Notes

Corrections must use:

reversing entries
compensating transactions

Existing financial records must never be mutated.

---
## 6. Race Condition Protection (Duplicate Session Prevention)
   Requirement

Users may accidentally send multiple concurrent HELLO requests under unstable network conditions.

Backend Rules

Use DB-level constraint:

UNIQUE(['user_id', 'halo_date'])

Wrap create logic in:

try-catch

Catch:

QueryException
Response
HTTP 409 Conflict
Engineering Notes

Database constraints are mandatory.
Application-only validation is insufficient.

---
## 7. Automatic Application-Layer Encryption
Requirement

Sensitive financial metadata and private notes must be encrypted before being written to disk.

Backend Rules

Use Eloquent encrypted casts:

protected $casts = [
'notes' => 'encrypted',
];
Engineering Notes

Requirements:

secure APP_KEY
automatic decrypt on GET
transparent encryption lifecycle

Sensitive fields must never remain plaintext in storage.

---

## 8. High-Scale Pagination Optimization
Requirement

Transaction history APIs must remain performant with millions of rows.

Backend Rules

Use:

->cursorPaginate()

instead of:

->paginate()
Engineering Notes

Offset pagination becomes extremely expensive at scale because MySQL must repeatedly scan previous rows.

Cursor pagination is mandatory for:

transaction history
activity feeds
ledger browsing

---
## 9. Persistent Halo Countdown State
Requirement

GET /api/halo/current-session must always return accurate remaining time using:

expected_end_at

from the database.

Backend Rules

State persistence must survive:

page refresh
app restart
device switching
React memory resets
Engineering Notes

Frontend timers are visual only.
Database state is authoritative.

---

## 10. Secure Commitment Asset Upload
Requirement

POST /api/commitments accepts evidence image uploads.

Backend Rules

Allow only:

jpeg
png

Maximum:

5MB
Security Requirements
hash filenames using UUID/random hash
never expose predictable paths
reject executable or malformed uploads
Engineering Notes

Uploads must remain safe for:

staging
production
CDN exposure

---

## 11. Standardized API Responses (API Resources)
Requirement

Frontend applications must never depend directly on raw DB structure.

Backend Rules

Use:

Laravel API Resources
Transform Requirements
convert amount_minor → readable money
format streak dates
hide:
password
internal IDs
sensitive metadata
Engineering Notes

Responses must remain:

stable
frontend-safe
versionable

---

## 12. Large-Scale Load Test Readiness
Requirement

All APIs must be ready for heavy k6 load testing.

Backend Rules

Prevent:

N+1 queries
repeated loop queries
unnecessary eager loading

Validate performance using:

Laravel Telescope
SQL logs
query profiling
Performance Target

Each request should ideally execute:

only 2–3 optimized queries.
Engineering Notes

Performance problems ignored at V1 become catastrophic at scale.

---

## Final Engineering Principle

KENFINLY + Halo Engine must operate as:

a real financial system,
a real productivity engine,
and a real long-term scalable infrastructure.

Data integrity, consistency, and concurrency safety are non-negotiable.
