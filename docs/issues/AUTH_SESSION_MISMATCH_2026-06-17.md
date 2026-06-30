# Auth Session Mismatch — `/pricing` Page Investigation & Fix

**Date:** 2026-06-17  
**Severity:** High — Guest users could be silently allowed past the "Buy Now" button on `/pricing` and only get rejected at the backend checkout step, creating a confusing broken-flow experience.  
**Status:** ✅ Fixed

---

## 1. Executive Summary

Kenfinly is a hybrid multi-stack app. The React SPA (everything under `/`) uses JWT stored in `localStorage` via `AuthContext.jsx`. Several pages — `/pricing`, `/checkout`, `/cart`, `/order/*`, `/thank-you` — are standalone **Laravel Blade views**. These Blade pages do **not** share the React auth context; they have to read `localStorage` themselves via vanilla JavaScript.

The root cause of the reported mismatch: `pricing.blade.php` had **zero JavaScript** — it never looked at `localStorage`, never checked token expiry, and never intercepted guest clicks on "Buy Now". A guest could navigate to `/checkout` without any friction. They would see the complete checkout form, then — 350 ms after the page rendered — get an auth modal telling them to log in. Meanwhile, a logged-in user saw "Đăng nhập" (Login) in the pricing navbar instead of their name, because the Blade page had no mechanism to reflect the React session.

---

## 2. Architecture Recap

| Layer | Auth mechanism |
|-------|---------------|
| React SPA (`/`, `/SignIn`, `/SignUp`, `/dashboard`, …) | JWT in `localStorage` via `AuthContext.jsx`. Token key: `token`. User object key: `user`. |
| Blade pages (`/pricing`, `/checkout`, `/cart`, …) | Vanilla JS reads `localStorage.getItem('token')`. The token is injected into a hidden `_jwt_token` form field; the server validates it with `auth('api')->setToken($token)->authenticate()`. |
| API (`/api/*`) | `auth:api` middleware (JWT Bearer token). |

---

## 3. Root Causes Found

### 3.1 Pricing page had no auth awareness (Critical)

`resources/views/pricing.blade.php` — **before fix:**
- No `<script>` block anywhere in the file.
- Navbar hardcoded: `<a href="/login" class="btn-nav-login">Đăng nhập</a>` — always showed "Login" regardless of JWT presence.
- "Buy Now" buttons were plain anchor links: `<a href="/checkout?plan=monthly">` — no auth check, zero interception.

**Effect:**  
A logged-in React SPA user navigating to `/pricing` would see "Đăng nhập" in the navbar (mismatch with SPA state). Clicking "Buy Now" would navigate straight to `/checkout`. A guest user clicking "Buy Now" would land on the full checkout form, then 350 ms later get an auth modal — bad UX.

### 3.2 Checkout page auth modal fires *after* the page renders

`resources/views/checkout.blade.php` already has the right auth modal infrastructure, but it shows the modal **350 ms after page load** for guests:

```javascript
if (!token) {
    setTimeout(openAuthModal, 350);   // guest sees full form first
}
```

This is a secondary UX issue. The primary fix is intercepting guests at the *pricing* page before they ever reach `/checkout`.

### 3.3 "Buy Now" buttons bypassed auth entirely

Because the buttons were `<a href>` tags, there was no JavaScript hook to intercept the click and check the JWT. Any click was a direct browser navigation.

### 3.4 Navbar login link used inconsistent route

The pricing page pointed to `/login` (`<a href="/login">`). All other Blade pages and the checkout controller use `/SignIn` (capital S, capital I — the React SPA route). `Login.jsx` reads `?redirect_to=` from `/SignIn` and redirects after a successful login.

### 3.5 Route middleware gap (low risk, already mitigated)

`GET /checkout` has no route-level auth middleware. However:
- Empty-cart GET requests are already redirected to `/pricing` by `CheckoutController::index()`.
- `POST /checkout` and `POST /cart/checkout` both check `_jwt_token` manually and redirect to `/SignIn?redirect_to=/checkout` on failure.

Direct POST attacks by guests are already handled gracefully. The gap is pure UX, not a security hole (no sensitive action is performed without a valid JWT).

---

## 4. Fixes Applied

### Fix 1 — Auth-aware navbar on `/pricing`

Added a `#navAuthArea` div in the navbar. On page load, JavaScript:

1. Reads `localStorage.getItem('token')` (+ sessionStorage fallback).
2. Decodes the JWT payload and checks `exp` (with a 30-second clock-skew buffer).
3. **If token is valid:** replaces the "Đăng nhập" button with a user chip (avatar initial + display name + "Dashboard →" link).
4. **If token is absent, malformed, or expired:** clears stale localStorage entries and leaves the "Đăng nhập" button in place.

```javascript
function getValidAuth() {
    const t = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    if (!t) return null;
    const payload = getJwtPayload(t);
    if (!payload) { localStorage.removeItem('token'); return null; }
    if (payload.exp && (Date.now() / 1000) > (payload.exp - 30)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
    }
    return { token: t, payload };
}
```

### Fix 2 — Auth-gate modal on "Buy Now" buttons

Both "Buy Now" buttons changed from `<a href>` to `<button onclick="requireAuth(url)">`:

```html
<!-- Before -->
<a href="{{ $checkoutMonthly }}" class="btn btn-primary">Mua ngay — Hàng tháng</a>

<!-- After -->
<button type="button" onclick="requireAuth('{{ addslashes($checkoutMonthly) }}')" class="btn btn-primary">
    Mua ngay — Hàng tháng
</button>
```

`requireAuth(url)` logic:

```javascript
window.requireAuth = function (url) {
    if (getValidAuth()) {
        window.location.href = url;   // authenticated → proceed to checkout
    } else {
        openAuthModal(url);           // guest → show login modal
    }
};
```

### Fix 3 — Inline auth-gate modal on pricing page

Added the same `#authModal` design used in `checkout.blade.php`. The modal's "Sign in" and "Create account" links are dynamically updated by `openAuthModal(url)` to carry the intended checkout URL as `?redirect_to=...`:

```javascript
function openAuthModal(redirectUrl) {
    const encoded = encodeURIComponent(redirectUrl || '/checkout');
    document.getElementById('modalLoginLink').href  = '/SignIn?redirect_to=' + encoded;
    document.getElementById('modalRegisterLink').href = '/SignUp?redirect_to=' + encoded;
    authModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}
```

After logging in via the React SPA, `Login.jsx` reads `?redirect_to=` and calls `window.location.href = redirectTo`, landing the user directly on the correct checkout URL.

### Fix 4 — Consistent navbar login link

Changed the navbar's static login link from `/login` to `/SignIn`, matching the React SPA route used everywhere else.

---

## 5. Flow Diagrams

### Guest "Buy Now" flow (after fix)

```
Guest on /pricing
    │
    ▼ clicks "Buy Now"
requireAuth('/checkout?plan=monthly')
    │
    ▼ getValidAuth() → null (no token)
openAuthModal('/checkout?plan=monthly')
    │
    ├── clicks "Sign in"  → /SignIn?redirect_to=%2Fcheckout%3Fplan%3Dmonthly
    │       │
    │       ▼ Login.jsx authenticates → JWT in localStorage
    │       ▼ window.location.href = redirectTo
    │       └──→ /checkout?plan=monthly  ✅
    │
    └── clicks "Create account" → /SignUp?redirect_to=...  (same pattern)
```

### Logged-in user flow (after fix)

```
Authenticated user on /pricing
    │
    ▼ DOMContentLoaded
initNavbar() → getValidAuth() → valid token
    → replaces navbar button with user chip (name + Dashboard link)
    │
    ▼ clicks "Buy Now"
requireAuth('/checkout?plan=monthly')
    │
    ▼ getValidAuth() → { token, payload }
window.location.href = '/checkout?plan=monthly'  ✅
```

### Stale-token user flow (after fix)

```
User with expired JWT on /pricing
    │
    ▼ DOMContentLoaded
initNavbar() → getValidAuth() → exp check fails
    → clears localStorage token & user
    → navbar stays as "Đăng nhập"
    │
    ▼ clicks "Buy Now"
requireAuth('/checkout?plan=monthly')
    │
    ▼ getValidAuth() → null
openAuthModal('/checkout?plan=monthly')  ✅  (correct: user must re-authenticate)
```

---

## 6. Backend Route Audit

| Route | Auth check | Guest behaviour |
|-------|-----------|----------------|
| `GET /pricing` | None needed — public page | Sees pricing, modal intercepts "Buy Now" |
| `GET /checkout` | None at route level | Sees checkout form, existing modal fires on load if no token |
| `POST /checkout` | Manual `_jwt_token` check in controller | → `redirect('/SignIn?redirect_to=/checkout')` ✅ |
| `POST /cart/checkout` | Same manual check | → `redirect('/SignIn?redirect_to=/checkout')` ✅ |
| `GET /order/{code}` | None | Legitimate: PayOS webhook redirects here; JWT not required to view QR |
| `/api/*` guarded routes | `auth:api` middleware | → 401 JSON response ✅ |

No route-level middleware change was required. The backend already handles unauthenticated POST attempts correctly. The gap was purely at the UI level.

---

## 7. Files Changed

| File | Change |
|------|--------|
| `resources/views/pricing.blade.php` | Added auth-aware navbar JS; converted "Buy Now" buttons to `requireAuth()`; added auth-gate modal HTML + CSS + JS |

---

## 8. Tests

All 69 existing tests continue to pass (235 assertions). No new tests were added — the changes are pure client-side JavaScript in a Blade view and do not affect any server-side logic or API contracts.
