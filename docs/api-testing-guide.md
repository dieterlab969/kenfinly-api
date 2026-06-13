# Kenfinly API Documentation & Testing Guide

## Overview

### Package chosen: Scramble (`dedoc/scramble` v0.13.x)

**Why Scramble over L5-Swagger / OpenAPI Annotations:**

| Criterion | Scramble | L5-Swagger |
|-----------|----------|------------|
| Laravel 12 support | ✅ Native | ✅ With config |
| Zero-annotation setup | ✅ Auto-discovers all routes | ❌ Every method must be annotated |
| Schema inference | ✅ From validation rules, type-hints, Resources | ❌ Manual `@OA\Schema` everywhere |
| Interactive UI | ✅ Stoplight Elements (built-in) | ✅ Swagger UI (built-in) |
| Bearer token testing | ✅ One-click Authorize dialog | ✅ One-click Authorize dialog |
| File upload support | ✅ Auto-detected from `image`/`file` rules | ✅ Manual `@OA\RequestBody` |
| Maintenance overhead | Low — PHPDoc on new methods only | High — annotations on every endpoint |

Scramble reads your **Form Request `rules()`**, **PHPDoc `@bodyParam` / `@queryParam`** tags, **return type hints**, and **API Resources** to produce a full OpenAPI 3.1 specification automatically. No YAML or annotation boilerplate is needed on existing endpoints.

---

## Installation

### Dependencies installed

```
composer require dedoc/scramble
```

Scramble version `^0.13.27` was added to `composer.json`.

### Configuration changes made

| File | Change |
|------|--------|
| `config/scramble.php` | Published via `artisan vendor:publish`; JWT Bearer security strategy enabled; API title and description set |
| `app/Providers/AppServiceProvider.php` | `Scramble::afterOpenApiGenerated()` hook registered to set title, version, and contact info |
| `app/Http/Controllers/Api/*.php` | Added `@tags` class docblocks for grouping; added `@bodyParam` / `@queryParam` PHPDoc where validation is inline |
| `app/Http/Controllers/Admin/*.php` | Added `@tags Admin — *` class docblocks |
| `app/Http/Controllers/Api/SavingTracker/*.php` | Added `@tags Saving Tracker — *` class docblocks |

---

## Accessing the API Documentation

### Local / Replit environment

| URL | Description |
|-----|-------------|
| `http://localhost:5000/docs/api` | Interactive Stoplight Elements UI |
| `http://localhost:5000/docs/api.json` | Raw OpenAPI 3.1 JSON spec |

When running in Replit, replace `localhost:5000` with your Replit preview URL, e.g.:

```
https://<your-repl>.repl.co/docs/api
```

### Production environment

By default, Scramble's `RestrictedDocsAccess` middleware blocks access when `APP_ENV=production`. To enable docs in production you must either:

**Option A — Allow specific IPs** (recommended):

```php
// app/Http/Middleware/RestrictedDocsAccess.php (custom override)
// Or extend the class and override shouldHaveAccess()
```

**Option B — Remove the restriction middleware** (only for internal / private APIs):

In `config/scramble.php`:
```php
'middleware' => [
    'web',
    // Remove RestrictedDocsAccess::class to open docs publicly
],
```

> ⚠️ Never expose internal admin docs publicly. Use IP whitelisting or VPN-gated middleware.

---

## Testing APIs

### How to call GET endpoints

GET endpoints accept parameters in the query string. In the Stoplight UI:

1. Open the endpoint (e.g., `GET /transactions`).
2. Click **Try it** (the right panel).
3. Fill in query parameters in the **Parameters** tab.
4. Click **Send**.

**cURL equivalent:**
```bash
curl -X GET "https://<host>/api/transactions?per_page=10&type=expense" \
  -H "Authorization: Bearer <your_token>"
```

---

### How to call POST endpoints

1. Open the endpoint (e.g., `POST /transactions`).
2. Click **Try it**.
3. Switch to the **Body** tab.
4. Fill in the JSON body fields.
5. Click **Send**.

**cURL equivalent:**
```bash
curl -X POST "https://<host>/api/transactions" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": 1,
    "category_id": 3,
    "type": "expense",
    "amount": 150000,
    "transaction_date": "2024-06-01",
    "notes": "Grocery shopping"
  }'
```

---

### How to call PUT/PATCH endpoints

Use `PUT` for full replacement and `PATCH` for partial updates. The Kenfinly API treats `PUT` and `PATCH` identically (all fields are optional via `sometimes` validation rules).

**cURL equivalent:**
```bash
curl -X PUT "https://<host>/api/transactions/42" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 200000}'
```

---

### How to call DELETE endpoints

1. Open the endpoint (e.g., `DELETE /transactions/{transaction}`).
2. Fill in the path parameter `transaction` (the transaction ID).
3. Click **Send**.

**cURL equivalent:**
```bash
curl -X DELETE "https://<host>/api/transactions/42" \
  -H "Authorization: Bearer <your_token>"
```

---

### How to upload files

Several endpoints accept file uploads:

| Endpoint | Field | Type | Max Size |
|----------|-------|------|----------|
| `POST /api/transactions` | `receipt` | image (jpeg/png/gif/bmp) | 20 MB |
| `POST /api/transactions/{id}/photos` | `photo` | image | 20 MB |
| `POST /api/commitments` | `image` | image (jpeg/png) | 5 MB |
| `POST /api/logo/upload` | `logo` | image | — |
| `POST /api/admin/logos/upload` | `logo` | image | — |
| `POST /api/admin/favicon` | `favicon` | image | — |

In the Stoplight Elements UI, file fields appear as **file picker** inputs — click the field and select your file.

**cURL equivalent (multipart/form-data):**
```bash
curl -X POST "https://<host>/api/transactions/42/photos" \
  -H "Authorization: Bearer <your_token>" \
  -F "photo=@/path/to/receipt.jpg"
```

> Always use `multipart/form-data` (not `application/json`) when sending file uploads. Do **not** combine JSON body with file uploads in the same request — use form fields instead.

---

### How to test authenticated APIs

All protected endpoints are marked with a **padlock icon** (🔒) in the Stoplight UI.

**Step 1 — Obtain a token (see Authentication section below)**

**Step 2 — Authorize in the UI:**
1. Click the **Authorize** button (top-right of the docs page).
2. In the dialog, paste your JWT token into the `bearerAuth` field.
3. Click **Authorize** then **Close**.
4. All subsequent **Try it** requests automatically include `Authorization: Bearer <token>`.

**Token persistence:** The token is stored in the browser session. It clears when you close or refresh the tab. Re-authorize after each page reload.

---

## Authentication

### How to obtain a token

**Endpoint:** `POST /api/auth/login`

**Request body:**
```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

**Successful response:**
```json
{
  "success": true,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "name": "Test Owner",
    "email": "owner@example.com"
  }
}
```

Copy the value of `access_token`.

**Test credentials (seeded):**

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@kenfinly.com` | `Admin@123` |
| Owner | `owner@example.com` | `password123` |
| Editor | `editor@example.com` | `password123` |
| Viewer | `viewer@example.com` | `password123` |

---

### How to configure Bearer authentication

#### In the Stoplight Elements UI (docs browser)

1. Navigate to `/docs/api`.
2. Click **Authorize** (top-right lock icon).
3. Under **bearerAuth (http, Bearer)**, paste the token.
4. Click **Authorize**.

#### In cURL

```bash
curl -H "Authorization: Bearer eyJ0eXAi..." https://<host>/api/auth/me
```

#### In Postman / Insomnia

1. Under **Authorization**, select **Bearer Token**.
2. Paste the token value.

#### In JavaScript (Fetch)

```javascript
const token = 'eyJ0eXAi...';
const response = await fetch('/api/transactions', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

---

### Token refresh

Tokens expire after **1 hour** (configurable via `JWT_TTL` env var). Refresh before expiry:

```bash
curl -X POST "https://<host>/api/auth/refresh" \
  -H "Authorization: Bearer <current_token>"
```

---

### Example authenticated requests

**Get your profile:**
```bash
curl "https://<host>/api/auth/me" \
  -H "Authorization: Bearer <token>"
```

**List your accounts:**
```bash
curl "https://<host>/api/accounts" \
  -H "Authorization: Bearer <token>"
```

**Get dashboard data:**
```bash
curl "https://<host>/api/dashboard" \
  -H "Authorization: Bearer <token>"
```

---

## Adding New APIs

### How to create a new endpoint so it appears automatically in the docs

Scramble discovers **all routes under the `api` prefix** automatically. You do not need to register anything with Scramble. Just:

1. **Add the route** to `routes/api.php`.
2. **Create (or update) the controller** with a properly documented method.
3. Scramble picks it up on the next page load (or after `php artisan scramble:clear`).

### Recommended controller structure

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFooRequest;     // Use Form Requests for validation
use App\Http\Resources\FooResource;        // Use API Resources for responses
use App\Models\Foo;
use Illuminate\Http\JsonResponse;

/**
 * Manage Foo resources.
 *
 * @tags Foos                               ← required for grouping in the UI
 */
class FooController extends Controller
{
    /**
     * List all Foos for the authenticated user.
     *
     * @queryParam per_page int Results per page (default 15). Example: 15
     * @queryParam type string Filter by type: bar or baz. Example: bar
     *
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $items = Foo::where('user_id', auth('api')->id())
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => FooResource::collection($items),
        ]);
    }

    /**
     * Create a new Foo.
     *
     * @return JsonResponse
     *
     * @response 201 {"success": true, "message": "Foo created", "data": {"id": 1}}
     * @response 422 {"success": false, "errors": {"name": ["The name field is required."]}}
     */
    public function store(StoreFooRequest $request): JsonResponse
    {
        $foo = Foo::create([
            'user_id' => auth('api')->id(),
            ...$request->validated(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Foo created successfully',
            'data' => new FooResource($foo),
        ], 201);
    }
}
```

### How to ensure new endpoints appear in the documentation

| Task | Action |
|------|--------|
| New controller | Add `@tags GroupName` class docblock |
| New method | Add PHPDoc with `@queryParam`, `@bodyParam`, `@response` as needed |
| New Form Request | Scramble reads `rules()` automatically — no extra work |
| New API Resource | Scramble infers the shape — no extra work |
| Clear doc cache | `php artisan scramble:clear` |

---

## Common Troubleshooting

### Missing routes

**Symptom:** An endpoint you just created does not appear in `/docs/api`.

**Fixes:**
1. Ensure the route is under the `api` prefix in `routes/api.php`.
2. Check `config/scramble.php` → `api_path` is set to `'api'`.
3. Clear the Scramble cache: `php artisan scramble:clear`.
4. Clear the Laravel route cache: `php artisan route:clear`.

```bash
php artisan scramble:clear
php artisan route:clear
```

---

### Incorrect schemas

**Symptom:** Request body shows no fields, or response schema is wrong.

**Fixes:**
1. **Request body empty?** — Move inline `Validator::make()` rules to a dedicated `FormRequest` class. Scramble reads `FormRequest::rules()` directly.
2. **Response schema wrong?** — Return an `API Resource` instead of a raw `Model` or array. Scramble can infer typed arrays from Resources.
3. **Add explicit `@bodyParam` tags** for inline validation that you cannot move:
   ```php
   /**
    * @bodyParam name string required The display name. Example: My Account
    * @bodyParam balance numeric required Opening balance in major units. Example: 1000
    */
   ```

---

### Authentication failures

**Symptom:** `401 Unauthorized` when testing authenticated endpoints.

**Fixes:**
1. Click **Authorize** in the docs UI and paste a fresh token.
2. Verify the token is not expired — tokens last 1 hour by default. Re-login to get a new one.
3. Confirm the `JWT_SECRET` environment variable is set and matches the one used when the token was issued.
4. Some endpoints require a **verified email** — use the seeded test users (already verified) or call `POST /api/email/resend` then `POST /api/email/verify`.

---

### Cache issues

**Symptom:** Documentation shows stale data after code changes.

```bash
# Clear Scramble's OpenAPI cache
php artisan scramble:clear

# Clear all Laravel caches
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

For production, also:
```bash
php artisan scramble:cache   # Pre-warm the cache after deployment
```

---

### File upload not appearing in the docs

**Symptom:** A file field is not shown in the request body UI.

**Fix:** Ensure the validation rule includes `file` or `image`:
```php
'photo' => 'required|image|max:20480',   // ✅ Scramble detects as file upload
'photo' => 'required|string',            // ❌ Shown as text field
```

---

## Best Practices

### Recommended controller structure

```
app/Http/Controllers/Api/
├── AuthController.php          — auth:api + email verification
├── AccountController.php       — apiResource, scoped to user
├── TransactionController.php   — apiResource + photo sub-resources
├── CategoryController.php      — read-only catalogue
└── SavingTracker/
    ├── HabitController.php
    ├── HabitTrackingController.php
    └── AchievementController.php
```

- One responsibility per controller.
- Group related controllers in sub-namespaces (e.g., `SavingTracker`, `Admin`).
- Always add `@tags` on the class — it controls how the endpoint appears in the sidebar.

---

### Request validation

**Prefer Form Requests over inline Validator:**

```php
// ✅ Best — Scramble reads rules() automatically
public function store(StoreFooRequest $request): JsonResponse { ... }

// ⚠️ Acceptable — Add @bodyParam docblocks manually
public function store(Request $request): JsonResponse
{
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
    ]);
}
```

**Form Request skeleton:**
```php
class StoreFooRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'amount'   => ['required', 'integer', 'min:1'],
            'image'    => ['nullable', 'image', 'max:5120'],
        ];
    }
}
```

---

### API resources

Use `JsonResource` to control response shapes and prevent leaking internal fields:

```php
class FooResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```

Return resources from controllers:
```php
return response()->json([
    'success' => true,
    'data'    => new FooResource($foo),         // single
    // 'data' => FooResource::collection($foos), // collection
]);
```

---

### Versioning strategy

The project currently uses a hybrid approach:

| Prefix | Used for | Example |
|--------|----------|---------|
| `/api/` (no version) | Stable user-facing endpoints | `/api/transactions` |
| `/api/v1/` | Versioned engine endpoints | `/api/v1/pomodoro/start` |

**Recommended for new breaking changes:**

1. Register a new version prefix in `routes/api.php`:
   ```php
   Route::prefix('v2')->group(function () {
       Route::apiResource('transactions', TransactionV2Controller::class);
   });
   ```
2. Use `Scramble::registerApi()` in `AppServiceProvider` to document multiple API versions as separate specs.

---

### Documentation standards

Every controller **must** have:
- A `@tags GroupName` class docblock — controls sidebar grouping.
- A class-level description sentence.

Every public method **should** have:
- A one-line summary.
- `@queryParam` for each query parameter (if not in a Form Request).
- `@bodyParam` for each body parameter (if not in a Form Request).
- `@response` examples for non-obvious status codes (4xx, 5xx).

**Docblock template:**
```php
/**
 * One-line summary of what this endpoint does.
 *
 * Optional longer description explaining behaviour, side-effects,
 * business rules, or constraints.
 *
 * @queryParam per_page int Results per page (default 15). Example: 15
 * @bodyParam  name     string required Display name. Example: My Item
 *
 * @response 201 {"success": true, "message": "Created", "data": {"id": 1}}
 * @response 422 {"success": false, "errors": {"name": ["required"]}}
 */
public function store(StoreFooRequest $request): JsonResponse
```

---

## Quick Reference

### Useful artisan commands

```bash
# Clear Scramble cache (run after adding routes or editing docblocks)
php artisan scramble:clear

# Pre-warm the cache (run during deployment)
php artisan scramble:cache

# Export the raw OpenAPI JSON spec to a file
php artisan scramble:export --path=docs/openapi.json

# View all API routes
php artisan route:list --path=api
```

### Environment variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `API_VERSION` | Shown in the docs header | `1.0.0` |
| `JWT_SECRET` | Signs JWT tokens | (generated by `php artisan jwt:secret`) |
| `JWT_TTL` | Token lifetime in minutes | `60` |
| `APP_ENV` | Controls doc access (`RestrictedDocsAccess`) | `local` |

### Route middleware and security

| Middleware | Scramble treatment |
|-----------|-------------------|
| `auth:api` | Marked as Bearer required (🔒) |
| `auth` | Marked as Bearer required (🔒) |
| No auth middleware | Marked as public |
| `SuperAdminMiddleware` | Marked as Bearer required (🔒) |
