---
name: API route group structure
description: How api.php route groups are nested; where to add new authenticated endpoints
---

## Rule
Standard user API routes live inside two nested middleware groups:
```php
Route::middleware('auth:api')->group(function () {
    Route::middleware('halo.integrity')->group(function () {
        // Most routes including /categories, /accounts, /transactions
    });
});
```
URL prefix is `/api/<resource>` — NO `v1` prefix in this group.
The saving-tracker routes have their own separate `auth:api + halo.integrity` group with `/saving-tracker` prefix.

## Why
The `halo.integrity` middleware verifies Halo Points ledger consistency.
It runs for all main API endpoints, not just Halo-specific ones.

## How to apply
Add new user-facing API endpoints inside the `halo.integrity` group, right near
related routes. Keep admin routes in `api/admin/*` group (separate middleware).
