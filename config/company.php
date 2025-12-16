<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Company Name
    |--------------------------------------------------------------------------
    |
    | This value represents the official name of your company as it should
    | appear on invoices, the website, and other official communications.
    | Set this in your .env file to override the default value.
    |
    */
    'name' => env('COMPANY_NAME', ''),
    /*
    |--------------------------------------------------------------------------
    | Company Tax Code
    |--------------------------------------------------------------------------
    |
    | The tax identification number or business registration code used for
    | financial and legal documents. This is crucial for invoice generation
    | and tax reporting purposes.
    |
    */
    'tax_code' => env('COMPANY_TAX_CODE', ''),
    /*
   |--------------------------------------------------------------------------
   | Company Email Address
   |--------------------------------------------------------------------------
   |
   | The primary contact email for your company. This email is used for
   | system-generated communications, receipts, and as a default contact
   | point for customer inquiries.
   |
   */
    'email' => env('COMPANY_EMAIL', ''),
    /*
    |--------------------------------------------------------------------------
    | Company Phone Number
    |--------------------------------------------------------------------------
    |
    | The main contact phone number for your business. Include the country
    | code for international accessibility. This appears on your website,
    | invoices, and other official communications.
    |
    */
    'phone' => env('COMPANY_PHONE', ''),
    /*
    |--------------------------------------------------------------------------
    | Company Physical Address
    |--------------------------------------------------------------------------
    |
    | The official registered address of your company. This information is
    | required for legal documents, invoices, and may be displayed on your
    | website's contact page. Format it clearly with proper punctuation.
    |
    */
    'address' => env('COMPANY_ADDRESS', ''),
];
