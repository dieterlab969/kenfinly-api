<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the currencies table with the full list of supported currencies.
 *
 * Active-by-default: USD (1) and VND (2) only.
 * All other currencies are seeded with is_active = false so they are
 * invisible to users but can be enabled instantly by flipping the flag —
 * no deployment required.
 *
 * This seeder is idempotent: it uses upsert so it is safe to run multiple
 * times without creating duplicates.
 */
class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $currencies = [
            // ── Actively supported ────────────────────────────────────────
            [
                'code'          => 'USD',
                'name'          => 'US Dollar',
                'symbol'        => '$',
                'is_active'     => true,
                'display_order' => 1,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'VND',
                'name'          => 'Vietnamese Dong',
                'symbol'        => '₫',
                'is_active'     => true,
                'display_order' => 2,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],

            // ── Available but hidden (is_active = false) ──────────────────
            [
                'code'          => 'EUR',
                'name'          => 'Euro',
                'symbol'        => '€',
                'is_active'     => false,
                'display_order' => 3,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'GBP',
                'name'          => 'British Pound',
                'symbol'        => '£',
                'is_active'     => false,
                'display_order' => 4,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'JPY',
                'name'          => 'Japanese Yen',
                'symbol'        => '¥',
                'is_active'     => false,
                'display_order' => 5,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'CAD',
                'name'          => 'Canadian Dollar',
                'symbol'        => 'C$',
                'is_active'     => false,
                'display_order' => 6,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'AUD',
                'name'          => 'Australian Dollar',
                'symbol'        => 'A$',
                'is_active'     => false,
                'display_order' => 7,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'NZD',
                'name'          => 'New Zealand Dollar',
                'symbol'        => 'NZ$',
                'is_active'     => false,
                'display_order' => 8,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'INR',
                'name'          => 'Indian Rupee',
                'symbol'        => '₹',
                'is_active'     => false,
                'display_order' => 9,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'RUB',
                'name'          => 'Russian Ruble',
                'symbol'        => '₽',
                'is_active'     => false,
                'display_order' => 10,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'BTC',
                'name'          => 'Bitcoin',
                'symbol'        => '₿',
                'is_active'     => false,
                'display_order' => 11,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
            [
                'code'          => 'ETH',
                'name'          => 'Ethereum',
                'symbol'        => 'Ξ',
                'is_active'     => false,
                'display_order' => 12,
                'created_at'    => $now,
                'updated_at'    => $now,
            ],
        ];

        DB::table('currencies')->upsert(
            $currencies,
            ['code'],                                      // unique key
            ['name', 'symbol', 'is_active', 'display_order', 'updated_at'] // updateable
        );
    }
}
