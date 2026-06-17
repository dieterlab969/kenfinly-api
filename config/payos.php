<?php

/**
 * PayOS Payment Gateway Configuration
 *
 * This file configures the PayOS Vietnamese payment gateway used for
 * subscription plan purchases. All sensitive credentials are read from
 * environment variables and must never be hard-coded here.
 *
 * Required environment variables:
 *   PAYOS_CLIENT_ID      — Merchant client ID from the PayOS dashboard
 *   PAYOS_API_KEY        — API key for request signing
 *   PAYOS_CHECKSUM_KEY   — HMAC checksum key for webhook verification
 *
 * Optional overrides:
 *   PAYOS_MONTHLY_AMOUNT — Monthly plan price in VND (default: 50 000)
 *   PAYOS_YEARLY_AMOUNT  — Yearly plan price in VND  (default: 169 000)
 *   PAYOS_MONTHLY_DESC   — Short description sent to PayOS (max ~25 chars)
 *   PAYOS_YEARLY_DESC    — Short description sent to PayOS (max ~25 chars)
 *   PAYOS_RETURN_URL     — URL PayOS redirects the buyer to after payment
 *   PAYOS_CANCEL_URL     — URL PayOS redirects the buyer to on cancellation
 */

return [

    /*
    |--------------------------------------------------------------------------
    | PayOS API Credentials
    |--------------------------------------------------------------------------
    | Obtained from the PayOS merchant portal (https://my.payos.vn).
    | The checksum key is used by the PHP SDK to verify incoming webhooks.
    */
    'client_id'    => env('PAYOS_CLIENT_ID', ''),
    'api_key'      => env('PAYOS_API_KEY', ''),
    'checksum_key' => env('PAYOS_CHECKSUM_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Subscription Plans
    |--------------------------------------------------------------------------
    | Each entry maps to a billable plan. `amount` is in VND (integer, no
    | decimals). `description` is displayed on the PayOS payment page and
    | bank statement — keep it short (≤ 25 characters).
    */
    'plans' => [
        'monthly' => [
            // HOW IS THE CURRENCY DETERMINED?
            // PayOS is a Vietnamese payment gateway and natively processes ONLY
            // Vietnamese Đồng (VND). The `amount` field MUST be an integer
            // in VND — no decimals, no other currencies. PayOS rejects
            // fractional amounts and non-VND currencies outright.
            //
            // For international customers (USD), see config/paypal.php which
            // holds the equivalent USD prices processed via PayPal instead.
            //
            // The `currency` key here is intentionally explicit so that any code
            // reading plan config always has the currency alongside the amount,
            // removing any ambiguity.
            'currency'    => 'VND',
            'amount'      => (int) env('PAYOS_MONTHLY_AMOUNT', 50000),
            'description' => env('PAYOS_MONTHLY_DESC', 'KenFinly Monthly'),
            'label'       => 'Monthly Pro',
        ],
        'yearly' => [
            // See monthly comment above — same rules apply.
            'currency'    => 'VND',
            'amount'      => (int) env('PAYOS_YEARLY_AMOUNT', 169000),
            'description' => env('PAYOS_YEARLY_DESC', 'KenFinly Yearly'),
            'label'       => 'Yearly Pro',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Redirect URLs
    |--------------------------------------------------------------------------
    | PayOS redirects the buyer's browser to these URLs after the payment
    | attempt. Both must be absolute, publicly reachable HTTPS URLs in
    | production. APP_URL is used as the base when not explicitly set.
    */
    'return_url' => env('PAYOS_RETURN_URL', env('APP_URL') . '/pricing?payment=success'),
    'cancel_url' => env('PAYOS_CANCEL_URL', env('APP_URL') . '/pricing?payment=cancelled'),

    /*
    |--------------------------------------------------------------------------
    | Coupon Codes
    |--------------------------------------------------------------------------
    | Promotional discount codes applied as CartConditions in CartController.
    |
    | Each entry:
    |   'CODE' => [
    |       'type'  => 'percent' | 'fixed'   (fixed = VND amount deducted)
    |       'value' => integer               (percentage points or VND)
    |       'label' => string                (human-readable, shown in cart UI)
    |   ]
    |
    | Add new codes here; remove or comment out expired ones.
    */
    'coupons' => [
        'KENFINLY10' => ['type' => 'percent', 'value' => 10,    'label' => 'Giảm 10%'],
        'KENFINLY20' => ['type' => 'percent', 'value' => 20,    'label' => 'Giảm 20%'],
        'WELCOME'    => ['type' => 'fixed',   'value' => 50000, 'label' => 'Giảm 50.000₫'],
    ],

];
