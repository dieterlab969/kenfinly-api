<?php

return [
    'client_id'    => env('PAYOS_CLIENT_ID', ''),
    'api_key'      => env('PAYOS_API_KEY', ''),
    'checksum_key' => env('PAYOS_CHECKSUM_KEY', ''),

    'plans' => [
        'monthly' => [
            'amount'      => (int) env('PAYOS_MONTHLY_AMOUNT', 79000),
            'description' => env('PAYOS_MONTHLY_DESC', 'KenFinly Monthly'),
            'label'       => 'Monthly Pro',
        ],
        'yearly' => [
            'amount'      => (int) env('PAYOS_YEARLY_AMOUNT', 169000),
            'description' => env('PAYOS_YEARLY_DESC', 'KenFinly Yearly'),
            'label'       => 'Yearly Pro',
        ],
    ],

    'return_url' => env('PAYOS_RETURN_URL', env('APP_URL') . '/pricing?payment=success'),
    'cancel_url' => env('PAYOS_CANCEL_URL', env('APP_URL') . '/pricing?payment=cancelled'),

    /*
    |--------------------------------------------------------------------------
    | Coupon Codes
    |--------------------------------------------------------------------------
    | Add promotion codes here. 'type' is 'percent' or 'fixed' (VND amount).
    | 'value' is the discount amount (integer).
    */
    'coupons' => [
        'KENFINLY10' => ['type' => 'percent', 'value' => 10,    'label' => 'Giảm 10%'],
        'KENFINLY20' => ['type' => 'percent', 'value' => 20,    'label' => 'Giảm 20%'],
        'WELCOME'    => ['type' => 'fixed',   'value' => 50000, 'label' => 'Giảm 50.000₫'],
    ],
];
