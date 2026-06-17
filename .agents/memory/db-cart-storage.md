---
name: DB cart storage (darryldecode/cart)
description: How the darryldecode/cart package is configured to use database storage instead of PHP session, and how it links to Orders.
---

## Rule
Use `\Cart::session(session()->getId())` before every cart operation so each PHP session gets its own rows in the `shopping_cart` table. Never use the default `\Cart::*` facade without setting the session key first — with DB storage the default key `'4yTlTDKu3oJOfzD'` would create a shared row for ALL users.

**Why:** The package's default session-driver scopes storage by PHP session automatically. The DB driver uses a flat key-value namespace, so the session key must be explicitly set to a unique value (the PHP session ID works perfectly).

**How to apply:** First line of any controller method that touches `\Cart::`:
```php
\Cart::session(session()->getId());
```

## base64 + serialize pattern
`cart_value` is stored as `base64_encode(serialize($value))` and read back with `unserialize(base64_decode($row->cart_value))`.

**Why:** PHP `serialize()` on CartCollection/CartConditionCollection produces binary data that gets corrupted when written to a PostgreSQL `text` column without encoding. Plain `serialize()` causes "unserialize(): Error at offset N of M bytes".

## Cart → Order link (cart_session_key)
`orders.cart_session_key` stores the PHP session ID at order creation time. Used for:
1. **Stale-order cancellation**: `store()` cancels pending orders where `user_id = $user->id AND cart_session_key = session()->getId()` — scoped to this exact cart, not a 5-minute time window.
2. **Webhook cart-clear**: `handleCartOrder()` deletes `shopping_cart` rows `WHERE cart_key LIKE '{cartSessionKey}%'` — works with no active PHP session.

## user_id column on shopping_cart
Written by `CheckoutController::store()` after JWT auth:
```php
DB::table('shopping_cart')
    ->where('cart_key', 'LIKE', $cartSessionKey . '%')
    ->whereNull('user_id')
    ->update(['user_id' => $user->id]);
```
Allows future admin/cleanup queries by user. Not needed for cart functionality.

## Files
- `app/Cart/DatabaseCartStorage.php` — storage driver (put/get/has/forget)
- `config/shopping_cart.php` — `storage` key points to the driver
- `database/migrations/2026_06_17_210000_create_shopping_cart_table.php`
- `database/migrations/2026_06_17_210001_add_cart_session_key_to_orders_table.php`
