# WooCommerce Webhook Architecture — Change Plan

**Date:** 2026-06-21  
**Status:** ✅ Implemented  
**Scope:** Decouple checkout from Laravel monolith; Laravel becomes a pure webhook consumer.

---

## Problem Statement

The original codebase contained a local checkout flow inside Laravel:
- `shopping_cart` table (darryldecode/cart persistence)
- `orders` table with PayOS payment orders
- `payos_payment_orders` table
- `ExpireOldOrders` artisan command running every minute
- Various cart session routes

This created a fragile two-checkout-system situation when WooCommerce on the WordPress subdomain was adopted as the primary storefront.

---

## Architecture Decision

**WordPress + WooCommerce** owns 100% of the checkout experience:
- Product catalog, pricing, coupons
- Payment processing (PayPal, Google Pay, credit cards)
- Order confirmation emails to customers
- Cart and session management

**Laravel monolith** is a strict webhook consumer:
- Receives `POST /api/v1/woocommerce-callback` from WooCommerce after payment
- Validates signature, enforces idempotency, dispatches background job
- Activates the user's premium subscription asynchronously
- No cart, no payment form, no checkout page

---

## Changes Implemented

### 1. Legacy Cart Cleanup

| Item | Action |
|------|--------|
| `shopping_cart` table | Dropped via migration `2026_06_19_000001` |
| `payos_payment_orders` table | Dropped via migration `2026_06_19_000001` |
| `orders` table | Dropped via migration `2026_06_19_000001` |
| `orders:expire` scheduler | Disabled in `routes/console.php` (commented out with explanation) |
| `app/Console/Commands/ExpireOldOrders.php` | Retained as dead code — do not register in scheduler |

### 2. Webhook Infrastructure

#### Migration: `processed_payments`
```
id                 — bigint PK, auto-increment
external_order_id  — varchar, UNIQUE INDEX (idempotency key = WooCommerce order ID)
payment_method     — varchar (e.g. 'paypal', 'google_pay', 'stripe')
created_at / updated_at
```
Migration file: `database/migrations/2026_06_19_000002_create_processed_payments_table.php`

#### Middleware: `VerifyWooCommerceSignature`
File: `app/Http/Middleware/VerifyWooCommerceSignature.php`  
Alias: `wc.signature` (registered in `bootstrap/app.php`)

Verification algorithm:
1. Read raw request body via `$request->getContent()` — before framework parsing
2. Compute `base64_encode(hash_hmac('sha256', $rawBody, $secret, true))`
3. Compare with `X-WC-Webhook-Signature` header using `hash_equals()` (constant-time)
4. Reject with 401 on mismatch; 500 if secret is not configured

Secret source: `WOOCOMMERCE_WEBHOOK_SECRET` env var → `config/services.php` → `services.woocommerce.webhook_secret`

### 3. Webhook Controller

File: `app/Http/Controllers/Api/WooCommerceWebhookController.php`  
Route: `POST /api/v1/woocommerce-callback` (middleware: `wc.signature`, `throttle:60,1`)

**Request flow:**

```
WooCommerce POST
       │
       ▼
VerifyWooCommerceSignature (HMAC check) ──fail──▶ 401
       │ pass
       ▼
WooCommerceWebhookController::handle()
       │
       ├─ logIncomingRequest()   ← headers, body, IP, user-agent → woocommerce log
       │
       ├─ Validate: user_id, plan_type, woo_order_id present? ──no──▶ 422
       │
       ├─ processed_payments.exists(woo_order_id)? ──yes──▶ 200 already_processed
       │
       ├─ ProcessedPayment::create(...)   ← idempotency lock
       │
       ├─ ProcessPremiumActivation::dispatch(userId, planType, orderId)
       │         └─ catch Throwable → log error, return 500
       │
       └─ respond(['status' => 'queued'], 200) + log execution_ms
```

### 4. Background Job: `ProcessPremiumActivation`

File: `app/Jobs/ProcessPremiumActivation.php`  
`$tries = 3`, `$backoff = 30s`

Plan mapping:
| `plan_type` (WooCommerce) | `subscription_plan` | Expiry |
|---|---|---|
| `monthly_pro` | `monthly` | +30 days |
| `yearly_pro` | `yearly` | +365 days |
| _(unknown)_ | `monthly` (safe fallback) | +30 days |

Updates `users.subscription_status`, `subscription_plan`, `subscription_expires_at`.

### 5. Structured Logging

**Log channel:** `woocommerce`  
**Driver:** `daily` (rotates at midnight, retains 30 days)  
**File:** `storage/logs/woocommerce-webhook.log`  
**Config:** `config/logging.php` → `channels.woocommerce`

Every webhook request produces **three log entries**:

| Trigger | Level | Content |
|---------|-------|---------|
| Request arrives | `debug` | IP, method, path, user-agent, all headers (excl. auth/cookie), full JSON payload, truncated signature |
| Business outcome | `info` / `warning` | Order ID, user, plan, payment method, duplicate status |
| Response dispatched | `debug` | HTTP status code, execution time in ms |

Error conditions logged at `error` level with full stack trace:
- Missing `WOOCOMMERCE_WEBHOOK_SECRET` in environment
- HMAC signature mismatch
- Job dispatch failure (Throwable caught)
- User not found in `ProcessPremiumActivation`

### 6. Environment Variable

Added to `.env.example`:
```
WOOCOMMERCE_WEBHOOK_SECRET=your_woocommerce_webhook_secret_here
```

### 7. WordPress CMS Service Verification

`app/Services/WordPressService.php` — **intact, 948 lines**, no changes made.  
Handles: posts, pages, categories, custom post types, caching (5 min posts / 10 min pages / 1 hr categories).

---

## WooCommerce Setup (on the WordPress side)

1. **WooCommerce → Settings → Advanced → Webhooks → Add webhook**
2. Set **Delivery URL**: `https://app.kenfinly.com/api/v1/woocommerce-callback`
3. Set **Topic**: `Order — Payment complete`
4. Copy the **Secret** that WooCommerce generates
5. Set `WOOCOMMERCE_WEBHOOK_SECRET=<that secret>` in Laravel `.env`
6. Ensure each order's metadata includes: `user_id`, `plan_type`, `woo_order_id`

---

## What Was NOT Changed

- `app/Http/Controllers/Api/PaymentController.php` — retained for internal payment history UI
- `app/Http/Controllers/Api/PaymentGatewayController.php` — admin gateway management
- `app/Http/Controllers/Api/SubscriptionController.php` — internal subscription reads
- `app/Models/PayosPaymentOrder.php` — retained as dead model (table dropped); safe to delete later
- All frontend pages — no cart UI was ever built in React; WooCommerce owns the cart on its own subdomain

---

## Files Modified

| File | Change |
|------|--------|
| `database/migrations/2026_06_19_000001_drop_legacy_cart_checkout_tables.php` | New — drops shopping_cart, payos_payment_orders, orders |
| `database/migrations/2026_06_19_000002_create_processed_payments_table.php` | New — idempotency table |
| `app/Http/Middleware/VerifyWooCommerceSignature.php` | New |
| `app/Http/Controllers/Api/WooCommerceWebhookController.php` | New — full request logging added |
| `app/Jobs/ProcessPremiumActivation.php` | New |
| `app/Models/ProcessedPayment.php` | New |
| `config/logging.php` | Added `woocommerce` daily channel |
| `config/services.php` | Added `woocommerce.webhook_secret` key |
| `bootstrap/app.php` | Registered `wc.signature` middleware alias |
| `routes/api.php` | Registered `POST /api/v1/woocommerce-callback` |
| `routes/console.php` | Disabled `orders:expire` scheduler |
| `.env.example` | Added `WOOCOMMERCE_WEBHOOK_SECRET` |

---

## Testing the Webhook

```bash
# Generate a test signature
SECRET="your_secret_here"
BODY='{"user_id":1,"plan_type":"monthly_pro","woo_order_id":"WC-TEST-001","payment_method":"paypal"}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)

# Send the webhook
curl -X POST https://app.kenfinly.com/api/v1/woocommerce-callback \
  -H "Content-Type: application/json" \
  -H "X-WC-Webhook-Signature: $SIG" \
  -d "$BODY"

# Expected: {"status":"queued"}
# Tail the log: tail -f storage/logs/woocommerce-webhook.log
```
