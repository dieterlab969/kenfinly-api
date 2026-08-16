# Frontend and Backend Module Size Refactor Plan

**Status:** Proposed  
**Date:** 2026-08-16  
**Scope:** React/Vite frontend, Laravel API controllers, and database migrations

## 1. Problem statement

The application currently has a high amount of code concentrated in a small
number of runtime modules and global assets:

- The frontend contains **235** JavaScript/TypeScript modules.
- The largest frontend files are `WalletManagement.tsx` (1,416 lines),
  `Home.tsx` (1,405), `SubscriptionManagement.tsx` (1,021),
  `CategoryManagement.tsx` (1,006), and `EditTransactionModal.tsx` (960).
- `resources/js/App.tsx` eagerly imports a very large route tree and also
  imports Bootstrap plus the legacy global CSS files.
- The frontend ships several full stylesheet bundles:
  `bootstrap.min.css` (232 KB), `style.css` (103 KB), `all.min.css`
  (103 KB), `intlTelInput.css` (25 KB), and `swap.css` (22 KB).
- The backend contains **60 controllers** and **73 migrations**.
- `TransactionController.php` is 664 lines and mixes CRUD, validation,
  authorization, photo handling, change logging, ledger updates, and
  dashboard data.
- `39` controllers still contain inline validation, and controller response
  shapes are not consistently standardized.
- Migration filenames contain repeated timestamp prefixes, and schema changes
  have accumulated as feature-specific follow-up migrations rather than being
  governed by a single documented lifecycle.

This is primarily a maintainability and delivery problem, but it also affects
production behavior: the current route tree encourages a large initial
JavaScript bundle, global CSS increases style collisions and unused bytes, and
large controllers make authorization, validation, and transaction boundaries
harder to reason about.

## 2. Current constraints and decisions

1. **Refactor incrementally.** Do not rewrite the SPA, change the API contract
   wholesale, or squash migrations that may already have run in shared or
   production environments.
2. **Preserve route URLs and business behavior.** Existing routes such as
   `/WalletManagement`, `/Analytics`, and Halo flows remain stable while their
   implementations are extracted.
3. **Keep one frontend source root.** The previous
   `resources/js/template` reorganization is complete; this plan does not
   recreate a second application root.
4. **Use measured improvements.** Each phase must record bundle sizes, route
   behavior, test results, and API compatibility before and after the change.
5. **Prefer boundaries over arbitrary file splitting.** New modules should
   represent a page section, state/use-case, API resource, domain service, or
   infrastructure concern—not merely move blocks of code into smaller files.

## 3. Target architecture

### Frontend

```text
resources/js/
├── app/                 # Providers, router, route metadata, error boundary
├── features/
│   ├── transactions/
│   ├── wallets/
│   ├── categories/
│   ├── subscriptions/
│   ├── analytics/
│   └── halo/
├── pages/               # Thin route-level composition only
├── components/          # Cross-feature UI primitives
├── services/            # Typed API calls and transport adapters
├── hooks/               # Shared hooks and feature hooks
├── styles/
│   ├── tokens.css
│   ├── components/
│   └── features/
└── __tests__/
```

Each feature should own its API functions, types, hooks, page sections, and
feature-specific styles. Cross-feature components remain in `components/`.
Pages should compose feature modules instead of containing data fetching,
mutation logic, modal state, and presentation markup together.

### Backend

```text
app/
├── Http/
│   ├── Controllers/      # Transport orchestration only
│   ├── Requests/         # Validation and authorization
│   └── Resources/        # Stable response representations
├── Policies/             # Resource authorization
├── Services/
│   ├── Transactions/
│   ├── Wallets/
│   ├── Payments/
│   └── Analytics/
└── Data/                 # Optional DTOs/query objects where useful
```

Controllers should authenticate the request, call a use-case/service, and
return a resource or standardized response. Database transactions, ledger
side effects, file handling, and complex queries should live outside the
controller.

Migrations remain append-only for deployed databases. Schema ownership,
dependency order, reversibility, and data backfills should be documented per
feature. A future clean-install schema can be generated separately, but it
must not replace the historical migration chain without an explicit release
and rollback strategy.

## 4. Phased implementation plan

### Phase 0 — Baseline and guardrails

**Goal:** Capture the current behavior and prevent the refactor from becoming
an unmeasured rewrite.

Tasks:

- Record Vite production output by entry/chunk, total transferred size, and
  largest chunks.
- Add a repeatable bundle report command to CI or the validation workflow.
- Record the initial frontend test, TypeScript, PHP lint, and Laravel feature
  test results.
- Inventory route-to-page ownership and identify pages that are legacy
  templates versus active product flows.
- Inventory each controller's route, authentication middleware, policies,
  request validation, side effects, and response shape.
- Create a migration ownership map: table, owning feature, dependencies,
  destructive operations, and whether the migration is safe to run more than
  once in a fresh database.
- Add a definition-of-done checklist requiring focused tests and a
  before/after size measurement for each extracted module.

Deliverables:

- Baseline bundle report.
- Frontend route inventory.
- Backend controller/endpoint inventory.
- Migration ownership and dependency map.

### Phase 1 — Frontend entrypoint and route-level code splitting

**Goal:** Stop every route from being eagerly imported into the initial app
bundle.

Tasks:

- Replace the large static import list in `resources/js/App.tsx` with route
  modules loaded through `React.lazy` and `Suspense`.
- Group routes into public/authenticated/admin/feature route registries so
  the app shell and route definitions are small and navigable.
- Keep providers that are truly global in `main.tsx`; move feature providers
  closer to the routes that need them.
- Add an error boundary and loading state for lazy route failures.
- Preserve existing URLs, authentication guards, and browser refresh behavior.
- Add smoke tests that visit representative public, authenticated, admin,
  wallet, transaction, and Halo routes.

Expected result:

- Initial JavaScript contains the app shell and the first route only.
- Wallet, analytics, subscription, admin, and Halo code is downloaded on
  demand instead of at startup.
- Route-level failures display a recoverable UI rather than a blank screen.

### Phase 2 — Split the largest frontend pages by responsibility

**Goal:** Make large pages thin compositions of independently testable
sections and hooks.

Recommended extraction order:

1. `Home.tsx`
   - dashboard query/use-case hook
   - balance and summary cards
   - recent transactions
   - chart/analytics sections
   - logout/offcanvas interaction
2. `WalletManagement.tsx`
   - wallet list/table
   - create/edit form
   - adjust-balance flow
   - delete confirmation
   - wallet API/types hook
3. `SubscriptionManagement.tsx`
   - plan summary
   - subscription list
   - payment history
   - cancellation/change-plan actions
4. `CategoryManagement.tsx`
   - category filters/list
   - category form
   - delete/restore state
5. `EditTransactionModal.tsx` and related transaction modals
   - form state and validation hook
   - photo attachment section
   - category/account selectors
   - submit/error state
   - modal shell

Rules:

- Move business logic into feature hooks/services before moving markup.
- Define props and API payloads explicitly; do not pass large untyped objects
  through multiple layers.
- Keep mutation/invalidation behavior in one feature hook.
- Preserve the existing wallet balance policy and transaction audit trail.
- Remove old imports only after focused tests pass.

### Phase 3 — Consolidate and scope frontend CSS

**Goal:** Reduce unused global CSS and prevent style ownership from being
spread across full legacy bundles.

Tasks:

- Produce a CSS usage report before deleting or rewriting selectors.
- Identify which rules in `style.css` belong to active screens, legacy
  template screens, Bootstrap overrides, or third-party widgets.
- Load only the CSS required by the active application shell globally.
- Move feature styles into feature-owned files and import them from the
  feature entry point or lazy route.
- Replace duplicate Bootstrap delivery with one deliberate strategy:
  either the React Bootstrap/component imports or a single CSS entry, not
  both competing global implementations.
- Audit `all.min.css` and replace the full icon font with the icons actually
  used, preferably through the existing `lucide-react` path where practical.
- Keep `intlTelInput.css` and date-picker styles limited to the routes/components
  that use those widgets.
- Remove unused `swap.css`, media rules, and legacy selectors only after
  visual regression checks at mobile, tablet, and desktop widths.
- Consolidate tokens, typography, spacing, colors, and dark-mode variables
  into a small owned stylesheet. Preserve the current product typography
  decisions unless design review approves a change.

Exit criteria:

- No feature imports the same full legacy bundle merely to get a few rules.
- CSS is attributable to the shell, a feature, or a third-party dependency.
- The production CSS report shows a measurable reduction in unused bytes.

### Phase 4 — Introduce backend application boundaries

**Goal:** Reduce controller complexity without changing endpoint behavior.

Tasks:

- Add or standardize Form Requests for remaining inline validation,
  beginning with transaction, auth, account, payment, subscription, and CSV
  endpoints.
- Add Policies for accounts/wallets, categories, commitments, payments,
  subscriptions, and other user-owned resources currently checked inline.
- Extract `TransactionController` into focused services/query objects:
  - create/update/delete transaction use cases
  - balance and ledger synchronization
  - transaction photo management
  - change-log recording
  - filtering/pagination query
  - analytics/dashboard reads
- Apply the same pattern to `AccountController`, payment controllers, and
  `UserSubscriptionController` after transactions.
- Use API Resources or response DTOs for stable representations. Establish
  one envelope such as `{ success, data, message, meta, errors }`, then
  migrate endpoints by resource family rather than changing all endpoints at
  once.
- Replace `$request->all()` persistence with validated, explicit payloads.
- Centralize pagination, validation error, authorization error, and not-found
  behavior.
- Add service-level transaction boundaries for operations that update both
  business records and ledger/summary records.

Compatibility requirements:

- Existing consumers must continue to receive the fields they need during
  the migration.
- If an envelope changes, support a versioned endpoint or a compatibility
  adapter rather than silently changing every response.
- Authorization tests must cover both the resource owner and another user
  attempting access.

### Phase 5 — Migration governance and schema cleanup

**Goal:** Make the 73-migration history safer to extend and easier to audit.

Tasks:

- Do not edit or reorder migrations already applied outside local development.
- Add a migration lint/check that flags:
  - duplicate migration class names or ambiguous timestamp collisions
  - missing down behavior where rollback is safe and meaningful
  - foreign keys created before their referenced tables
  - destructive operations without an explicit review marker
  - indexes/unique constraints that duplicate existing ones
  - nullable/default changes that can lock or rewrite large tables
- Group future migrations by feature ownership in documentation while
  retaining Laravel's migration directory.
- Separate schema changes from data backfills. Backfills should be resumable,
  bounded, observable, and safe to retry.
- Review foreign-key delete behavior for financial records, user-owned data,
  payments, and audit logs. Use restrictive deletes where historical records
  must not disappear silently.
- Add schema/index tests for high-volume tables and verify query plans for
  transaction, account, payment, and analytics queries.
- Generate a fresh-database install check and a production-like upgrade
  check in CI.
- Only consider a future baseline/squash after backups, a tested upgrade path,
  and an explicit release decision.

### Phase 6 — Remove legacy paths and enforce the architecture

**Goal:** Prevent regression after the refactor.

Tasks:

- Delete superseded frontend modules, duplicate JSX/TSX implementations, and
  unused CSS only after import/search checks confirm they are unreachable.
- Add ESLint/TypeScript import rules for feature ownership and forbidden
  cross-feature internals.
- Add a controller rule/check that discourages inline validation and raw
  request mass assignment in new code.
- Add architecture documentation for route registration, feature modules,
  API services, response resources, and migration ownership.
- Set review thresholds for new page/controller size and require a design note
  when a module exceeds them.
- Re-run bundle, CSS, endpoint, migration, and test baselines and publish the
  results with the release.

## 5. Proposed quality gates

These are targets to validate after the baseline is measured; they should not
be treated as arbitrary success claims before implementation:

- No new route-level page module exceeds **500 lines** without an approved
  exception.
- No new controller mixes transport, persistence orchestration, file handling,
  and analytics reads in one class.
- Initial frontend JavaScript excludes lazy feature pages and admin/Halo
  bundles.
- Global CSS contains only shell/tokens/intentional framework rules.
- New endpoints use Form Requests, Policies where applicable, Resources/DTOs,
  and explicit validated payloads.
- Fresh install and upgrade-from-current-schema migration checks both pass.
- Every extracted feature retains or adds focused tests.
- Bundle and CSS size regressions are visible in CI rather than discovered
  after deployment.

## 6. Testing and verification strategy

### Frontend

- Unit test extracted hooks for loading, success, mutation, error, and retry
  states.
- Keep component tests for wallet, transaction, subscription, category, and
  authentication-critical flows.
- Add route smoke tests for lazy loading and guarded routes.
- Run TypeScript compilation and production Vite builds.
- Use visual regression or screenshot checks for the page sections affected by
  CSS extraction at mobile and desktop breakpoints.

### Backend

- Form Request tests for valid payloads, invalid values, missing fields, and
  authorization.
- Policy tests for owner, non-owner, admin, and unauthenticated access.
- Service tests for transaction/balance/ledger atomicity and rollback.
- Feature tests that assert response envelopes and pagination metadata.
- Regression tests for wallet deletion, transaction history preservation,
  payment/subscription side effects, and CSV validation.
- Migration tests for fresh install and upgrade paths; run `php artisan
  migrate:fresh --seed` only against disposable test data.

### Release checks

```text
npm run build
npx tsc --noEmit
npm run test
php artisan test
php artisan migrate:status
```

The exact command set may be wired into the repository's validation workflow,
but each phase must report failures separately so an existing unrelated test
failure is not mistaken for a refactor regression.

## 7. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Lazy routes change startup/auth behavior | Preserve providers/guards, add route smoke tests, and test refresh/deep links |
| CSS extraction causes visual regressions | Generate usage inventory, extract by feature, and compare mobile/desktop screenshots |
| Response standardization breaks consumers | Migrate by resource family, use compatibility adapters or versioned endpoints |
| Service extraction changes ledger atomicity | Add transaction/rollback tests before moving side effects |
| Migration cleanup breaks deployed databases | Keep applied migrations immutable and test upgrade paths on a production-like copy |
| Removing duplicate JSX/TSX loses an active route | Search imports, inspect route registry, build, and run route smoke tests before deletion |
| Refactor expands without measurable benefit | Require baseline/target metrics and stop at each phase exit criteria |

## 8. Recommended implementation order

1. Complete Phase 0 and publish the baseline.
2. Split the route tree and establish lazy loading.
3. Extract wallet and transaction features first because they are central and
   already covered by focused tests.
4. Split the remaining high-volume pages.
5. Consolidate CSS after feature ownership is clear.
6. Extract backend validation/policies and the transaction use cases.
7. Apply response/resource conventions to the remaining controllers.
8. Add migration governance and fresh/upgrade checks.
9. Remove unreachable legacy modules and enforce the new boundaries.

This order limits simultaneous risk: frontend delivery improves before large
visual cleanup, and backend controller extraction begins with the domain that
has the strongest financial correctness requirements.