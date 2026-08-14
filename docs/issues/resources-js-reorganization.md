# JavaScript Resources Reorganization

**Date:** 2026-08-14  
**Scope:** `resources/js`

## Problem analysis

The frontend source had grown around a copied `resources/js/template` directory.
That directory contained the active TypeScript application entry point as well as
components, hooks, pages, context, and static assets. Meanwhile, the surrounding
`resources/js` directory already contained the application's components, pages,
hooks, services, utilities, tests, and legacy entry files.

This created several organizational problems:

- The active application entry point was hidden at `resources/js/template/App.tsx`
  even though it was loaded by the main Vite entry file.
- The source had two competing roots: the real application root and a copied
  `template` root.
- Related files were split between `resources/js/template/*` and
  `resources/js/*`, making imports and ownership harder to understand.
- Relative imports from moved pages and hooks depended on the extra `template`
  directory depth.
- Documentation and a test still referred to the old `template` paths.

## Changes implemented

### Entry point

Moved:

```text
resources/js/template/App.tsx
→ resources/js/App.tsx
```

Renamed the Vite bootstrap entry point from `resources/js/app.tsx` to
`resources/js/main.tsx` so it does not conflict with the case-sensitive
`resources/js/App.tsx` application module. Updated the Vite and Blade entry
references, and changed the bootstrap import to `./App`.
The moved application entry point now references root-level assets, contexts,
components, and pages.

### Subfolder reorganization

Moved the former template subfolders directly under `resources/js`:

```text
resources/js/template/assets/
→ resources/js/assets/

resources/js/template/components/
→ resources/js/components/

resources/js/template/context/
→ resources/js/context/

resources/js/template/hooks/
→ resources/js/hooks/

resources/js/template/pages/
→ resources/js/pages/
```

Existing top-level folders were preserved and the template files were merged
into them. No same-relative-path filename collisions were found.

### Import and reference cleanup

- Updated relative imports in the moved application, pages, and hooks to match
  their new directory depth.
- Updated the wallet management test to import from `resources/js/pages`.
- Updated source comments and repository documentation that referenced the old
  `resources/js/template` paths.
- Removed the now-empty `resources/js/template` directory.

## New organizational structure

The frontend source now has one clear root:

```text
resources/js/
├── App.tsx                 # Active React router/application composition
├── main.tsx                # Vite bootstrap and outer providers
├── assets/                 # CSS, fonts, images, and SVG assets
├── components/             # Reusable UI components
├── context/                # Template feature context
├── contexts/               # Application-wide contexts
├── constants/              # Shared constants and category definitions
├── hooks/                  # Reusable React hooks
├── i18n.ts                 # Translation setup
├── locales/                # Translation resources
├── pages/                  # Route-level screens
├── services/               # External and feature service modules
├── utils/                  # Shared utility modules
└── __tests__/              # Frontend tests
```

The existing `app.js`, `app.jsx`, and related legacy entry files remain in place
because this change is a path and ownership reorganization, not a separate
legacy-entrypoint migration.

## Verification results

- `npm run build` passes. Vite resolves the new entry point and all moved
  assets; it emits only the existing large-chunk warning.
- The `dev-server` workflow was restarted successfully and serves the app.
  The unauthenticated preview reaches the application loading state and
  reports the expected API `401` response.
- The relocated wallet test passes: `28/28` tests.
- The full suite currently reports `51` passing tests and `18` failures in the
  existing `EditTransactionModal` test suite. Those failures are unrelated to
  the path move and concern existing test labels/interaction expectations.
- `npx tsc --noEmit` still reports four existing diagnostics in
  `DeleteAccount.tsx`, `Security.tsx`, and `pages/halo/HaloDashboard.tsx`.
  None reference the reorganized entry point or moved template imports.

The successful build and focused moved-page test protect against the
reorganization-specific risks: broken relative imports, missing moved assets,
and an entry point that Vite can no longer resolve.