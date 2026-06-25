# Notification Settings

**Route:** `/NotificationSetting`  
**Implemented:** 2026-06-25  

---

## Overview

The Notification Settings screen lets authenticated users control which financial
events trigger an in-app or email notification. The feature replaces the static
stub (ten hard-coded, unwired checkboxes) with a fully-persisted, API-backed
settings page that surfaces only the seven notification types relevant to the
Kenfinly personal-finance application.

### Removed (unsupported wallet / P2P notifications)

The original stub contained items tied to features that do not exist in Kenfinly:

| Removed item | Reason |
|---|---|
| "Your invoices are paid" | No invoice module |
| "Someone request money from you" | No P2P money-request feature |
| "You send money to someone" | No P2P transfer feature |
| "You receive money from someone" | No P2P transfer feature |
| "You receive a QR code payment" | No QR payment feature |
| "You receive a direct payment" | No direct-payment feature |

---

## Notification Types

| Column | Default | Description |
|---|---|---|
| `notify_new_transaction` | `true` | A transaction is recorded on the user's account |
| `notify_budget_alert` | `true` | A budget threshold is approaching or exceeded |
| `notify_large_transaction` | `true` | An unusually large transaction is detected |
| `notify_savings_milestone` | `true` | A saving-habit streak or milestone is reached |
| `notify_account_invite` | `true` | Another user invites the current user to collaborate |
| `notify_subscription` | `true` | Subscription renewal reminder or payment confirmation |
| `notify_weekly_summary` | `false` | Weekly email digest (opt-in; higher frequency) |

---

## Database

**Table:** `user_notification_settings`

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | bigint PK | auto | |
| `user_id` | bigint FK | — | Unique; cascades on user delete |
| `notify_new_transaction` | boolean | `true` | |
| `notify_budget_alert` | boolean | `true` | |
| `notify_large_transaction` | boolean | `true` | |
| `notify_savings_milestone` | boolean | `true` | |
| `notify_account_invite` | boolean | `true` | |
| `notify_subscription` | boolean | `true` | |
| `notify_weekly_summary` | boolean | `false` | Opt-in |
| `created_at` | timestamp | — | |
| `updated_at` | timestamp | — | |

**Migration file:** `database/migrations/2026_06_25_185540_create_user_notification_settings_table.php`

---

## Backend API

Both endpoints require the `auth:api` + `halo.integrity` middleware chain.

### `GET /api/user/notification-settings`

Returns the user's current settings. If no row exists yet, one is created with
the application defaults before the response is sent (lazy initialisation — no
separate setup call needed).

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "notify_new_transaction":   true,
    "notify_budget_alert":      true,
    "notify_large_transaction": true,
    "notify_savings_milestone": true,
    "notify_account_invite":    true,
    "notify_subscription":      true,
    "notify_weekly_summary":    false,
    "updated_at":               "2026-06-25T18:55:40+00:00"
  }
}
```

### `PUT /api/user/notification-settings`

Persists the full settings state. All seven fields are required on every request
to avoid partial-update ambiguity. The row is upserted, so this is safe even
when called before any GET.

**Request body:**
```json
{
  "notify_new_transaction":   true,
  "notify_budget_alert":      false,
  "notify_large_transaction": true,
  "notify_savings_milestone": true,
  "notify_account_invite":    false,
  "notify_subscription":      true,
  "notify_weekly_summary":    true
}
```

**Response `200`:** Same shape as GET response, with the persisted values.  
**Response `422`:** Validation errors when any field is missing or not a boolean.  
**Response `401`:** When the request is unauthenticated.

---

## Files

| File | Purpose |
|---|---|
| `database/migrations/2026_06_25_185540_create_user_notification_settings_table.php` | Schema |
| `app/Models/UserNotificationSetting.php` | Eloquent model with casts and helpers |
| `app/Http/Controllers/Api/NotificationSettingController.php` | API controller |
| `routes/api.php` | Route registration (GET + PUT) |
| `resources/js/template/pages/NotificationSetting.tsx` | Frontend settings screen |
| `tests/Feature/NotificationSettingTest.php` | Feature test suite |

---

## Frontend

**Component:** `resources/js/template/pages/NotificationSetting.tsx`  
**Route:** `/NotificationSetting` (already registered in `template/App.tsx`)

### Behaviour

- Fetches the user's settings from `GET /api/user/notification-settings` on mount.
- Shows a spinner (purple `#7B51F1`) while the API call is in-flight.
- Each toggle fires `PUT /api/user/notification-settings` with the full updated
  state immediately on change (auto-save — no submit button needed).
- All toggles are disabled while a save is in-flight to prevent race conditions.
- An optimistic update is applied immediately; the previous state is restored if
  the PUT fails.
- A 3-second dismissing toast confirms success or reports failure.
- Notifications are grouped into labelled sections:
  - Financial Activity
  - Savings & Goals
  - Collaboration
  - Account & Subscription
  - Digest

### Design

- Font: Satoshi throughout (Design DNA — no Poppins in UI text).
- Group labels: 11 px, uppercase, letter-spaced, purple `#7B51F1`.
- Toggle: existing `.switch` / `.slider` CSS classes (consistent with
  Marketing Preferences and other settings screens).
- Max-width 600 px, mobile-first layout via existing template classes.

---

## Tests

**File:** `tests/Feature/NotificationSettingTest.php`

| Test | Assertion |
|---|---|
| `test_guest_cannot_get_settings` | 401 on unauthenticated GET |
| `test_guest_cannot_update_settings` | 401 on unauthenticated PUT |
| `test_get_creates_defaults_on_first_access` | Defaults created + returned on first GET |
| `test_get_returns_existing_settings` | Persisted values returned on subsequent GET |
| `test_update_persists_all_toggles` | PUT stores and echoes all seven fields |
| `test_update_overwrites_existing_row_without_duplicates` | Upsert keeps exactly one row per user |
| `test_update_rejects_non_boolean_toggle` | 422 with field name for invalid type |
| `test_update_requires_all_seven_fields` | 422 for all six missing fields |
| `test_settings_are_isolated_per_user` | Updating user A does not affect user B |
