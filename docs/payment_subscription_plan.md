# Subscription & PayOS Hosted Checkout — Implementation Guide

**Last Updated:** 2026-06-17  
**Status:** Implemented

---

## 1. Overview

Kenfinly uses **PayOS** (VietQR-powered) for subscription payments. The system supports three tiers:

| Plan | Price | Billing | User `subscription_plan` |
|------|-------|---------|--------------------------|
| Forever Free | ₫0 | One-time (never expires) | `free` |
| Monthly Pro | ₫79,000 | Monthly | `monthly` |
| Yearly Pro | ₫169,000 | Yearly | `yearly` |

Prices are configurable via `.env` (`PAYOS_MONTHLY_AMOUNT`, `PAYOS_YEARLY_AMOUNT`).

---

## 2. Trial & Subscription Status Logic

### User `subscription_status` field (enum on `users` table)

| Status | Meaning |
|--------|---------|
| `trial` | New user within 7-day free trial window |
| `active` | Paid subscription currently valid |
| `expired` | Paid subscription lapsed OR trial ended without upgrade |
| `revoked` | Manually revoked by Super Admin |

### Trial Mechanism
Every new user registration automatically receives:
- `subscription_status = 'trial'`
- `subscription_plan = 'free'`
- `trial_ends_at = now() + 7 days`

This is handled in `app/Observers/UserObserver.php` inside the `created()` event.

### Subscription Activation (on successful PayOS payment)
`PayOSPaymentController::activateSubscription()` sets:
- `subscription_status = 'active'`
- `subscription_plan = 'monthly'|'yearly'`
- `subscription_expires_at = now() + 1 month | 1 year`

---

## 3. Database Schema

### `users` table additions
```sql
subscription_status   ENUM('trial','active','revoked','expired') DEFAULT 'trial'
subscription_plan     ENUM('free','monthly','yearly')            DEFAULT 'free'
trial_ends_at         TIMESTAMP NULL
subscription_expires_at TIMESTAMP NULL
```
Migration: `2026_06_17_000001_add_subscription_fields_to_users_table.php`

### `payos_payment_orders` table
Tracks every PayOS checkout attempt and maps order codes back to users/plans.

```sql
id            BIGINT PK
user_id       FK → users.id
order_code    BIGINT UNIQUE   -- PayOS order code (random int)
plan          ENUM('monthly','yearly')
amount        INTEGER         -- VND amount
status        ENUM('pending','completed','failed','cancelled')
payos_response JSON NULL      -- Raw verified webhook payload
created_at, updated_at
```
Migration: `2026_06_17_000002_create_payos_payment_orders_table.php`

### `subscription_plans` table (existing, seeded)
Three rows seeded by `SubscriptionPlanSeeder`:
- Free (sort_order=1, billing_cycle=forever)
- Monthly Pro (sort_order=2, billing_cycle=monthly)
- Yearly Pro (sort_order=3, billing_cycle=yearly)

---

## 4. Payment Flow

```
User visits /pricing
       │
       ▼ clicks "Buy Now"
JavaScript fetches POST /api/payment/payos/create
  (Bearer JWT required)
       │
       ▼
PayOSPaymentController::createPaymentLink()
  • Reads plan config from config/payos.php
  • Generates unique orderCode (time + rand)
  • Calls PayOS SDK: $payOS->createPaymentLink([...])
  • Saves pending row to payos_payment_orders
  • Returns { checkout_url, order_code }
       │
       ▼
Browser redirects → PayOS VietQR checkout page
       │
  User pays (QR scan)
       │
       ├── returnUrl → /pricing?payment=success
       └── cancelUrl → /pricing?payment=cancelled
       │
       ▼ (async, seconds after payment)
PayOS POSTs to POST /api/payment/payos-webhook
PayOSPaymentController::webhook()
  • Calls $payOS->verifyPaymentWebhookData($payload)
  • On code==='00': activateSubscription(user, plan)
  • Updates payos_payment_orders.status
```

---

## 5. Key Files

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Api/PayOSPaymentController.php` | Creates payment links + handles webhooks |
| `app/Models/PayosPaymentOrder.php` | Eloquent model for order tracking |
| `app/Http/Middleware/CheckSubscription.php` | 402 guard for expired/revoked users |
| `app/Observers/UserObserver.php` | Sets trial on new user creation |
| `config/payos.php` | SDK credentials + plan amounts |
| `resources/views/pricing.blade.php` | Standalone pricing page (Blade, not SPA) |
| `database/seeders/SubscriptionPlanSeeder.php` | Seeds 3 plan rows |

---

## 6. Routes

### Web
```
GET /pricing   → resources/views/pricing.blade.php
```

### API
```
POST /api/payment/payos/create     auth:api + throttle:10,1
     Body:    { "plan": "monthly"|"yearly" }
     Returns: { "checkout_url": "...", "order_code": 123 }

POST /api/payment/payos-webhook    public (no auth — signature verified)
     Body:    PayOS signed webhook payload
     Returns: { "message": "Webhook processed" }
```

---

## 7. CheckSubscription Middleware

Registered as `check.subscription` in `bootstrap/app.php`.

**Logic:**
1. Super Admin → always allowed through.
2. `subscription_status = 'active'` + `subscription_expires_at` in the future → allowed.
3. `subscription_status = 'trial'` + `trial_ends_at` in the future → allowed.
4. Everything else → `402 Payment Required` with `{ code: "SUBSCRIPTION_REQUIRED", redirect: "/pricing" }`.

**Apply to protected API route groups:**
```php
Route::middleware(['auth:api', 'check.subscription'])->group(function () {
    // Advanced analytics, reports, exports, etc.
});
```

---

## 8. Environment Configuration

Add to `.env` (see `.env.example` for full template):

```env
# PayOS credentials (get from https://payos.vn/developer)
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# Plan prices in VND (integers)
PAYOS_MONTHLY_AMOUNT=79000
PAYOS_YEARLY_AMOUNT=169000
```

**Webhook URL for PayOS Dashboard:**
```
https://your-domain.com/api/payment/payos-webhook
```

---

## 9. PayOS SDK

**Package:** `payos/payos` v2.x  
**Installed via:** `composer require payos/payos`

```php
use PayOS\PayOS;

$payOS = new PayOS(
    config('payos.client_id'),
    config('payos.api_key'),
    config('payos.checksum_key')
);

// Create payment link
$response = $payOS->createPaymentLink([
    'orderCode'   => 1234567890,
    'amount'      => 79000,
    'description' => 'KenFinly Monthly Pro',
    'returnUrl'   => 'https://app.kenfinly.com/pricing?payment=success',
    'cancelUrl'   => 'https://app.kenfinly.com/pricing?payment=cancelled',
    'buyerName'   => 'Nguyen Van A',
    'buyerEmail'  => 'user@example.com',
]);

$checkoutUrl = $response->checkoutUrl;

// Verify webhook
$verified = $payOS->verifyPaymentWebhookData($request->all());
// $verified->code === '00' means paid
```

---

## 10. Webhook Security

- Signature verified by `$payOS->verifyPaymentWebhookData()` using `PAYOS_CHECKSUM_KEY`.
- If verification throws, respond `400` and log the attempt.
- Idempotent: orders already processed (`status !== 'pending'`) return `200` without re-applying.
- The webhook endpoint is already excluded from CSRF by being an API route (`routes/api.php`).

---

## 11. Sandbox Testing

1. Register at [https://payos.vn/developer](https://payos.vn/developer) for sandbox credentials.
2. Set `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` in `.env`.
3. Expose local webhook with `ngrok http 5000` and set the URL in PayOS sandbox dashboard.
4. Test scenarios:
   - ✅ Successful payment → user `subscription_status` becomes `active`
   - ❌ Cancelled → `payos_payment_orders.status = 'cancelled'`
   - 🔐 Invalid signature → `400` response, logged, no DB changes
   - 🔄 Duplicate webhook → idempotently returns `200`

---

## 12. Pricing Page

`GET /pricing` serves `resources/views/pricing.blade.php` — a **standalone Blade view** bypassing the React SPA.

- Dark/Indigo design matching Kenfinly's aesthetic
- Reads plan prices live from `config('payos.plans.*')`
- "Buy Now" buttons call `/api/payment/payos/create` via `fetch()` using the JWT token from `localStorage`
- Redirects unauthenticated users to `/login?redirect=pricing&plan=monthly`
- Flash messages on return: `?payment=success` or `?payment=cancelled`
- Savings percentage calculated dynamically from configured prices

---

## 13. Legacy Code Notes

The existing `PaymentController`, `SubscriptionController`, `PaymentGatewayController`, and related models remain in place for the legacy payment gateway system. The new PayOS flow is additive — both systems coexist:

- **Legacy:** Admin-managed gateways, subscriptions, and licenses (Admin panel)
- **New:** User-facing PayOS hosted checkout + self-service plan selection (`/pricing`)
