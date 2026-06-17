<?php

/**
 * PayPal Payment Gateway Configuration (srmklive/paypal v3)
 *
 * Required environment variables:
 *   PAYPAL_MODE                  — sandbox | live
 *   PAYPAL_SANDBOX_CLIENT_ID     — Client ID from PayPal developer dashboard (sandbox)
 *   PAYPAL_SANDBOX_CLIENT_SECRET — Secret from PayPal developer dashboard (sandbox)
 *   PAYPAL_LIVE_CLIENT_ID        — Client ID (production)
 *   PAYPAL_LIVE_CLIENT_SECRET    — Secret (production)
 *   PAYPAL_MONTHLY_USD           — Monthly plan price in USD (default 3.49)
 *   PAYPAL_YEARLY_USD            — Yearly plan price in USD  (default 6.99)
 */

return [

    'mode' => env('PAYPAL_MODE', 'sandbox'),

    'sandbox' => [
        'client_id'     => env('PAYPAL_SANDBOX_CLIENT_ID', ''),
        'client_secret' => env('PAYPAL_SANDBOX_CLIENT_SECRET', ''),
        'app_id'        => '',
    ],

    'live' => [
        'client_id'     => env('PAYPAL_LIVE_CLIENT_ID', ''),
        'client_secret' => env('PAYPAL_LIVE_CLIENT_SECRET', ''),
        'app_id'        => '',
    ],

    'payment_action' => env('PAYPAL_PAYMENT_ACTION', 'capture'),
    'currency'       => env('PAYPAL_CURRENCY', 'USD'),
    'notify_url'     => env('PAYPAL_NOTIFY_URL', ''),
    'locale'         => env('PAYPAL_LOCALE', 'en_US'),
    'validate_ssl'   => env('PAYPAL_VALIDATE_SSL', true),

    /*
    |--------------------------------------------------------------------------
    | Plan Amounts (USD)
    |--------------------------------------------------------------------------
    | These are the USD equivalents of the VND plan prices shown to
    | international customers who pay via PayPal.
    */
    'plans' => [
        'monthly' => [
            'amount_usd'  => (float) env('PAYPAL_MONTHLY_USD', 3.49),
            'description' => env('PAYPAL_MONTHLY_DESC', 'KenFinly Monthly Pro'),
        ],
        'yearly' => [
            'amount_usd'  => (float) env('PAYPAL_YEARLY_USD', 6.99),
            'description' => env('PAYPAL_YEARLY_DESC', 'KenFinly Yearly Pro'),
        ],
    ],

];
