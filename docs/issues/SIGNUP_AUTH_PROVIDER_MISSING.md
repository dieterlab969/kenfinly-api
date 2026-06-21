# Issue: `useAuth must be used within an AuthProvider` on `/SignUp`

**Status**: Open  
**Severity**: High — blocks new user registration via the template entry point  
**Reported**: 2026-06-20  

---

## Symptom

Navigating to `/SignUp` in the template app throws:

```
Uncaught Error: useAuth must be used within an AuthProvider
```

The page crashes and cannot be used.

---

## Root Cause

The project has **two separate React app entry points**, each with its own `<BrowserRouter>`:

| Entry point | File | Providers |
|---|---|---|
| Main app | `resources/js/app.jsx` → `components/App.jsx` | `RecaptchaConfigContext`, `TranslationProvider`, `LogoProvider`, **`AuthProvider`** |
| Template prototype | `resources/js/template/App.tsx` | `TranslationProvider`, `DarkModeProvider` — **no `AuthProvider`** |

`template/App.tsx` mounts `template/pages/SignUp.tsx` at `/SignUp` (line 141).

`template/pages/SignUp.tsx` was recently updated to include full registration logic from the legacy `Register.tsx`, which introduced three hooks that require missing providers:

| Hook | Required provider | Present in `template/App.tsx`? |
|---|---|---|
| `useAuth()` | `<AuthProvider>` | ❌ |
| `useRecaptchaConfig()` | `<RecaptchaConfigContext.Provider>` | ❌ |
| `useGoogleReCaptcha()` | `<GoogleReCaptchaProvider>` (mounted in `app.jsx`) | ❌ |

Because none of these providers wrap the template router, all three hooks throw on mount.

---

## Affected Files

- `resources/js/template/App.tsx` — missing provider wrappers
- `resources/js/template/pages/SignUp.tsx` — calls hooks without guaranteed provider ancestors
- `resources/js/app.jsx` — reference for how providers are correctly composed in the main entry

---

## Proposed Fix

### Option A — Add providers to `template/App.tsx` ✅ Recommended

Wrap the template `<BrowserRouter>` with `AuthProvider`, `LogoProvider`, and `RecaptchaConfigContext.Provider` (same composition as the main app). Also wrap `/SignUp` in a `<GoogleReCaptchaProvider>` with the site key, or conditionally disable reCAPTCHA when the key is absent.

**Pros**: `SignUp.tsx` works identically in both entry points. No logic changes needed.  
**Cons**: Pulls auth infrastructure into a file that was previously a lightweight prototype shell.

```tsx
// template/App.tsx — proposed wrapper order
<RecaptchaConfigContext.Provider value={{ enabled: recaptchaEnabled }}>
  <TranslationProvider>
    <LogoProvider>
      <AuthProvider>
        <DarkModeProvider>
          <BrowserRouter>
            ...existing routes...
          </BrowserRouter>
        </DarkModeProvider>
      </AuthProvider>
    </LogoProvider>
  </TranslationProvider>
</RecaptchaConfigContext.Provider>
```

`recaptchaEnabled` should be read from `import.meta.env.VITE_RECAPTCHA_ENABLED` (same as `app.jsx`).

For `useGoogleReCaptcha`, wrap only the `/SignUp` route element with `<GoogleReCaptchaProvider siteKey={...}>`, or guard inside `SignUp.tsx` with a null check (already present — `if (!executeRecaptcha)` returns early).

---

### Option B — Unify on a single entry point

Remove `template/App.tsx` as a standalone entry. Register template routes directly inside `components/App.jsx` under the existing provider tree. The template prototype becomes a route namespace (e.g. `/template/*`) rather than its own app.

**Pros**: Eliminates the dual-entry-point problem permanently.  
**Cons**: Larger refactor; template prototype loses its standalone nature.

---

### Option C — Guard hooks with null-safe wrappers (not recommended)

Wrap each hook call in try/catch or add an optional context that returns no-ops when no provider is present.

**Pros**: No changes to `template/App.tsx`.  
**Cons**: Hides the misconfiguration instead of fixing it; auth logic would silently do nothing, making debugging harder.

---

## Recommended Implementation Steps (Option A)

1. **`template/App.tsx`**
   - Import `AuthProvider` from `'../contexts/AuthContext'`
   - Import `LogoProvider` from `'../contexts/LogoContext'`
   - Import `RecaptchaConfigContext` from `'../components/App'`
   - Read `recaptchaEnabled` from `import.meta.env.VITE_RECAPTCHA_ENABLED === 'true'`
   - Add the four providers as wrappers around `<DarkModeProvider>` (keep `DarkModeProvider` innermost since it is template-specific)

2. **`template/pages/SignUp.tsx`** — no logic changes needed; the existing `if (!executeRecaptcha)` guard already handles the case where reCAPTCHA is not configured.

3. **Verify** `npm run build` exits 0 and `/SignUp` renders without errors in both entry points.

---

## Acceptance Criteria

- [ ] Navigating to `/SignUp` in the template app no longer throws `useAuth must be used within an AuthProvider`
- [ ] Successful registration navigates to `/verification-pending` with correct `state.user` and `state.redirectTo`
- [ ] Already-authenticated users are redirected to `/` (or WooCommerce URL with `?laravel_user_id=`)
- [ ] reCAPTCHA works when `VITE_RECAPTCHA_ENABLED=true`; skipped gracefully when `false`
- [ ] `npm run build` exits 0 with no TypeScript errors
