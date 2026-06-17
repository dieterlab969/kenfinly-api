<?php

/**
 * darryldecode/cart configuration
 *
 * The `storage` key is the most important change from the package default.
 * Setting it to App\Cart\DatabaseCartStorage replaces the PHP session with
 * the `shopping_cart` MySQL/PostgreSQL table, giving us:
 *
 *  - Cart durability across PHP restarts and session expiry.
 *  - The ability to clear a user's cart from a server-side webhook that has
 *    no live PHP session (PayOS async callback).
 *  - A direct link between an Order and its source cart rows via the
 *    `orders.cart_session_key` column.
 *
 * Number formatting is intentionally off: all VND amounts are integers with
 * no decimal point, and comma separators are handled by the Blade views.
 */
return [
    'format_numbers' => env('SHOPPING_FORMAT_VALUES', false),
    'decimals'       => env('SHOPPING_DECIMALS', 0),
    'dec_point'      => env('SHOPPING_DEC_POINT', '.'),
    'thousands_sep'  => env('SHOPPING_THOUSANDS_SEP', ','),

    'storage' => \App\Cart\DatabaseCartStorage::class,

    'events'  => null,
];
