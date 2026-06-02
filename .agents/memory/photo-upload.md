---
name: Transaction Photo Upload
description: Correct field name and package dependency for photo uploads
---

## Endpoint
`POST /api/transactions/{transaction}/photos`

## Field name
`photo` — SINGULAR. Not `photos`, not `image`. The controller does `$request->file('photo')`.
Using `photos` returns 422 "The photo field is required."

## Package dependency
`intervention/image` must be installed for the route to work.
In test environments without it: use `markTestSkipped()` — do not let the test fail.

```php
if (!class_exists(\Intervention\Image\Laravel\Facades\Image::class)) {
    $this->markTestSkipped('intervention/image not available');
}
```

**Why:** TransactionPhotoService uses Intervention Image for optimization. Without it, the service throws a class-not-found 500.
