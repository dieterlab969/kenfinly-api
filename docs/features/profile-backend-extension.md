# Profile Backend Extension — Completion Report

## Summary

Extended the user profile backend with the `address` field, email-uniqueness enforcement on updates, a dedicated `ProfileUpdateService`, and a comprehensive test suite.

---

## 1. Migration

### `database/migrations/2026_06_24_000002_add_address_to_users_table.php`

Adds one new nullable column to `users`:

| Column    | Type          | Nullable | Notes                                      |
|-----------|---------------|----------|--------------------------------------------|
| `address` | VARCHAR(500)  | Yes      | Free-text address; placed after `gender`   |

> **Context:** `phone`, `date_of_birth`, and `gender` were already present (added in migration `2026_06_24_000001`). Only the missing `address` column is added here to avoid double-migration issues.

---

## 2. User Model — `app/Models/User.php`

Added `address` to `$fillable`. All profile fields that Eloquent is permitted to mass-assign:

```
name, email, phone, date_of_birth, gender, address
```

---

## 3. ProfileUpdateService — `app/Services/ProfileUpdateService.php`

Encapsulates all write-side business logic, keeping the controller thin.

### Responsibilities

| Behaviour | Detail |
|---|---|
| **Partial update** | Only keys present in `$data` and in the `ALLOWED_FIELDS` whitelist are written |
| **Mass-assignment guard** | Keys not in `ALLOWED_FIELDS` (e.g. `password`, `is_admin`) are silently ignored |
| **Email-change side-effect** | If the new email differs from the current one, `email_verified_at` → `null` and `status` → `"pending"` |
| **No-op on empty data** | Skips the `update()` call entirely when nothing meaningful was sent |

### ALLOWED_FIELDS whitelist

```php
private const ALLOWED_FIELDS = [
    'name', 'email', 'phone', 'address', 'date_of_birth', 'gender',
];
```

---

## 4. ProfileController — `app/Http/Controllers/Api/ProfileController.php`

Refactored to inject `ProfileUpdateService` via constructor. The controller is now responsible only for HTTP concerns (validation, request parsing, response formatting).

### GET /api/profile

No changes to behaviour. Response now includes the new `address` field.

**Response shape:**
```json
{
  "success": true,
  "profile": {
    "id", "name", "email", "phone", "address",
    "date_of_birth", "gender", "avatar",
    "email_verified", "email_verified_at",
    "status", "language", "roles",
    "created_at", "updated_at"
  }
}
```

### PUT /api/profile

All fields are `sometimes` (partial update). Accepted fields and their rules:

| Field           | Rule                                                                 |
|-----------------|----------------------------------------------------------------------|
| `name`          | `sometimes\|required\|string\|min:2\|max:100`                        |
| `email`         | `sometimes\|required\|email\|max:255\|unique:users,email,{userId}`   |
| `phone`         | `sometimes\|nullable\|string\|max:30\|regex:/^[+\d\s\-().]{0,30}$/` |
| `address`       | `sometimes\|nullable\|string\|max:500`                               |
| `date_of_birth` | `sometimes\|nullable\|date\|before:today`                            |
| `gender`        | `sometimes\|nullable\|in:male,female,other,prefer_not_to_say`        |

**Email uniqueness** uses `Rule::unique('users', 'email')->ignore($user->id)` — the current user's own address is excluded from the unique check, so submitting the same email is always allowed.

**Error responses** return HTTP 422 with a structured `errors` object:
```json
{
  "success": false,
  "errors": {
    "email": ["This email address is already in use."]
  }
}
```

---

## 5. Validation Rules (complete)

| Field           | Error condition                  | Message                                              |
|-----------------|----------------------------------|------------------------------------------------------|
| `name`          | Empty when key present           | "Name is required."                                  |
| `name`          | < 2 characters                   | "Name must be at least 2 characters."                |
| `name`          | > 100 characters                 | "Name must not exceed 100 characters."               |
| `email`         | Not a valid email                | "Please provide a valid email address."              |
| `email`         | Taken by another user            | "This email address is already in use."              |
| `phone`         | > 30 characters                  | "Phone number must not exceed 30 characters."        |
| `phone`         | Invalid characters               | "Phone number contains invalid characters."          |
| `address`       | > 500 characters                 | "Address must not exceed 500 characters."            |
| `date_of_birth` | Not a valid date string          | "Date of birth must be a valid date."                |
| `date_of_birth` | Today or in the future           | "Date of birth must be in the past."                 |
| `gender`        | Not in allowed enum              | "Gender must be one of: male, female, other, or prefer_not_to_say." |

---

## 6. Tests

### `tests/Unit/ProfileUpdateServiceTest.php` — 9 tests, 19 assertions

| Test | Verifies |
|---|---|
| `update_returns_the_updated_user_model` | Return type and value |
| `only_provided_fields_are_persisted` | Partial-update contract |
| `empty_data_array_leaves_user_unchanged` | No-op on empty payload |
| `disallowed_keys_are_silently_ignored` | Mass-assignment guard |
| `email_change_resets_email_verified_at_to_null` | Side-effect on email change |
| `email_change_sets_user_status_to_pending` | Status reset on email change |
| `submitting_the_same_email_does_not_reset_verification` | Self-email idempotence |
| `email_key_absent_from_data_leaves_verification_unchanged` | No email key = no side-effect |
| `all_allowed_fields_are_written_when_provided` | Full payload round-trip |

### `tests/Feature/ProfileControllerTest.php` — 27 tests, 91 assertions

Covers: auth guard (GET + PUT), response shape, individual field updates (name, phone, address, DOB, gender), null-clearing, email update with uniqueness, email-change side-effects, all validation rules, partial-update isolation, and full-payload update.

### Total: 36 new tests, 110 assertions — all passing ✅

---

## 7. phpunit.xml

Changed test database driver from `mysql / kenfinly_test` → `sqlite / :memory:` so the test suite runs in full isolation with no external database dependency.

---

## 8. Files Changed

| File | Action |
|---|---|
| `database/migrations/2026_06_24_000002_add_address_to_users_table.php` | Created |
| `app/Services/ProfileUpdateService.php` | Created |
| `app/Http/Controllers/Api/ProfileController.php` | Refactored |
| `app/Models/User.php` | `address` added to `$fillable` |
| `tests/Feature/ProfileControllerTest.php` | Created |
| `tests/Unit/ProfileUpdateServiceTest.php` | Created |
| `phpunit.xml` | DB driver updated to SQLite in-memory |
