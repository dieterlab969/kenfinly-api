---
name: Frontend build requirement
description: The dev server serves a pre-compiled Vite bundle — must rebuild after any TSX changes
---

## Rule
`php -S 0.0.0.0:5000 server.php` serves from `/public/build/`. Any change to `.tsx`, `.ts`,
or other frontend source files WILL NOT be visible until you run `npm run build`.

## Why
The workflow uses the PHP built-in server which only serves static files.
There is no Vite dev server with hot-reload in the current workflow configuration.

## How to apply
After any frontend change, run `npm run build` (~45 seconds), then restart the dev-server workflow.
The new bundle will have a new content-hash filename (e.g., app-DRVQNShA.js).
