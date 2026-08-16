---
name: Phase 3 CSS ownership
description: The active frontend keeps only shell CSS global and loads route-owned CSS through the lazy route boundary.
---

The active app should keep `kenfinly-core.css` and the single Bootstrap CSS entry global. Public, auth, finance, account, dashboard, responsive, Halo, and widget styles must load at their route/component boundary instead of importing the audited legacy bundle globally.

**Why:** The legacy template stylesheet mixed unrelated screens and third-party overrides, making the initial CSS payload large and making visual regressions hard to attribute.

**How to apply:** Add new screen selectors to the smallest owned feature stylesheet, keep date-picker/widget CSS at the component that uses it, and run the Phase 3 CSS report plus production bundle report after ownership changes.