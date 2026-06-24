---
name: Auth register auto-verify flow
description: Registration auto-verifies email in MVP mode — no two-step verification
---

## Rule
`AuthController::register()` immediately calls `$user->markEmailAsVerified()` and
sets `status = 'active'`. The response contains:
- `verification_sent: false`
- NO `verification_expires_at` field
- `user.status: 'active'`, `user.email_verified: true`
- An `access_token` is issued immediately

**Why:** Comment in code says "MVP sprint: auto-verify email" — intentional shortcut.

## How to apply
Tests that assert `status: 'pending'`, `verification_expires_at`, or `verification_sent: true`
are wrong and must be updated to match the auto-verify behavior.
The `test_newly_registered_user_can_create_transaction_after_email_verification` test
should skip the email token step and go straight to login.
