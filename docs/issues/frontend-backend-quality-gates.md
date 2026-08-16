# Frontend and Backend Refactor Quality Gates

**Status:** Implemented as a baseline-aware validation command  
**Plan:** [Frontend and Backend Module Size Refactor Plan](frontend-backend-module-size-refactor-plan.md)

## Commands

```text
npm run quality:gates
npm run quality:gates:strict
npm run quality:ci
npm run quality:migrations
```

`quality:gates` is safe during the baseline period. It evaluates changed files
and current build output, while preserving existing baseline debt as context.
`quality:gates:strict` turns the extraction-test and inline-validation warnings
into failures. `quality:ci` rebuilds the application, writes the bundle report,
and writes a machine-readable review report to
`docs/issues/quality-gates-report.md`.
`quality:migrations` requires an explicitly disposable fresh database and an
explicit disposable current-schema copy for the upgrade check.

For pull-request or branch comparisons, set `QUALITY_GATES_BASE` to the merge
base or pass `--base=<ref>`. Without a base, only staged and unstaged changes
are checked. This prevents historical large modules from being misreported as
new regressions.

## Gate coverage

| Proposed gate | Enforcement |
| --- | --- |
| New route-level page modules stay under 500 lines | Changed `resources/js/pages` modules are checked; approved paths can be listed in `QUALITY_GATE_PAGE_EXCEPTIONS`. |
| Controllers have one responsibility boundary | Changed controllers fail when transport, persistence, file handling, and analytics-read indicators coexist. |
| Initial JavaScript excludes lazy feature/admin/Halo code | The Vite manifest must mark route pages as dynamic entries, and the initial entry is checked for admin/Halo leakage. |
| Global CSS is shell-owned | Global entrypoints are rejected when they import legacy feature bundles such as `style.css`, `swap.css`, or `all.min.css`. |
| New endpoints use validated payloads | Changed controllers are checked for raw request validation and mass assignment; strict mode fails those findings. |
| Migration install/upgrade safety | `quality:migrations` runs both fresh-install and upgrade-from-current-schema checks, and refuses to run without the disposable-database guard. |
| Extracted features retain focused tests | Changed service/request/policy/feature boundaries must be accompanied by a test change in strict mode. |
| Bundle/CSS regressions are visible in CI | `quality:ci` emits the bundle report and compares initial JS gzip and entry CSS against `quality-gates-baseline.json` with a 5% tolerance. |

## Migration verification

Migration checks must use disposable databases. The existing migration chain is
append-only, so the current developer database must never be used for
`migrate:fresh`.

The CI migration job should run with a real disposable current-schema URL
injected by the CI environment:

```text
MIGRATION_UPGRADE_DATABASE_URL="$MIGRATION_UPGRADE_DATABASE_URL" npm run quality:migrations
```

The command runs `migrate:fresh --seed` and `migrate:status` against a
disposable fresh database, then runs `migrate` and `migrate:status` against the
provided current-schema copy.

The connection and copy/restore mechanism are deployment-specific and must be
provided by CI (for example, a temporary PostgreSQL database). No command in
this repository drops or rewrites the configured development database.

## Baseline updates

Update `quality-gates-baseline.json` only after reviewing the generated
`frontend-bundle-baseline.md`, checking route behavior, and recording why the
new size is intentional. The baseline is a comparison input, not a success
claim that all refactor phases are complete.