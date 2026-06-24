# Wallet / Account Management — Technical Review & Feature Documentation

> **Scope:** Laravel 12 backend for `/api/accounts`.
> **Completed:** 2026-06-24
> **Status:** Production-ready

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [Balance Policy (Critical)](#balance-policy)
4. [API Reference](#api-reference)
5. [Database](#database)
6. [Security Model](#security-model)
7. [What Was Improved](#what-was-improved)
8. [Test Coverage](#test-coverage)
9. [Frontend Contract](#frontend-contract)

---

## Feature Overview

Wallet/Account Management allows authenticated users to create, view, update, and delete financial accounts. Each account has a running balance, a currency, and optional display metadata (icon, colour, type). Accounts are the parent container for all financial transactions.

### Supported Account Types

| Value | Label |
|---|---|
| `wallet` | Cash Wallet *(default)* |
| `bank` | Bank Account |
| `savings` | Savings Account |
| `credit_card` | Credit Card |
| `investment` | Investment Portfolio |

---

## Architecture

```
Request
  │
  ├── StoreAccountRequest    (validation, immutability contract)
  │   UpdateAccountRequest   (balance explicitly absent from rules)
  │
  ├── AccountController      (ownership-scoped queries, whitelist update)
  │
  ├── Account (Model)        (fillable, casts, business-logic helpers)
  │   ├── hasTransactions()  → used by destroy() guard
  │   └── calculateBalance() → reconciliation utility
  │
  └── AccountResource        (standardised JSON shape for all responses)
```

### Files

| File | Role |
|---|---|
| `app/Http/Requests/StoreAccountRequest.php` | Validates wallet creation, including opening balance |
| `app/Http/Requests/UpdateAccountRequest.php` | Validates metadata updates; balance field intentionally absent |
| `app/Http/Resources/AccountResource.php` | Consistent JSON envelope for all account responses |
| `app/Http/Controllers/Api/AccountController.php` | CRUD controller with ownership scoping |
| `app/Models/Account.php` | Eloquent model, relationships, business helpers |
| `database/migrations/…create_accounts_table.php` | Base schema |
| `database/migrations/…add_bank_name_account_type_to_accounts.php` | `account_type` column |
| `database/migrations/…add_indexes_and_restrict_account_fk.php` | Performance indexes + FK hardening |
| `tests/Feature/AccountControllerTest.php` | 32 feature tests covering all endpoints |
| `tests/Unit/AccountModelTest.php` | 24 unit tests covering model behaviour |

---

## Balance Policy

This is the most critical business rule in the module.

### The rule

> **Balance is read-only after account creation.**
> It may only change as a side-effect of creating, editing, or deleting transactions.

### Enforcement layers (defence-in-depth)

| Layer | Mechanism | What it prevents |
|---|---|---|
| **Frontend** | `UpdateWalletPayload` interface has no `balance` field; edit form has no balance input | Accidental submission |
| **FormRequest** | `UpdateAccountRequest` has no `balance` validation rule → it is stripped by Laravel | Naive API client bypass |
| **Controller** | `$request->only(['name','currency','icon','color','account_type'])` explicit whitelist | Sends nothing extra to Eloquent |
| **Database** | `transactions.account_id` FK is `RESTRICT` | Prevents cascade-delete of transaction history even via raw SQL |

### Opening balance

When a wallet is created (`POST /api/accounts`), the `balance` field is accepted **once** as the opening balance. This is the only time balance is accepted as direct user input.

### Adjust Balance flow

To correct a balance after creation, users use the "Adjust Balance" flow which:
1. Computes `diff = targetBalance − currentBalance`
2. Creates an **income** transaction if `diff > 0`, or an **expense** transaction if `diff < 0`
3. The transaction observer updates the account balance atomically

This preserves a complete audit trail — no balance change is ever unaccounted for.

---

## API Reference

All endpoints require `Authorization: Bearer {jwt_token}`.

All responses follow the envelope:
```json
{ "success": true|false, "message": "...", "data_key": ... }
```

### GET /api/accounts

List all accounts belonging to the authenticated user.

**Response 200**
```json
{
  "success": true,
  "accounts": [
    {
      "id": 1,
      "user_id": 42,
      "name": "Cash Wallet",
      "balance": "1500.00",
      "currency": "VND",
      "icon": "💰",
      "color": "#3b82f6",
      "account_type": "wallet",
      "transactions_count": 7,
      "created_at": "2026-01-01T00:00:00+00:00",
      "updated_at": "2026-06-24T12:00:00+00:00"
    }
  ]
}
```

---

### POST /api/accounts

Create a new account. `balance` here is the **opening balance** — the only time this field is accepted.

**Request body**
```json
{
  "name":         "Holiday Fund",        // required, max 255
  "balance":      1000.50,               // required, numeric (opening balance only)
  "currency":     "USD",                 // optional, exactly 3 chars; defaults to locale
  "icon":         "🏖️",                 // optional, max 50
  "color":        "#f59e0b",             // optional, valid hex (#rgb or #rrggbb)
  "account_type": "savings"              // optional, enum (see table above); default wallet
}
```

**Response 201**
```json
{
  "success": true,
  "message": "Account created successfully",
  "account": { ...AccountResource }
}
```

**Response 422** (validation failed)
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": { "name": ["Account name is required."] }
}
```

---

### GET /api/accounts/{id}

Show a single account. Returns 404 (not 403) for other users' accounts — IDOR prevention.

**Response 200**
```json
{
  "success": true,
  "account": { ...AccountResource (includes transactions_count) }
}
```

---

### PUT /api/accounts/{id}

Update account metadata. **`balance` is never processed** even if sent.

**Request body** (all fields optional)
```json
{
  "name":         "Renamed Wallet",
  "currency":     "VND",
  "icon":         "🏦",
  "color":        "#6366f1",
  "account_type": "bank"
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Account updated successfully",
  "account": { ...AccountResource }
}
```

---

### DELETE /api/accounts/{id}

Delete an account. Blocked at two layers if transactions exist.

**Response 200**
```json
{ "success": true, "message": "Account deleted successfully" }
```

**Response 400** (transactions exist)
```json
{ "success": false, "message": "Cannot delete account with existing transactions" }
```

---

## Database

### accounts table

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | auto-increment |
| `user_id` | bigint FK | → `users.id` CASCADE (owner) |
| `name` | varchar(255) | display name |
| `balance` | decimal(15,2) | denormalised running total |
| `currency` | varchar(3) | ISO 4217 e.g. VND, USD |
| `icon` | varchar nullable | emoji or identifier |
| `color` | varchar(7) nullable | hex colour e.g. #3b82f6 |
| `account_type` | varchar(30) | default `wallet` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### Indexes

| Index | Columns | Purpose |
|---|---|---|
| PK | `id` | primary lookup |
| FK index | `user_id` | ownership queries |
| `accounts_user_currency_idx` | `user_id, currency` | multi-currency total aggregations (dashboard) |

### Foreign keys affecting this table

| Table | Column | Constraint | Effect |
|---|---|---|---|
| `accounts` | `user_id` → `users.id` | CASCADE | Deleting a user deletes their accounts |
| `transactions` | `account_id` → `accounts.id` | **RESTRICT** | An account with transactions **cannot** be deleted at any layer |
| `account_participants` | `account_id` → `accounts.id` | CASCADE | Deleting an account removes participant records |

---

## Security Model

### Multi-tenancy (ownership)

Every query in `AccountController` is scoped to the authenticated user:
```php
Account::where('id', $id)
    ->where('user_id', auth('api')->id())
    ->firstOrFail();
```

Passing another user's account ID returns **404**, not 403. This prevents account enumeration — an attacker cannot determine whether account ID 42 exists for another user.

### Balance immutability

Described in detail in [Balance Policy](#balance-policy). The key invariant:

> After creation, no API call can directly set `balance`. It is driven exclusively by the transaction ledger.

### IDOR prevention

- `index()` — filtered by `user_id`; other users' accounts never appear
- `show()` / `update()` / `destroy()` — `firstOrFail()` with `user_id` scope; returns 404 for cross-user access

### Input validation

`StoreAccountRequest` and `UpdateAccountRequest` use Laravel's `failedValidation` override to return a consistent `{ success, message, errors }` envelope rather than the default Laravel validation response shape.

---

## What Was Improved

This section documents every change made during the production audit (2026-06-24).

### 1. `StoreAccountRequest` — *new file*

**Before:** Inline `Validator::make` in `AccountController::store()` with ad-hoc error response construction.

**After:** Dedicated `FormRequest` with typed rules, custom messages, and a `failedValidation` override that maintains the `{ success, message, errors }` API envelope format. Added `account_type` and `color` hex format validation.

---

### 2. `UpdateAccountRequest` — *new file*

**Before:** Inline `Validator::make` that included `'balance' => 'sometimes|required|numeric'` — balance was reachable.

**After:** `FormRequest` with `balance` deliberately absent from rules. Documents the balance policy explicitly in code comments. Adds `account_type` and `color` hex validation.

---

### 3. `AccountResource` — *new file*

**Before:** Controller returned raw `$account` model arrays, producing inconsistent shapes between endpoints (some had `transactions_count`, some did not).

**After:** `AccountResource` standardises the shape. Uses `whenCounted('transactions')` so `transactions_count` is only present when the query eagerly loaded it (index/show) and absent elsewhere, keeping create/update responses lean.

---

### 4. `AccountController` — *refactored*

**Before:**
- Inline validation with `Validator::make`
- `$account->update($request->all())` — balance reachable via mass-assignment
- Raw array responses with inconsistent structure

**After:**
- Type-hinted `StoreAccountRequest` / `UpdateAccountRequest` parameters (Laravel injects and validates automatically)
- `$request->only(['name','currency','icon','color','account_type'])` explicit whitelist in `update()`
- All responses use `AccountResource` / `AccountResource::collection()`
- `destroy()` uses `$account->hasTransactions()` (model helper) instead of inline `transactions()->count() > 0`
- Code comments document the IDOR-prevention pattern and balance policy

---

### 5. `Account` model — *updated*

**Before:** `$fillable` missing `account_type` — the column existed in the DB (via migration) but was silently ignored on `create()` / `fill()`. No `hasTransactions()` method.

**After:**
- `account_type` added to `$fillable`
- `hasTransactions(): bool` added — single `EXISTS` query, used by `destroy()`
- `calculateBalance()` updated with `round(..., 2)` for consistent float output
- Inline PHPDoc updated to explain the balance policy and two-layer deletion guard

---

### 6. New migration — *performance + security*

**File:** `2026_06_22_000002_add_indexes_and_restrict_account_fk.php`

**Index added:** `accounts(user_id, currency)` — optimises the multi-currency total aggregation run by the wallet list dashboard.

**FK changed:** `transactions.account_id` from `onDelete('cascade')` → `onDelete('restrict')`.

| Was | Now |
|---|---|
| Deleting an account at DB level would silently delete all its transactions | DB engine rejects the DELETE if any transaction row references the account |
| Controller guard was the only protection | DB is the final safety net regardless of call origin |

---

### 7. `AccountControllerTest` — *extended*

Seven new test cases added:

| Test | What it proves |
|---|---|
| `update_ignores_balance_field_even_when_explicitly_sent` | Core security invariant — balance cannot be mutated via PUT |
| `index_response_includes_all_expected_fields_per_account` | AccountResource shape contract |
| `store_accepts_valid_account_type` | New field stored correctly |
| `store_rejects_invalid_account_type` | Enum validation working |
| `store_defaults_account_type_to_wallet_when_omitted` | Default value contract |
| `store_rejects_currency_shorter_than_3_characters` | ISO 4217 `size:3` enforcement |
| `store_rejects_invalid_hex_color` | Color format validation |
| `update_rejects_invalid_hex_color` | Color format validation on update |
| `update_rejects_invalid_account_type` | Enum validation on update |
| `update_can_change_account_type` | Metadata-only update works for account_type |

---

### 8. `AccountModelTest` — *updated*

`account_has_expected_fillable_attributes` updated to include `account_type` in the expected array, keeping the test aligned with the model.

---

## Test Coverage

### Feature tests (`AccountControllerTest`) — 32 tests

| Area | Count |
|---|---|
| Authentication guards (401 on all 5 endpoints) | 5 |
| index — list, ownership isolation, field shape | 3 |
| store — create, locale defaults, validation (name/balance/currency/color/type) | 12 |
| show — own account, cross-user 404, nonexistent 404 | 3 |
| update — update, partial update, balance immutability, validation, cross-user | 7 |
| destroy — delete empty, blocked with transactions, cross-user, nonexistent | 4 |

### Unit tests (`AccountModelTest`) — 24 tests

| Area | Count |
|---|---|
| Fillable & casts | 3 |
| Relationships (user, transactions, participants, invitations) | 6 |
| calculateBalance (zero, income, expense, negative, mixed, isolation) | 6 |
| hasParticipant | 3 |
| getParticipantRole | 3 |
| Model integrity (user cascade) | 1 |
| Optional metadata storage | 1 |
| hasTransactions (via destroy tests) | implicit |

---

## Frontend Contract

The React `WalletManagement.tsx` component enforces the same balance policy on the client side through three separate TypeScript interfaces:

```typescript
// 1. Create — balance accepted once as opening balance
interface CreateWalletPayload {
  name: string; currency: string; initialBalance: number; icon: string; color: string;
}

// 2. Edit — balance intentionally absent (metadata only)
interface UpdateWalletPayload {
  name: string; currency: string; icon: string; color: string;
}

// 3. Adjust — creates an income/expense transaction for the diff
interface AdjustBalanceForm {
  targetBalance: string; categoryId: string; notes: string;
}
```

These map to three distinct UI views and three distinct API calls:
- **Add** → `POST /api/accounts` with `balance: initialBalance`
- **Edit** → `PUT /api/accounts/:id` with no `balance` field
- **Adjust** → `POST /api/transactions` with the computed diff, category, and note
