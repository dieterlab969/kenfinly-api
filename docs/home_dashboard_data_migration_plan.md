# Home Dashboard Data Migration Plan

## Goal

Replace the redesigned Home dashboard's static demo values with the legacy Dashboard's real data-loading flow while preserving the new UI.

## Legacy Data Sources

| Data source | Backend/API | Legacy consumer | New Home mapping |
| --- | --- | --- | --- |
| Authenticated user | `AuthContext` backed by `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/refresh` | Navbar greeting and account actions in `resources/js/pages/Dashboard.jsx` | Header greeting (`Chào {user.name}`) in `resources/js/template/pages/Home.tsx` |
| Dashboard aggregate payload | `api.get('/dashboard')` → `GET /api/dashboard` | `Dashboard.jsx` `fetchDashboardData()` | Single Home dashboard fetch using the same API client |
| Monthly summary | `TransactionController::getDashboardData()` returns `monthly_summary.current` and `monthly_summary.previous` | `MonthlySummaryCard` | `Sơ lược` current/previous month half-donut columns |
| Accounts / total balance | `TransactionController::getDashboardData()` returns `accounts` with balances | `Dashboard.jsx` computes `totalBalance` via account sum and passes it to `BalanceTrendChart` | Header “TỔNG SỐ TIỀN SỞ HỮU” |
| Seven-day expenses | `TransactionController::getDashboardData()` returns `seven_day_expenses` grouped by date | Recharts bar chart via `prepareChartData()` | `Chi tiêu - 7 ngày qua` SVG bar chart |
| Balance history | `TransactionController::getDashboardData()` returns `balance_history` for last 7 months | `BalanceTrendChart` | `Số dư lịch sử` SVG line/area chart |
| Recent transactions | `TransactionController::getDashboardData()` returns `recent_transactions` with category/account | Recent transactions list and transaction detail modal | `Giao dịch gần đây` list with category icon/name/date/account and signed amount |
| Categories for transaction entry | `api.get('/categories?type=income|expense')` → `GET /api/categories` | `AddTransactionModal` category picker | Quick-add modal `Hạng mục` select |
| Accounts for transaction entry | `api.get('/accounts')` → `GET /api/accounts` | `AddTransactionModal` account picker | Quick-add modal `Tài khoản` select |
| Transaction creation / refresh | `api.post('/transactions')` → `POST /api/transactions` followed by dashboard refresh | `AddTransactionModal` save flow and `Dashboard.jsx` `handleTransactionAdded()` | Quick-add income/expense modal save then silent `GET /api/dashboard` refresh |

## Reusable Logic

- Reuse `resources/js/utils/api.js` for auth headers, JSON/FormData handling, and 401 redirects.
- Reuse `resources/js/constants/categories.js` `formatCurrency()` and `getCategoryIcon()` for display formatting and category emoji fallback.
- Reuse the legacy date-fill behavior from `Dashboard.jsx` so the 7-day chart always renders exactly seven days, including zero-value days.
- Reuse the same refresh behavior after a transaction save attempt by re-fetching dashboard data without the initial loading screen.
- Reuse the same quick-add API contract as the legacy transaction modal: `type`, `amount`, `category_id`, `account_id`, `transaction_date`, and optional `notes`.

## Required Integrations

- `GET /api/dashboard` from `routes/api.php`, implemented by `app/Http/Controllers/Api/TransactionController.php#getDashboardData`.
- `GET /api/categories?type={income|expense}` for quick-add category options.
- `GET /api/accounts` for quick-add account options.
- `POST /api/transactions` for quick-add transaction creation.
- Existing JWT auth token from `localStorage` through the shared `api` axios instance.
- Optional local user fallback from `localStorage.user` if `AuthContext` is unavailable in the template route tree.

## Potential Risks / Missing Dependencies

- The redesigned Home quick-add modal submits directly through the existing transaction API instead of mounting the legacy `AddTransactionModal`, so future transaction-form features such as attachments, recurrence, or split transactions still need explicit Home support if required.
- `monthly_summary.month` is formatted in English by the backend (`F Y`), while the redesigned UI labels are Vietnamese; Home normalizes known month strings client-side.
- `balance_history` may contain negative balances or flat/empty data; the SVG chart must guard against zero ranges and missing rows.
- Category translation context is not available in `Home.tsx`; recent transactions use backend category names and existing category icon slug mapping.
- Manual verification is needed with authenticated accounts that have income, expense, empty, and negative-balance scenarios.

## Migration Summary

### Data sources migrated

- `GET /api/dashboard` now powers the Home header total balance, monthly summary card, seven-day expense chart, balance-history chart, and recent-transactions section.
- `GET /api/auth/me` refreshes the greeting user, with `localStorage.user` as the initial fallback.
- `GET /api/categories?type={income|expense}` and `GET /api/accounts` populate the quick-add modal dynamically.
- `POST /api/transactions` creates quick-add income and expense records, followed by a silent dashboard refresh.

### Mock data removed

- Removed `SPENDING_7DAYS`, `TRANSACTIONS`, and `EXPENSE_CATEGORIES` static arrays from `resources/js/template/pages/Home.tsx`.
- Replaced hardcoded greeting, total balance, monthly summary values, seven-day chart ticks/tooltips, historical balance labels, recent transaction rows, quick-add date, and quick-add summary values with API-derived values.
- Removed the unused visual-only recurrence toggle because it was not connected to the existing transaction API contract.

### Assumptions made

- The template route tree does not expose `AuthContext`, so Home uses the shared API client and `localStorage.user` instead of introducing a second auth provider dependency.
- Backend dashboard amounts are whole VND values compatible with existing `formatCurrency()` handling.
- Recent transaction rows can be represented by category name/icon, transaction date, account name, and signed amount; there is no separate transaction-title field in the dashboard payload.

### Manual verification required

- Verify Home with an authenticated user that has non-empty income/expense data, empty data, and negative/flat balance-history scenarios.
- Verify quick-add income and expense creation against real accounts/categories, then confirm the Home cards and charts refresh without a full-page loading state.
- Verify the existing full TypeScript errors outside Home (`resources/js/template/App.tsx` JSX namespace and `resources/js/template/components/BarChartComponent.tsx` legend position typing) separately if a clean project-wide `tsc --noEmit` gate is required.