---
name: Scramble docs routing
description: How to prevent the React SPA catch-all from intercepting /docs/api served by Scramble
---

The React SPA in web.php has a catch-all `Route::get('/{any}', ...)` with `where('any', '.*')` that
matches everything, including Scramble's `/docs/api` and `/docs/api.json` routes.

**Rule:** The SPA catch-all regex must exclude `docs` paths.

**How to apply:**
```php
// routes/web.php — catch-all must NOT match /docs/*
Route::get('/{any}', fn () => view('welcome'))
    ->where('any', '^(?!docs).*');
```

**Why:** Laravel resolves web routes in registration order. The Scramble service provider
registers its routes during `boot()`, but if the catch-all is already registered (or evaluated)
first with `.*`, it wins. The negative lookahead `^(?!docs).*` lets Scramble handle
all `/docs/*` requests while the SPA still handles everything else.

Same pattern applies for any other server-side route that must not be captured by the SPA:
add it to the negative lookahead, e.g. `^(?!docs|api-spec).*`.
