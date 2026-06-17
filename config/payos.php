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
];
