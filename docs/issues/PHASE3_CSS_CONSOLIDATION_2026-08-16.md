# Phase 3 — Frontend CSS Consolidation

**Status:** Completed  
**Date:** 2026-08-16  
**Scope:** React/Vite frontend CSS delivery under `resources/js` and the Laravel Blade Vite entry

## Issue

The active frontend shell imported several large, unrelated stylesheets globally:

- `style.css` — 103,400 bytes of mixed shell, public, finance, account, dashboard, and widget rules.
- `swap.css` — 21,658 bytes of a full Google-hosted Poppins face set.
- `media-query.css` — 2,794 bytes of mixed legacy responsive rules.
- `bootstrap.min.css` — one global Bootstrap CSS implementation.
- `bootstrap.bundle.min.js` — initialized globally even on routes that did not need Bootstrap behavior.
- `all.min.css` — 103,009-byte Font Awesome bundle with no active import.
- `intlTelInput.css` — 25,122-byte widget stylesheet with no active import.
- `halo.css` — 28,215 bytes included through the global Laravel CSS entry even though Halo is one lazy route.

This made CSS ownership difficult to determine and caused the initial CSS payload to carry rules for screens that were not loaded.

## Context

The active application is the TypeScript route-based app rooted at
`resources/js/main.tsx` and `resources/js/App.tsx`. Routes already use dynamic
imports through `resources/js/app/routes/routeModules.ts`, so CSS can follow
the same lazy boundary.

The legacy `resources/js/assets/css/style.css` remains as the audited extraction
source for reproducibility. It is no longer imported by the active application.
The separate `payfast_integration` template still has its own legacy assets and
was not changed because it is not the active Laravel entrypoint.

## Root causes

1. **Global legacy bundle ownership** — every legacy screen section lived in
   one `style.css` import at the application root.
2. **Typography bundle over-delivery** — the complete `swap.css` font-face set
   was loaded even though the product only needs Satoshi for UI text and
   Poppins for large display typography.
3. **Mixed dependency delivery** — Bootstrap CSS and Bootstrap JavaScript were
   initialized globally while React Bootstrap and direct Bootstrap components
   were also used in individual features.
4. **Route-insensitive third-party CSS** — widget/icon assets were kept in the
   source tree without evidence of active use.
5. **Halo CSS in the Laravel shell entry** — `resources/css/app.css` imported
   Halo styles for every route instead of the Halo route importing them.

## Usage report before changes

The selector and ownership report was captured before the removal work:

[`phase3-css-usage-before.md`](phase3-css-usage-before.md)

It records section-level line/byte counts, source token matches, current
imports, Bootstrap usage, icon usage, widget usage, and the rules used to
decide whether a selector could be moved or removed.

## Changes applied

### 1. Small global shell stylesheet

Created:

- `resources/js/assets/css/kenfinly-core.css`

It contains the audited theme tokens, base layout rules, shared utilities,
Satoshi loading, the reduced Poppins request, and shared animations. It also
owns:

```css
:root {
    --font-ui: 'Satoshi', sans-serif;
    --font-display: 'Poppins', sans-serif;
}
```

The existing product typography direction is preserved: Satoshi remains the
primary UI font and Poppins remains the display font.

### 2. Feature-owned CSS groups

Generated from the audited sections of `style.css`:

| File | Ownership |
| --- | --- |
| `features/public.css` | Splash, onboarding, “Let you in”, sign-in, and sign-up |
| `features/auth.css` | Verification, identity, password, notification, and biometric flows |
| `features/finance.css` | Transfers, payments, invoices, bills, cards, taxes, and finance flows |
| `features/account.css` | Account, settings, support, privacy, activity, and account-management flows |
| `features/dashboard.css` | Home, analytics, charts, and bottom navigation |
| `features/responsive.css` | Preserved small-screen rules moved out of the deleted global media bundle |

`routeModules.ts` now loads the matching feature stylesheet while the lazy route
is suspended, so the feature renders only after its CSS is available.

### 3. Bootstrap strategy

The app now has one deliberate Bootstrap CSS entry:

```ts
import 'bootstrap/dist/css/bootstrap.min.css';
```

The global Bootstrap JavaScript import was removed. Routes that use Bootstrap
behavior load `bootstrap.bundle.min.js` through the lazy route boundary. React
Bootstrap remains a component wrapper consuming the same single Bootstrap CSS
entry; it does not introduce a second stylesheet implementation.

### 4. Halo and widget scoping

- Removed `@import "./halo.css"` from `resources/css/app.css`.
- Added a route-local import from `pages/halo/HaloDashboard.tsx`.
- Kept `react-datepicker/dist/react-datepicker.css` local to `AddNewCard.tsx`.
- Removed the unused `all.min.css`, `intlTelInput.css`, `swap.css`, and
  `media-query.css` assets from the active template asset directory.
- Preserved the active responsive rules in `features/responsive.css`.

No active source imports the removed files.

### 5. Repeatable tooling

Added:

- `scripts/report-css-usage.mjs`
- `scripts/generate-phase3-css.mjs`

Commands:

```bash
npm run phase3:css
npm run phase3:css:report
node scripts/report-frontend-baseline.mjs --output docs/issues/frontend-bundle-phase3.md
```

## Measured result

Compared with the Phase 0/Phase 1 production report:

| Measure | Before | Phase 3 | Change |
| --- | ---: | ---: | ---: |
| Initial React CSS, raw | 340.34 KiB | 230.06 KiB | **-110.28 KiB / -32.4%** |
| Initial React CSS, gzip estimate | 46.34 KiB | 31.75 KiB | **-14.59 KiB / -31.5%** |
| Laravel `app.css`, raw | 135.16 KiB | 118.74 KiB | **-16.42 KiB / -12.1%** |

The remaining feature CSS is emitted as on-demand files, including:

- `public.css`
- `auth.css`
- `finance.css`
- `account.css`
- `dashboard.css`
- `responsive.css`
- `HaloDashboard` CSS
- `AddNewCard` date-picker CSS

The final emitted bundle inventory is in
[`frontend-bundle-phase3.md`](frontend-bundle-phase3.md).

## Visual and runtime checks

- `node node_modules/.bin/vite build` — pass.
- `dev-server` workflow restarted successfully.
- Desktop preview checked for `/`, `/SignIn`, `/Home`, and `/halo`; the public
  shell and sign-in screen retain their existing layout.
- Protected `/Home` and `/halo` previews correctly redirect to sign-in without
  an auth token; their route CSS is emitted as lazy chunks rather than loaded
  globally.
- Responsive rules were preserved in a route-loaded stylesheet and retained
  for the existing 1199px, 500px, 400px, 320px, and 280px breakpoints.
- Browser preview logs still show the existing translation API 500 and
  unauthenticated API 401 responses; no missing CSS asset or lazy stylesheet
  error was observed.

## Validation status

| Check | Result |
| --- | --- |
| Production Vite build | Pass |
| CSS usage report | Pass — before snapshot recorded |
| Bundle report | Pass — measurable initial CSS reduction |
| TypeScript check | Existing failures remain in page implementations; no CSS-loader diagnostic remains |
| Frontend tests | Existing `EditTransactionModal` suite failures remain; no CSS-specific test failure |

The build-blocking duplicate handler declarations in
`EditTransactionModal.tsx` were removed so the production bundle could compile.
The component now uses the handlers returned by its existing hook; this does
not change the CSS architecture.

## Exit criteria

- [x] No feature imports the full legacy bundle just to obtain a few rules.
- [x] Shell, feature, responsive, and third-party CSS ownership is explicit.
- [x] Bootstrap delivery uses one CSS implementation and route-scoped behavior.
- [x] Font Awesome and unused intlTelInput assets are absent from the active graph.
- [x] Date-picker styles remain route-local.
- [x] Production CSS shows a measurable reduction in initial unused bytes.
- [x] Existing typography decisions are preserved.