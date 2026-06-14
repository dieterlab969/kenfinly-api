---
name: TSX migration and Payfast template integration
description: How the JSX→TSX migration was done and where the purchased Payfast eWallet template lives
---

## Migration summary

- Entry point changed from `resources/js/app.jsx` to `resources/js/app.tsx`
- `vite.config.js` updated: `input` changed to `['resources/css/app.css', 'resources/js/app.tsx']`
- `resources/views/welcome.blade.php` @vite directive updated to reference `app.tsx`
- `tsconfig.json` created at project root; `strict: false` used because the template has loose types
- Old `app.jsx` left in place (deprecated, superseded by `app.tsx`)

## Template location and structure

```
resources/js/template/
├── App.tsx           — all 119 routes, DarkModeProvider, Bootstrap import
├── assets/           — CSS (style.css 4536 lines, bootstrap stub, media-query, swap), images, SVG, fonts
├── components/       — BackBtn, DarkModeContext, Loader, Setting, chart components
└── pages/            — 119 TSX pages (SignIn, SignUp, Home, Activity, PayBills, etc.)
```

Assets are co-located with pages so relative imports `../assets/...` work without any path alias.

## Key decisions

**Bootstrap JS**: The template uses Bootstrap offcanvas/tabs. The template assets only included Bootstrap CSS (stub), not JS. Installed `bootstrap` npm package and imported `bootstrap/dist/js/bootstrap.bundle.min.js` in `template/App.tsx`. This makes all `data-bs-toggle` attributes work without modifying 10+ pages.

**shell-quote blocker**: `concurrently` depends on `shell-quote` which is blocked by Replit's security policy. Removed `concurrently` from package.json entirely. `react-flags-select` and `bootstrap` are NOT blocked — they install fine.

**SignIn/SignUp adapted**: Original used phone number + ReactFlagsSelect. Adapted to email+password. SignIn connects to `POST /api/auth/login` (JWT), SignUp to `POST /api/auth/register`. JWT stored in `localStorage.setItem('auth_token', ...)`.

**OTP APIs not built**: `POST /api/v1/auth/send-otp` and `POST /api/v1/auth/verify-otp` do not exist. The ConfirmOtp.tsx page exists in the template but is a static mockup. Building OTP requires SendGrid + `email_otps` table.

**CSS coexistence**: Bootstrap CSS + Tailwind v4 coexist. No preflight conflict in practice. `app.css` extended with `@source` for `*.ts` and `*.tsx` files.

**DarkModeContext fix**: Original used `React.FC` without importing React. Fixed by adding `import React from 'react'` at top.

## Routes served by template (all via SPA catch-all)

All template paths (/SignIn, /SignUp, /Home, /Activity, /PayBills, /BarChart, etc.) are handled by React Router inside the template's App.tsx. Laravel's SPA catch-all (excluding /docs/*) passes them all to React.

## What still needs to be built

1. OTP authentication APIs (requires SendGrid integration)
2. Real user data wired to Home screen (currently shows "Hi Jessica, $9,807" static data)
3. KenFinly feature re-integration (transactions, budgets, Halo engine) — planned as Phase 2
