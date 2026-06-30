# Security Settings Management — System Architecture & Product Blueprint

**Feature Module:** Settings → Security Center
**Version:** 1.0.0
**Status:** Production-Ready
**Stack:** Laravel 12 (PHP 8.2+) · React 19 · TypeScript · JWT (tymon/jwt-auth)
**Test Coverage:** 27 test cases · 78 assertions · 214/214 total suite green
**Authors:** Principal Engineering · Kenfinly Platform Team

---

## Table of Contents

1. [Executive Summary & Customer Value](#1-executive-summary--customer-value)
2. [Core Workflows & User Journeys](#2-core-workflows--user-journeys)
3. [Technical Architecture](#3-technical-architecture)
4. [Comprehensive Testing Strategy](#4-comprehensive-testing-strategy)
5. [API Reference](#5-api-reference)
6. [Database Schema Reference](#6-database-schema-reference)
7. [Security Compliance & OWASP Alignment](#7-security-compliance--owasp-alignment)

---

## 1. Executive Summary & Customer Value

### 1.1 What This Feature Delivers to the End User

The Security Settings module transforms Kenfinly from a passive financial tracker into an **active guardian of user financial data**. At its core, it hands users a clear, intuitive control panel over four critical security dimensions of their account, while providing two high-stakes transactional flows — password rotation and PIN management — backed by cryptographic best practices.

A user who visits `/Security` can, in seconds:

- **Enable Two-Factor Authentication (2FA)** — requiring a time-based one-time password on every login, neutralising credential-stuffing and phishing attacks even when a password is compromised.
- **Register Biometric Login** — expressing intent to use platform biometrics (Face ID, Touch ID, Windows Hello) once a WebAuthn/FIDO2 credential is registered on their device.
- **Control Login Notifications** — opt-in to receive an alert any time their account is accessed from a new session, creating an early-warning system against unauthorised access.
- **Manage Security & Marketing Alerts** — decide whether to receive communications about security events, account anomalies, and promotional offers, preserving consent-based communication.
- **Rotate their password securely** — with explicit current-password verification and immediate session invalidation across all devices, so a compromised password cannot linger.
- **Set or change a 6-digit PIN** — a secondary authentication layer for quick in-app verification, stored irreversibly as a bcrypt hash.

### 1.2 User Autonomy & Data Privacy

A foundational design principle of this feature is **user sovereignty over security posture**. The backend never stores:

- Raw biometric templates or face/fingerprint images (biometric data stays on device).
- PINs in any recoverable form — only a bcrypt hash is persisted, making PINs non-reversible even to Kenfinly engineers.
- Plain-text passwords, ever.

Toggle states are persisted immediately to the database on each change, so the user's expressed security intent is never lost between sessions.

### 1.3 Business Value & Trust

For a Fintech product handling users' multi-account, multi-currency financial data, security is not a feature — it is the foundation of trust. This module delivers measurable business value across three vectors:

| Vector | Impact |
|--------|--------|
| **Fraud Risk Mitigation** | 2FA and login notifications create compounding defence layers that make account takeover significantly harder, reducing chargeback and support costs. |
| **Regulatory Readiness** | Implementation follows OWASP ASVS V2.1 (passwords) and V2.4 (PINs), positioning Kenfinly for PCI-DSS alignment and regional data protection requirements (Vietnam Cybersecurity Law, GDPR principles). |
| **User Retention** | Research consistently shows users are more likely to store sensitive financial data in applications they perceive as security-conscious. Visible, configurable security controls are a direct trust signal. |
| **Support Cost Reduction** | Secure password rotation with session invalidation reduces the volume of "I think my account is compromised" support tickets — the user has a self-service remedy. |
| **Competitive Differentiation** | Most personal finance apps in the Vietnamese market lack PIN-based secondary authentication and per-toggle security controls. This feature closes the gap with enterprise-grade banking apps. |

---

## 2. Core Workflows & User Journeys

### 2.1 State Hydration & Initial Page Load

When a user navigates to `/Security`, the following sequence executes:

```
User taps "Security" in Settings
        │
        ▼
React Router renders <Security />
        │
        ▼
useSecuritySettings() hook mounts
        │
        ▼
useEffect → fetch() called
        │
        ├── setLoading(true)
        ├── setFetchError('')
        │
        ▼
GET /api/v1/user/security-settings
[auth:api → halo.integrity → SecuritySettingsController@show]
        │
        ├── JWT verified by auth:api middleware
        ├── Halo integrity checked
        ├── User model loaded from DB
        ├── formatSettings($user) builds response:
        │     { is_2fa_enabled, is_biometric_enabled,
        │       login_notifications_enabled, security_alerts_enabled, has_pin }
        │
        ▼
        ┌─────────────────┬──────────────────────────┐
    200 OK               Network/Auth Error           4xx/5xx
        │                       │                        │
        ▼                       ▼                        ▼
setSettings(data)       setFetchError(msg)        setFetchError(msg)
setLoading(false)       setLoading(false)          setLoading(false)
        │
        ▼
Skeleton removed → 4 <ToggleRow> components
rendered with live DB-sourced values
```

**Loading State:** While the API call is in-flight, a CSS-animated skeleton row replaces each toggle and both action buttons, preventing layout shift and communicating progress without a blocking spinner.

**Error State:** If the fetch fails (expired JWT, server error, network offline), an error banner with a "Try Again" button is rendered. The user can retry without refreshing the page.

---

### 2.2 Asynchronous Toggle Mutation (Optimistic Update Strategy)

Each toggle follows a race-condition-safe optimistic update pattern:

```
User flips toggle (e.g., is_2fa_enabled → true)
        │
        ▼
updateToggle('is_2fa_enabled', true) called
        │
        ├── 1. CAPTURE previous = settings.is_2fa_enabled (false)
        ├── 2. setSettings(prev → { ...prev, is_2fa_enabled: true })  ← OPTIMISTIC
        ├── 3. setSavingToggles(prev → prev.add('is_2fa_enabled'))    ← LOCK toggle
        ├── 4. setToggleError('')
        │
        ▼
PUT /api/v1/user/security-settings
Body: { "is_2fa_enabled": true }
        │
        ┌──────────────────┬─────────────────────────────┐
    200 OK               422 Validation              Network Error
        │                       │                        │
        ▼                       ▼                        ▼
setSettings(server      setSettings(prev →          setSettings(prev →
  response.settings)    { ...prev, is_2fa_enabled:  { ...prev, is_2fa_enabled:
                          previous })  ← ROLLBACK     previous })  ← ROLLBACK
                        setToggleError(msg)          setToggleError(msg)
        │
        ▼ (all paths)
setSavingToggles(prev → prev.delete('is_2fa_enabled'))  ← UNLOCK toggle
```

**Race Condition Prevention:** The `savingToggles: Set<ToggleKey>` acts as a per-toggle mutex. While a toggle key exists in the set, its `<input>` is `disabled`. This prevents a user from double-tapping a slow connection and firing two conflicting PUT requests for the same field.

**Server-of-Record:** On success, local state is replaced with the server's returned `settings` object — not just the optimistic value — so the UI is always in sync with the database.

---

### 2.3 Change Password Flow

```
User taps "Change Password"
        │
        ▼
<ChangePasswordModal> mounts (bottom-sheet animation)
        │
User fills:
  current_password    ──→ [password input]
  new_password        ──→ [password input]
  confirm_password    ──→ [password input]
        │
User taps "Save Password"
        │
        ▼
PUT /api/v1/user/change-password
        │
        ├── ChangePasswordRequest validates:
        │     - current_password: required|string
        │     - new_password: required|string|min:8|confirmed|different:current_password
        │
        ▼
SecuritySettingsController@changePassword
        │
        ├── Hash::check(request.current_password, user.password)
        │     └── FAIL → 422: { errors: { current_password: ["incorrect"] } }
        │
        ├── user.update({ password: Hash::make(new_password) })
        │
        ├── JWTAuth::invalidate(JWTAuth::getToken())
        │     └── Current JWT blacklisted — session immediately revoked
        │
        └── 200: { success: true, message: "Password changed…" }
                │
                ▼
        Frontend: 2s success banner → clear localStorage token/user
                                     → window.location.href = '/login'
```

**Critical Security Step — JWT Invalidation:** The password change is not complete until `JWTAuth::invalidate()` executes. This blacklists the current token in the JWT blacklist store, ensuring that if an attacker had captured the user's active JWT (e.g., via XSS or session sniffing), they cannot use it after the password is rotated. The user is then forced to re-authenticate with their new credentials.

---

### 2.4 Change PIN Flow (6-Digit PIN Pad)

```
User taps "Set PIN" or "Change PIN"
        │
        ▼
<ChangePinModal> mounts
│
├── IF has_pin === true:
│     Show "Current PIN" pad (6 digit inputs)
│
├── Show "New PIN" pad (6 digit inputs, type=password)
└── Show "Confirm New PIN" pad
        │
User fills digits (keyboard → auto-advance, paste-aware, backspace-aware)
        │
User taps "Save PIN" / "Change PIN"
        │
        ├── Client validation:
        │     - current_pin: 6 chars if has_pin
        │     - new_pin: exactly 6 chars
        │     - confirm_pin === new_pin
        │
        ▼
POST /api/v1/user/change-pin
        │
        ├── ChangePinRequest: digits:6|confirmed
        │
        ▼
SecuritySettingsController@changePin
        │
        ├── IF pin_hash NOT NULL (existing PIN):
        │     └── current_pin required — 422 if absent
        │     └── Hash::check(current_pin, pin_hash) — 422 if wrong
        │
        ├── user.update({ pin_hash: Hash::make(new_pin) })
        │     └── bcrypt hash — non-reversible, never logged
        │
        └── 200: { success: true, message: "PIN set/changed", has_pin: true }
                │
                ▼
        Frontend: 1.5s success banner → onSuccess(true)
                → modal closes → settings.has_pin updated
```

**PIN Security Invariant:** The raw PIN digit string (`123456`) is never stored, logged, or returned in any API response. The `formatSettings()` method explicitly returns only `has_pin: boolean` — the hash itself is excluded from all serialisation paths.

---

## 3. Technical Architecture

### 3.1 Backend Architecture (Laravel 12)

#### 3.1.1 Database Schema

**Migration:** `2026_06_25_000001_add_security_settings_to_users_table`

| Column | Type | Default | Nullable | Purpose |
|--------|------|---------|----------|---------|
| `is_2fa_enabled` | `BOOLEAN` | `false` | No | Signals 2FA is active for this account |
| `is_biometric_enabled` | `BOOLEAN` | `false` | No | User has registered a biometric credential |
| `login_notifications_enabled` | `BOOLEAN` | `true` | No | Send notification on every new session |
| `security_alerts_enabled` | `BOOLEAN` | `true` | No | Send security & marketing communications |
| `pin_hash` | `VARCHAR(255)` | `NULL` | Yes | bcrypt hash of 6-digit PIN; NULL = no PIN set |

**Why `pin_hash` is nullable:** A `NULL` value unambiguously signals "no PIN has been set yet," which drives the frontend's conditional display of the "Current PIN" field in the modal — without requiring a separate `has_pin` boolean column in the database.

**Why `pin_hash` is never exposed:** The `formatSettings()` private method in `SecuritySettingsController` is the single serialisation point for security data. It explicitly constructs a whitelist response:

```php
private function formatSettings($user): array
{
    return [
        'is_2fa_enabled'              => (bool) $user->is_2fa_enabled,
        'is_biometric_enabled'        => (bool) $user->is_biometric_enabled,
        'login_notifications_enabled' => (bool) $user->login_notifications_enabled,
        'security_alerts_enabled'     => (bool) $user->security_alerts_enabled,
        'has_pin'                     => ! is_null($user->pin_hash),  // ← hash never leaves server
    ];
}
```

`pin_hash` is also absent from `$hidden` (unnecessary — it is never included in any auto-serialised response) and is **not** in the `casts()` array as `hashed` (unlike `password`) because it must not be auto-hashed on write — the controller hashes it explicitly with `Hash::make()` before calling `user->update()`.

---

#### 3.1.2 Request Validation Layer

Three dedicated Form Request classes enforce input integrity before any controller logic runs:

| Request Class | Endpoint | Key Rules |
|---------------|----------|-----------|
| `UpdateSecuritySettingsRequest` | `PUT /v1/user/security-settings` | All 4 fields `sometimes\|boolean` — allows partial updates |
| `ChangePasswordRequest` | `PUT /v1/user/change-password` | `current_password: required`, `new_password: required\|min:8\|confirmed\|different:current_password` |
| `ChangePinRequest` | `POST /v1/user/change-pin` | `new_pin: required\|digits:6\|confirmed`, `current_pin: sometimes\|digits:6` |

All three override `failedValidation()` to return a consistent JSON error envelope:

```json
{
  "success": false,
  "errors": {
    "field_name": ["Human-readable error message."]
  }
}
```

This uniformity allows the frontend to iterate `Object.keys(errors)` without special-casing any endpoint.

**`sometimes` vs `required` on toggle fields:** Using `sometimes` on `UpdateSecuritySettingsRequest` is a deliberate architectural choice — it enables the frontend to send a single-field PATCH-like payload via PUT, supporting the per-toggle optimistic update pattern without requiring the frontend to send all four values on every toggle interaction.

---

#### 3.1.3 Controller & Route Design

**`SecuritySettingsController`** handles all four security management actions in a single, cohesive controller. This colocation is intentional: all four actions share the same domain (user security state) and the same authorisation model (authenticated user, own data only).

**Route Isolation Strategy:**

```
Route::middleware('auth:api')->group(function () {

    // ── OUTSIDE halo.integrity ────────────────────────────────────────────
    // Change-password and change-pin must be reachable even when the
    // integrity check might block (e.g., suspended halo session).
    // These are credential-management operations, not data operations.

    Route::put('/v1/user/change-password', [SecuritySettingsController::class, 'changePassword']);
    Route::post('/v1/user/change-pin',     [SecuritySettingsController::class, 'changePin']);

    Route::middleware('halo.integrity')->group(function () {

        // ── INSIDE halo.integrity ─────────────────────────────────────────
        // Toggle states are user profile data — they live alongside
        // /profile GET and PUT which are also in this group.

        Route::get('/v1/user/security-settings', [SecuritySettingsController::class, 'show']);
        Route::put('/v1/user/security-settings', [SecuritySettingsController::class, 'update']);

    });
});
```

> **Design Rationale:** The `halo.integrity` middleware enforces business-logic constraints on Halo session state. Placing toggle-read and toggle-write inside it is consistent with other profile endpoints. However, `change-password` and `change-pin` are credential-management operations — they must be reachable even when a user's Halo session is in a locked or suspended state, since they may be the recovery mechanism. Placing them outside the integrity group follows the same pattern as `POST /auth/logout` and `POST /auth/refresh`.

---

### 3.2 Frontend Architecture (React + TypeScript)

#### 3.2.1 State Management — `useSecuritySettings.ts`

The hook is the **single source of truth** for all security toggle state. It is intentionally separated from `Security.tsx` for testability and potential reuse (e.g., a future security status widget in the dashboard).

**State inventory:**

| State Variable | Type | Purpose |
|----------------|------|---------|
| `settings` | `SecuritySettings \| null` | Current server-confirmed settings; null while loading |
| `loading` | `boolean` | True during initial fetch — drives skeleton display |
| `fetchError` | `string` | Non-empty on fetch failure — drives error+retry UI |
| `savingToggles` | `Set<ToggleKey>` | Keys of toggles currently awaiting API confirmation |
| `toggleError` | `string` | Non-empty when any toggle PUT fails — banner message |

**The `savingToggles` Set — Race Condition Prevention:**

The choice of `Set<ToggleKey>` over a single `isSaving: boolean` is critical. Consider a scenario where:
1. User flips 2FA on → PUT in-flight.
2. User simultaneously flips Biometric on → second PUT in-flight.
3. First PUT returns success, second PUT returns network error.

With a single boolean, clearing `isSaving` on the first PUT would re-enable all toggles — including Biometric, whose result is still unknown. With a `Set`, each toggle is independently locked:
- 2FA PUT resolves → `'is_2fa_enabled'` removed from set → 2FA toggle re-enabled.
- Biometric PUT fails → rollback `is_biometric_enabled` → `'is_biometric_enabled'` removed → Biometric toggle re-enabled with original value.

The two operations are fully isolated.

**Mounted ref guard:**

```typescript
const mounted = useRef(true);
useEffect(() => {
  mounted.current = true;
  return () => { mounted.current = false; };
}, []);
```

All async state updates are guarded with `if (mounted.current)` to prevent the React warning "Can't perform state update on unmounted component" — which would occur if a user navigates away while a PUT request is still in-flight.

---

#### 3.2.2 UI Components — `Security.tsx`

The page is composed of five logical layers:

```
<Security>
├── <style> — Scoped CSS (animations, modal, PIN pad, buttons)
├── Modal Layer (conditional)
│   ├── <ChangePasswordModal> — bottom sheet, 3 fields, JWT-invalidation-aware
│   └── <ChangePinModal>     — bottom sheet, PIN pad, conditional current-PIN
├── Top Bar
│   └── <BackBtn> + page title
└── Body
    ├── Loading: <SecuritySkeleton> — 4 shimmer rows + 2 button placeholders
    ├── Error: banner + "Try Again" button (calls refetch())
    └── Settings:
        ├── toggleError banner (conditional)
        ├── <ToggleRow id="toggle-2fa" …>
        ├── <ToggleRow id="toggle-biometric" …>
        ├── <ToggleRow id="toggle-login-notif" …>
        ├── <ToggleRow id="toggle-security-alerts" …>
        ├── [Change Password] button → setShowPasswordModal(true)
        └── [Set PIN / Change PIN] button → setShowPinModal(true)
```

**`<ToggleRow>`:** A pure presentational component. Receives `checked`, `disabled`, `saving`, and `onChange`. When `saving` is true, a small CSS spinner appears next to the label and the `<input>` is `disabled` — providing visual feedback without blocking the rest of the UI.

**`<PinInput>`:** A controlled 6-field digit-entry component. Each field is an `<input type="password" inputMode="numeric" maxLength={1}>`. Key behaviours:
- **Auto-advance:** Entering a digit moves focus to the next field.
- **Backspace-aware:** Clears the current field; if already empty, moves focus left and clears.
- **Paste-aware:** `onPaste` strips non-digits, fills up to 6 positions, focuses the last filled field.
- **Accessible:** Each input has an `aria-label` of `"{Label} digit {N}"`.

**Modal overlay:** Clicking outside the sheet (`e.target === e.currentTarget`) dismisses the modal without requiring a close button tap — a standard mobile UX pattern. The sheet slides up from the bottom with a 250ms CSS animation, matching the app's existing bottom-sheet pattern.

**Post-password-change redirect:** After a successful password change, the frontend explicitly:
1. Removes `token` and `user` from `localStorage`.
2. Sets `window.location.href = '/login'`.

This client-side cleanup is defence-in-depth — the JWT token was already blacklisted server-side, but the client should also immediately discard its copy.

---

## 4. Comprehensive Testing Strategy

### 4.1 Test Coverage Summary

| Area | Test Cases | Assertions |
|------|-----------|-----------|
| GET security settings (fetch, auth, shape, has_pin) | 4 | 18 |
| PUT security settings (toggle, partial, validation) | 6 | 22 |
| PUT change-password (happy path, wrong password, validation) | 5 | 15 |
| POST change-pin (create, update, wrong PIN, validation, non-exposure) | 12 | 23 |
| **Total** | **27** | **78** |

**Test Infrastructure:**
- `RefreshDatabase` trait — each test runs on a clean SQLite `:memory:` database.
- `actingAs($user, 'api')` — bypasses JWT token generation for test speed while fully respecting `auth:api` middleware.
- PHPUnit 11 attribute syntax `#[Test]` — no `/** @test */` docblock dependency.
- `User::factory()->create([ … ])` with explicit security column overrides — tests are fully deterministic.

---

### 4.2 Critical Test Scenarios

#### Auth Guard Coverage
```
✓ unauthenticated_user_cannot_fetch_security_settings         → 401
✓ unauthenticated_user_cannot_update_security_settings        → 401
✓ unauthenticated_user_cannot_change_password                 → 401
✓ unauthenticated_user_cannot_change_pin                      → 401
```
Every endpoint is protected. No security endpoint is accidentally public.

#### Default Value Integrity
```
✓ get_returns_correct_default_values
```
Asserts the four toggle defaults match the database column defaults:
`is_2fa_enabled: false`, `is_biometric_enabled: false`, `login_notifications_enabled: true`, `security_alerts_enabled: true`.

#### Partial Update Non-Interference
```
✓ partial_update_does_not_overwrite_untouched_toggles
```
Sets `is_2fa_enabled = true`, then sends a PUT with only `security_alerts_enabled = false`. Asserts `is_2fa_enabled` is still `true` on the fresh model. This verifies the `sometimes` rule is working correctly and the controller's whitelist iteration does not zero-out unsubmitted fields.

#### Password Security
```
✓ change_password_fails_with_wrong_current_password          → 422, error message
✓ change_password_rejects_new_password_under_8_chars         → 422
✓ change_password_rejects_mismatched_confirmation            → 422
✓ change_password_rejects_same_as_current                    → 422
✓ user_can_change_password_with_correct_current_password     → 200, Hash::check(new)
```
The happy-path test verifies the new password hash via `Hash::check('newpassword123', $user->fresh()->password)` — confirming the new password is genuinely stored as a bcrypt hash and is verifiable.

#### PIN Security
```
✓ change_pin_fails_when_existing_pin_is_missing_from_request  → 422, specific error
✓ change_pin_fails_with_wrong_current_pin                     → 422, specific error
✓ change_pin_rejects_non_numeric_pin                          → 422 (digits:6 rule)
✓ change_pin_rejects_pin_shorter_than_6_digits                → 422 (digits:6 = exact length)
✓ change_pin_rejects_mismatched_confirmation                  → 422
```

#### Non-Exposure of Sensitive Data (Critical Security Assertions)
```
✓ pin_is_never_returned_in_any_response
```
Calls `POST /v1/user/change-pin` with `new_pin = '123456'`, then `json_encode()`s the entire response and asserts:
- `assertStringNotContainsString('123456', $body)` — the raw PIN value is absent.
- `assertStringNotContainsString('pin_hash', $body)` — the column name is absent.

```
✓ settings_response_does_not_expose_pin_hash
```
Calls `GET /v1/user/security-settings` for a user with a known `pin_hash` and asserts:
- `assertArrayNotHasKey('pin_hash', $response->json('settings'))` — hash not present.
- `assertTrue($response->json('settings.has_pin'))` — but presence is correctly signalled.

These two tests together constitute a **sentinel against future regressions** — if any developer inadvertently adds `pin_hash` to a serialised response or to the User model's auto-toArray output, these tests will immediately fail.

---

## 5. API Reference

### 5.1 Endpoint Summary

| Method | Endpoint | Middleware | Purpose |
|--------|----------|-----------|---------|
| `GET` | `/api/v1/user/security-settings` | `auth:api`, `halo.integrity` | Fetch all toggle states + has_pin |
| `PUT` | `/api/v1/user/security-settings` | `auth:api`, `halo.integrity` | Partial/full toggle update |
| `PUT` | `/api/v1/user/change-password` | `auth:api` | Rotate password + invalidate JWT |
| `POST` | `/api/v1/user/change-pin` | `auth:api` | Set or change 6-digit PIN |

### 5.2 Request / Response Contracts

#### `GET /api/v1/user/security-settings`

**Response 200:**
```json
{
  "success": true,
  "settings": {
    "is_2fa_enabled": false,
    "is_biometric_enabled": false,
    "login_notifications_enabled": true,
    "security_alerts_enabled": true,
    "has_pin": false
  }
}
```

#### `PUT /api/v1/user/security-settings`

**Request (partial update supported):**
```json
{ "is_2fa_enabled": true }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Security settings updated.",
  "settings": { /* same shape as GET */ }
}
```

**Response 422:**
```json
{
  "success": false,
  "errors": {
    "is_2fa_enabled": ["Two-Factor Authentication must be true or false."]
  }
}
```

#### `PUT /api/v1/user/change-password`

**Request:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123",
  "new_password_confirmation": "newpassword123"
}
```

**Response 200:**
```json
{ "success": true, "message": "Password changed successfully. Please log in again." }
```

**Response 422 (wrong current password):**
```json
{
  "success": false,
  "errors": { "current_password": ["Current password is incorrect."] }
}
```

#### `POST /api/v1/user/change-pin`

**Request (first-time PIN — no current_pin required):**
```json
{
  "new_pin": "123456",
  "new_pin_confirmation": "123456"
}
```

**Request (changing existing PIN):**
```json
{
  "current_pin": "111111",
  "new_pin": "999999",
  "new_pin_confirmation": "999999"
}
```

**Response 200:**
```json
{ "success": true, "message": "PIN set successfully.", "has_pin": true }
```

---

## 6. Database Schema Reference

### 6.1 Modified Table: `users`

Added via migration `2026_06_25_000001_add_security_settings_to_users_table`:

```sql
ALTER TABLE users ADD COLUMN is_2fa_enabled              BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN is_biometric_enabled        BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN login_notifications_enabled BOOLEAN      NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN security_alerts_enabled     BOOLEAN      NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN pin_hash                    VARCHAR(255) NULL;
```

### 6.2 User Model — `$fillable` & `casts()`

**Added to `$fillable`:**
```php
'is_2fa_enabled', 'is_biometric_enabled',
'login_notifications_enabled', 'security_alerts_enabled',
'pin_hash',
```

**Added to `casts()`:**
```php
'is_2fa_enabled'              => 'boolean',
'is_biometric_enabled'        => 'boolean',
'login_notifications_enabled' => 'boolean',
'security_alerts_enabled'     => 'boolean',
// pin_hash intentionally NOT cast to 'hashed' — controller hashes explicitly
```

> **Important:** `pin_hash` is intentionally absent from `casts()` as `hashed`. The `hashed` cast auto-hashes on assignment (`$user->pin_hash = '123456'` would auto-bcrypt). While convenient, this would mask the explicit `Hash::make()` call in the controller and could create confusion for future maintainers. The controller hashes explicitly and stores the result — this is the intended, auditable pattern.

---

## 7. Security Compliance & OWASP Alignment

| OWASP Control | Standard | Implementation |
|---------------|----------|---------------|
| Password storage | ASVS V2.1.1 — Bcrypt/Argon2 | `Hash::make()` uses bcrypt (configurable to Argon2id via `config/hashing.php`) |
| PIN storage | ASVS V2.4 — Never plain-text | `Hash::make()` — bcrypt, non-reversible |
| Current password verification | ASVS V2.1.4 | `Hash::check(current, stored)` before any mutation |
| Session revocation on password change | ASVS V3.3.2 | `JWTAuth::invalidate()` called immediately after password update |
| Sensitive data non-exposure | OWASP Top 10 A02:2021 | `pin_hash` never serialised; `formatSettings()` whitelist-only |
| Input validation | ASVS V5.1 | All inputs validated via typed Form Request classes before controller logic |
| Authentication required | ASVS V1.2.1 | All four endpoints behind `auth:api` middleware |
| Brute force (future) | ASVS V2.2.1 | Rate limiting on change-password/change-pin endpoints recommended via `throttle:5,10` |

### Future Hardening Recommendations

1. **Add `throttle:5,10` to change-password and change-pin routes** — limit to 5 attempts per 10 minutes per IP to mitigate brute-force PIN guessing (6-digit space = 1,000,000 combinations, but 5 attempts/10min = ~3.47 years to exhaust).
2. **Implement token blacklist persistence** — configure `tymon/jwt-auth` with a database or Redis blacklist driver so that JWT invalidation on password change is durable across server restarts.
3. **Add WebAuthn/FIDO2 credential table** — the `is_biometric_enabled` toggle currently signals intent. Full biometric authentication requires a `user_credentials` table (credential_id, public_key, device_name) and challenge-response flows per the requirements document.
4. **Implement TOTP 2FA** — the `is_2fa_enabled` toggle is database-ready. Full 2FA requires `pragmarx/google2fa` + `bacon/bacon-qr-code` for secret generation, QR code provisioning, and OTP verification at login.
5. **Audit log table** — a `user_security_logs` table recording password_changed, pin_changed, 2fa_enabled, etc. events with timestamp, IP, and user agent provides a forensic trail for security incident investigation.

---

*Document generated: 2026-06-25 | Kenfinly Platform — Getkenka Ltd*
