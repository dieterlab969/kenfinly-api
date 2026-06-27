---
name: JWT Secret must be set
description: JWT_SECRET in .env is empty by default; auth-protected API routes return 500 until this is set.
---

# Rule
On fresh Replit environments or after database resets, `JWT_SECRET=` is blank in `.env`. Every `auth:api` middleware route returns HTTP 500 with "Secret is not set." until fixed.

**Why:** The Replit environment does not persist the generated secret across resets. The `.env.example` ships with an empty value.

**How to apply:** If all protected API endpoints return 500 (not 401), run:
```bash
php artisan jwt:secret --force
```
Then restart the workflow to reload the env. This is needed before any login or API test will work.
