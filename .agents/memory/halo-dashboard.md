---
name: Halo Dashboard Architecture
description: How the mobile Halo dashboard is structured — route, files, CSS, layout pattern
---

## Route
`/halo` — protected by ProtectedRoute (same as /dashboard). Registered in App.jsx.

## File Layout
- `resources/js/pages/halo/HaloDashboard.jsx` — page root; owns dashboard data, modal state
- `resources/js/components/halo/HaloLayout.jsx` — shell: mobile topbar, FAB (+), bottom nav
- `resources/css/halo.css` — all Halo semantic CSS; imported via resources/css/app.css

## Layout Pattern
HaloLayout receives `onFabExpense` and `onFabIncome` callbacks from HaloDashboard.
FAB click → picker overlay → calls the right callback → HaloDashboard opens AddTransactionModal with `defaultType`.

## Mobile vs Desktop
- `.halo-topbar`, `.floating-action-btn`, `.halo-bottom-nav` are `display:none` by default
- All three shown only inside `@media (max-width: 767.98px)`
- Desktop sees content without mobile chrome

## Section Order (mobile)
1. HaloRitualCard — circular ring gauge + attendance check-in/out (reuses /api/attendance/*)
2. HaloMonthlySummary — two SVG semi-circle arc gauges side-by-side (income=green, expense=orange/red)
3. HaloInsights — Expenses Last 7 Days bar chart (rendered ONCE, no duplicates)
4. HaloBalanceChart — area chart with total balance

**Why separate route instead of modifying /dashboard:**
Desktop layout must remain unchanged per spec. Separate route avoids any risk of regression.
