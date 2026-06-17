<?php

namespace App\Cart;

use Illuminate\Support\Facades\DB;

/**
 * Database-backed storage driver for the darryldecode/cart package.
 *
 * Replaces the default PHP session storage with the `shopping_cart` table,
 * giving carts durability across PHP restarts and enabling server-side
 * queries (e.g. clearing a cart from a PayOS webhook that has no PHP session).
 *
 * The package passes composite keys of the form:
 *   "{sessionKey}_cart_items"       — serialised CartCollection
 *   "{sessionKey}_cart_conditions"  — serialised CartConditionCollection
 *
 * where `sessionKey` is set via \Cart::session($key) before any operation.
 * In this application that key is always the PHP session ID
 * (session()->getId()), which uniquely scopes the cart to the current user's
 * browser session.
 *
 * Interface contract expected by Darryldecode\Cart\Cart:
 *   put($key, $value)
 *   get($key, $default = null)
 *   has($key)
 *   forget($key)   — not called by the package core but implemented for
 *                    completeness and direct-cleanup use cases.
 */
class DatabaseCartStorage
{
    /**
     * Store a serialised value under the given key.
     * Uses an upsert pattern to avoid duplicate-key errors on retries.
     */
    public function put(string $key, mixed $value): void
    {
        $now = now();

        // base64_encode ensures the serialised PHP binary is safe to store
        // in a PostgreSQL / MySQL text column without encoding corruption.
        $encoded = base64_encode(serialize($value));

        $exists = DB::table('shopping_cart')
                    ->where('cart_key', $key)
                    ->exists();

        if ($exists) {
            DB::table('shopping_cart')
                ->where('cart_key', $key)
                ->update([
                    'cart_value' => $encoded,
                    'updated_at' => $now,
                ]);
        } else {
            DB::table('shopping_cart')->insert([
                'cart_key'   => $key,
                'cart_value' => $encoded,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * Retrieve and deserialise a stored value.
     *
     * @param  mixed  $default  Returned when the key does not exist.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $row = DB::table('shopping_cart')
                  ->where('cart_key', $key)
                  ->first();

        if (! $row) {
            return $default;
        }

        return unserialize(base64_decode($row->cart_value));
    }

    /**
     * Check whether a key exists in the DB cart storage.
     */
    public function has(string $key): bool
    {
        return DB::table('shopping_cart')
                  ->where('cart_key', $key)
                  ->exists();
    }

    /**
     * Delete a key from the DB cart storage.
     *
     * Not invoked by the package internals, but used directly when clearing
     * a cart from a context that has no live PHP session (e.g. a webhook).
     */
    public function forget(string $key): void
    {
        DB::table('shopping_cart')->where('cart_key', $key)->delete();
    }
}
