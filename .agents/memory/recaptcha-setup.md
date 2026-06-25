---
name: reCAPTCHA setup
description: How reCAPTCHA v3 is wired across backend and frontend; env var names and enable/disable toggle
---

## Backend
- Config key: `services.recaptcha.site_key` / `services.recaptcha.secret_key`
- Env vars (Replit Secrets): `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` — NOT prefixed with GOOGLE_
- Rule: `app/Rules/Recaptcha.php` — validates token via Google API, requires score ≥ 0.5
- AuthController conditionally adds rule when `AppSetting::isRecaptchaEnabled()` is true
- Enable via: `php artisan tinker --execute="App\Models\AppSetting::set('recaptcha_enabled', true);"`
- Config endpoint: `GET /api/auth/config` → `{ recaptcha_enabled, recaptcha_site_key }`

## Frontend (TSX path — app.tsx entry)
- `app.tsx` is the AppWrapper: fetches `/api/auth/config`, wraps `<TemplateApp />` with:
  - `<RecaptchaConfigContext.Provider value={{ enabled: recaptchaEnabled }}>` (from `components/App.jsx`)
  - `<GoogleReCaptchaProvider reCaptchaKey={...}>` when enabled
- `template/App.tsx` does NOT provide `RecaptchaConfigContext` (that was moved to `app.tsx`)
- `SignIn.tsx` and `SignUp.tsx` both use `useGoogleReCaptcha()` + `useRecaptchaConfig()` to conditionally get and pass the token as `g-recaptcha-response` in the request body

**Why:** The site key is DB-controlled (via AppSetting), so we fetch at runtime from API rather than baking into a VITE_ env var.
