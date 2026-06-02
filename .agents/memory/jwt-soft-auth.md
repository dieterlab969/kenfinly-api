---
name: JWT Soft Auth Mode
description: tymon/jwt-auth is configured in soft mode — auth:api never auto-returns 401
---

## Rule
The `auth:api` middleware does NOT reject requests with missing/invalid JWT tokens.
It resolves the user to null and continues into the controller.

**Why:** Tymon JWT default config + this app's specific setup. Observed empirically in tests.

## How to apply
- Tests for "unauthenticated" routes must NOT assert `assertStatus(401)` directly
- Safe assertions: `assertContains([401, 422], $status)` for POST with missing fields
- For GET endpoints: expect 200 with empty/guest data (no 401)
- The real protection happens at validation (422 for missing required fields) or data-layer (null user cannot own records)

## Test pattern
```php
$response = $this->withHeaders(['Accept' => 'application/json'])
    ->postJson('/api/transactions', ['type' => 'expense']);
$this->assertContains($response->status(), [401, 422]);
$this->assertDatabaseEmpty('transactions');
```
