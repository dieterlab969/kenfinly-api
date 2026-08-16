# Frontend Route Inventory

**Generated:** 2026-08-16T08:27:30.540Z
**Source:** `resources/js/App.tsx` route declarations and local imports

The current router declares **0 routes**. Ownership and
legacy status below are inventory heuristics for planning; nested guards
and runtime reachability still require route smoke tests.

| Route | Component | Source | Lines | Ownership | Review indicator |
| --- | --- | --- | ---: | --- | --- |

## Phase 0 observations

- `App.tsx` is still a single route composition point and currently
  eagerly imports the route components.
- `.jsx` files are marked as review candidates, not automatically dead
  code. Active public/admin flows may still use JSX.
- Phase 1 should split route registration and lazy-load by ownership or
  feature without changing any URL.

