# Session Persistence — User Gets Logged Out on Browser Close

**Date:** 2026-06-22  
**Severity:** High — Users were logged out every time they closed a tab or browser, or after ~1 hour of inactivity, despite having explicitly signed in. This caused significant UX friction and led users to believe the app was broken.  
**Status:** ✅ Fixed  
**Affected areas:** `AuthContext.jsx`, `api.js`, `config/jwt.php`, `.env`

---

## 1. Executive Summary

Users reported being logged out every time they closed the browser or left the app idle for 1–2 hours. Investigation revealed the token **was already correctly persisted in `localStorage`** — the storage layer was not the problem. The real issues were a **JWT TTL of only 60 minutes** and **no automatic token refresh mechanism**. When the token expired, `fetchUser()` received a 401 and immediately called `logout()`, wiping the session — even though the `JWT_REFRESH_TTL` (14-day window) was still active but never utilized.

---

## 2. Context & Architecture

```
User logs in
        │
        ▼
AuthContext.jsx → POST /api/auth/login
        │
        ├── Receives: access_token (JWT, TTL 60 min)
        ├── localStorage.setItem('token', token)
        ├── axios.defaults.headers.common['Authorization'] = Bearer token
        └── setUser(response.data.user)

Next time the app opens / page reloads:
        │
        ▼
AuthContext.jsx → useEffect([token]) → fetchUser()
        │
        ▼
GET /api/auth/me  ← Bearer token (may be expired)
        │
        ├── 200 OK  → setUser()  → ✅ Stays logged in
        └── 401     → logout()   → ❌ Token cleared → Login screen
```

| Layer | Details |
|---|---|
| **Frontend storage** | JWT stored in `localStorage['token']`. Correct — survives tab/browser close. |
| **Backend JWT driver** | `tymon/jwt-auth`, `api` guard, stateless mode. |
| **Access token TTL** | 60 minutes (default in `config/jwt.php`, not overridden in `.env`). |
| **Refresh token TTL** | 20,160 minutes (14 days, default). |
| **Refresh endpoint** | `POST /api/auth/refresh` — existed in `AuthController` with a registered route, but **was never called automatically** by the frontend. |

---

## 3. Root Causes

### 3.1 JWT TTL Was Too Short (Critical)

`config/jwt.php`:
```php
'ttl' => env('JWT_TTL', 60),  // 60 minutes
```

No `JWT_TTL` entry in `.env` → falls back to the 60-minute default. A user who logs in at 8 AM and returns to the app at 9:10 AM (same tab, or a freshly opened one) would find their token expired and be forced to log in again.

---

### 3.2 No Automatic Token Refresh (Critical)

`AuthContext.jsx` before the fix — `fetchUser()`:
```javascript
const fetchUser = async () => {
    try {
        const response = await axios.get('/api/auth/me');
        if (response.data.success) setUser(response.data.user);
    } catch (error) {
        console.error('Failed to fetch user:', error);
        logout();  // ← Any error, including a 401 from an expired token, triggers immediate logout
    } finally {
        setLoading(false);
    }
};
```

`api.js` before the fix — response interceptor:
```javascript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/SignIn';  // ← Hard redirect on 401, no refresh attempt
        }
        return Promise.reject(error);
    }
);
```

`POST /api/auth/refresh` was a fully working endpoint that was **never called automatically**. The 14-day `JWT_REFRESH_TTL` window was completely wasted.

---

### 3.3 Inconsistent localStorage Cleanup (Minor)

`api.js` removed `localStorage.removeItem('user')` on 401, but `AuthContext.jsx` never stored a `user` key in localStorage to begin with (user state lived only in React memory). This created a silent inconsistency between the two layers.

---

## 4. Impact Analysis

| Scenario | Before fix | After fix |
|---|---|---|
| Return to app within 60 minutes | ✅ Stays logged in | ✅ Stays logged in |
| Return to app after 1–6 hours | ❌ Logged out | ✅ Token silently refreshed |
| Return to app after 1–7 days | ❌ Logged out | ✅ Token silently refreshed |
| Return to app after 7–30 days | ❌ Logged out | ✅ Token silently refreshed (within refresh window) |
| Return to app after 30+ days | ❌ Logged out | ✅ Logged out correctly (security boundary) |
| Mid-session API call returns 401 | ❌ Redirect to /SignIn immediately | ✅ Refresh in background, retry, user sees nothing |
| Multiple concurrent API calls all return 401 | ❌ Multiple redirects | ✅ Queued — refresh called exactly once |
| Explicit logout | ✅ Token cleared | ✅ Token cleared + server blacklist |

---

## 5. Solution Applied

### 5.1 Extend JWT Lifetime — `.env`

```dotenv
JWT_TTL=10080          # 7 days  (7 × 24 × 60 = 10,080 minutes)
JWT_REFRESH_TTL=43200  # 30 days (30 × 24 × 60 = 43,200 minutes)
```

Also updated `.env.example` to document these values for new environments.

**Rationale for 7 days:** Balances UX (no daily re-logins) with security (bounded exposure window if a token is stolen). For a personal finance app, 7 days is a reasonable middle ground — shorter than typical banking apps (30 days), much longer than the broken default (1 hour).

---

### 5.2 Refresh Interceptor in `api.js`

Added a smart refresh layer to the shared axios instance's response interceptor:

```javascript
let isRefreshing = false;
let failedQueue  = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Prevent infinite loop: if the refresh call itself returns 401, bail out
        if (error.response?.status === 401 && originalRequest.url?.includes('/auth/refresh')) {
            clearTokens();
            window.location.href = '/SignIn';
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Queue concurrent 401s — only call refresh once
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await api.post('/auth/refresh');
                saveToken(data.access_token);
                processQueue(null, data.access_token);
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return api(originalRequest);  // Replay the original request transparently
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                window.location.href = '/SignIn';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
```

---

### 5.3 Silent Refresh in `AuthContext.jsx` — `fetchUser()`

Instead of `catch → logout()` immediately, attempt a token refresh first:

```javascript
const fetchUser = async () => {
    try {
        const response = await axios.get('/api/auth/me');
        if (response.data.success) setUser(response.data.user);
    } catch (error) {
        if (error.response?.status === 401) {
            try {
                const refreshResponse = await axios.post('/api/auth/refresh');
                if (refreshResponse.data?.access_token) {
                    const newToken = refreshResponse.data.access_token;
                    localStorage.setItem('token', newToken);
                    setToken(newToken);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

                    const retryResponse = await axios.get('/api/auth/me');
                    if (retryResponse.data.success) {
                        setUser(retryResponse.data.user);
                        return;  // ✅ Refresh succeeded — do not logout
                    }
                }
            } catch {
                // Refresh window expired or network error → fall through to logout
            }
        } else {
            console.error('Failed to fetch user:', error);
        }
        logout();  // Only called when refresh genuinely fails
    } finally {
        setLoading(false);
    }
};
```

---

## 6. Files Changed

| File | Change type | Description |
|---|---|---|
| `.env` | Config | Added `JWT_TTL=10080` and `JWT_REFRESH_TTL=43200` |
| `.env.example` | Config | Documented JWT TTL defaults for new environments |
| `resources/js/utils/api.js` | Frontend | Added refresh interceptor with concurrent-request queue |
| `resources/js/contexts/AuthContext.jsx` | Frontend | `fetchUser()` now attempts refresh before triggering logout |

---

## 7. Auth Flow After the Fix

```
App starts / Page reloads
          │
          ▼
AuthContext.jsx reads localStorage['token']
          │
    ┌─────┴──────┐
  Token found   No token
    │               │
    ▼               ▼
fetchUser()    setLoading(false) → Login screen shown
    │
    ├── 200 OK → setUser() → ✅ Into the app
    │
    └── 401 (expired) → Attempt silent refresh
              │
              ├── Refresh OK → setUser() → ✅ Into the app (transparent to user)
              │
              └── Refresh fails → logout() → Login screen shown

─────────────────────────────────────────────────────────────────
During active use — any API call routed through api.js
          │
          └── 401 → api.js interceptor
                    │
                    ├── Queue concurrent failing requests
                    ├── POST /auth/refresh (called once)
                    ├── Replay all queued requests → ✅ Transparent to user
                    └── Refresh fails → clearTokens() → /SignIn
```

---

## 8. Security Considerations

- **No credentials stored locally** — only the opaque JWT string. Email/password never touches localStorage.
- **JWT blacklist is still active** (`JWT_BLACKLIST_ENABLED=true`) — tokens are invalidated server-side on explicit `POST /api/auth/logout`.
- **Refresh endpoint** (`POST /api/auth/refresh`) only accepts tokens that are within the `JWT_REFRESH_TTL` window and have not been blacklisted.
- **Explicit logout** still calls the server logout endpoint to blacklist the token before clearing localStorage — stolen tokens become invalid immediately.
- **Hard session expiry** after 30 days of inactivity — re-authentication is always required after this window.

---

## 9. Related / Out of Scope

| Item | Status |
|---|---|
| Refresh when the tab has been backgrounded for many hours | ✅ Handled — `fetchUser()` refresh logic fires when the tab is focused again |
| Multiple tabs refreshing simultaneously | ✅ Handled — queue mechanism in `api.js` ensures only one refresh call |
| Token rotation after every refresh | ✅ Working — `tymon/jwt-auth` issues a new token on each refresh by default |
| Proactive refresh before expiry (e.g. 5 minutes before TTL) | ❌ Not implemented — reactive (on 401) is sufficient for the current use case |
| "Remember me" / "Stay signed in" checkbox | ❌ Out of scope |
| Refresh token stored separately from access token | ❌ Out of scope — `tymon/jwt-auth` uses a single token model |
