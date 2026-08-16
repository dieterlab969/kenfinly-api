---
name: Frontend dependency drift
description: How to distinguish a missing installed Node package from a source-level Vite failure
---

The frontend build can fail because `node_modules` is incomplete even when the
dependency is declared in `package.json` and present in `package-lock.json`.

**Why:** A clean Vite build initially failed on a declared package that was
missing from the installed tree; reinstalling the declared package repaired the
environment without a source change.

**How to apply:** When Vite reports an unresolved package, check `npm ls
<package> --depth=0` and the lockfile before changing imports or build config.