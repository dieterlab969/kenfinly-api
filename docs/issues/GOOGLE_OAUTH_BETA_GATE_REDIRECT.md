# Issue: Google OAuth Redirects to /beta-access Instead of Dashboard

**Status**: Fixed  
**Date**: 2026-06-21  
**Severity**: High — new users registering or logging in via Google OAuth could not reach the dashboard in staging environments.

---

## Symptoms

After clicking **Continue with Google** on the Sign In or Sign Up page, the browser:

1. Shows the Google consent screen correctly.
2. Returns to the app and immediately lands on `/beta-access` (the staging access gate page).
3. The JWT token issued by the backend is silently discarded — the user is not logged in.

This affected **all** Google OAuth users in any environment where `APP_ENV=staging` and `STAGING_ACCESS_CODE` is configured. In `local` and `production` environments the beta middleware is bypassed unconditionally (see middleware guard below), so the bug was invisible in those environments.

---

## Root Cause

### The middleware

`app/Http/Middleware/CheckBetaAccess` is registered as global web middleware in `bootstrap/app.php`:

```php
$middleware->web(append: [
    \App\Http\Middleware\CheckBetaAccess::class,
    // ...
]);
```

In `staging` mode with `STAGING_ACCESS_CODE` set, the middleware blocks **every web route** that does not have a valid `kenfinly_beta_unlocked` cookie and redirects to `/beta-access`.

### The OAuth redirect chain

| Step | URL | Middleware whitelist |
|------|-----|----------------------|
| 1. User clicks button | `GET /api/v1/auth/google/redirect` | ✅ matched by `/api/*` |
| 2. Google callback | `GET /api/v1/auth/google/callback` | ✅ matched by `/api/*` |
| 3. Laravel → browser redirect | `GET /auth/google/success?token=<JWT>` | ❌ **not whitelisted** |

Step 3 is a **real HTTP redirect** (302), not SPA client-side navigation. The browser follows it, which triggers the full Laravel middleware stack including `CheckBetaAccess`. At this moment the user has no beta cookie (they were authenticating for the first time), so the middleware intercepts the request, saves the intended URL to the session, and returns a redirect to `/beta-access`. The JWT token in the query string is lost.

### Why regular login/register was unaffected

The standard email/password flow is entirely API-driven:

```
POST /api/v1/auth/login  →  JSON { token }
         ↓
   AuthContext.js stores token in localStorage
         ↓
   React Router navigate('/Home')   ← client-side, no server request
```

No web route is hit after the API call, so `CheckBetaAccess` never runs.

---

## Fix

### File changed: `app/Http/Middleware/CheckBetaAccess.php`

Added `/auth/google/success` and `/auth/google/error` to `$whitelistedPaths`:

```php
$whitelistedPaths = [
    '/api/*',
    '/health',
    '/health/*',
    '/status',
    '/webhooks/*',
    '/beta-access',
    '/beta-access/*',
    '/auth/google/success',   // ← added
    '/auth/google/error',     // ← added
    '/sitemap.xml',
    '/robots.txt',
    '/favicon.ico',
];
```

These two paths are OAuth landing routes served by the SPA catch-all (`/{any}` in `web.php`). Whitelisting them ensures the browser can load the React page that reads `?token=` from the URL and stores it in `localStorage`, regardless of whether the user holds a beta cookie.

**Why `/auth/google/error` too?** The `GoogleAuthController::callback()` also redirects here on failure (e.g. `?reason=no_email`). Without whitelisting it, an OAuth error would also land on `/beta-access`, hiding the actual error message from the user.

---

## Change Plan (pre-fix analysis)

1. **Identify redirect mechanism** — confirmed `CheckBetaAccess` middleware is global on web routes; whitelist only covers `/api/*`, not `/auth/*` SPA routes.
2. **Trace the OAuth flow** — confirmed step 3 (server-issued 302 to `/auth/google/success`) is the first non-API web request in the flow and the exact intercept point.
3. **Confirm scope** — verified `APP_ENV !== 'staging'` short-circuits the middleware, so `local` and `production` environments are unaffected; the bug is staging-specific.
4. **Minimal targeted fix** — whitelist only the two concrete OAuth landing paths rather than a broad `/auth/*` pattern, to keep the staging gate as tight as possible.
5. **Document** — this file.

---

## Testing the Fix

In a staging environment (`APP_ENV=staging`, `STAGING_ACCESS_CODE` set, **no** beta cookie in the browser):

1. Navigate directly to `/SignIn`.
2. Click **Continue with Google**.
3. Complete the Google consent flow.
4. Expected: land on `/Home` (dashboard) — **not** `/beta-access`.
5. Verify `localStorage.getItem('token')` is populated.

In `local` development the middleware is a no-op, so the fix has no observable effect locally — but it is a correctness improvement regardless.

---

## Files Changed

| File | Change |
|------|--------|
| `app/Http/Middleware/CheckBetaAccess.php` | Added `/auth/google/success` and `/auth/google/error` to whitelist |
| `docs/issues/GOOGLE_OAUTH_BETA_GATE_REDIRECT.md` | This document |
