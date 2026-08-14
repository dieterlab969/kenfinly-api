---
name: App entry casing
description: Frontend entry-point naming constraint after moving the application module to the resources/js root
---

Keep the application module as `App.tsx` and use a distinct name such as
`main.tsx` for the Vite bootstrap entry. Do not keep both `App.tsx` and
`app.tsx` in the TypeScript include set.

**Why:** TypeScript's consistent-casing checks treat those two filenames as the
same module and fail the project typecheck even though Linux can store both.

**How to apply:** When adding or moving a root-level React entry point, update
the Vite and Blade entry references together and reserve `App.tsx` for the
application composition module.