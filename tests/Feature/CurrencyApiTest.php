<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Feature tests for the dynamic currencies API.
 *
 * Covers GET /api/currencies — the public endpoint that returns all active
 * currencies ordered by display_order.
 *
 * @package Tests\Feature
 */
class CurrencyApiTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Seed a controlled set of currencies for deterministic assertions.
     */
    private function seedCurrencies(): void
    {
        Currency::insert([
            ['code' => 'USD', 'name' => 'US Dollar',        'symbol' => '$',  'is_active' => true,  'display_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'VND', 'name' => 'Vietnamese Dong',  'symbol' => '₫',  'is_active' => true,  'display_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'EUR', 'name' => 'Euro',             'symbol' => '€',  'is_active' => false, 'display_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'GBP', 'name' => 'British Pound',    'symbol' => '£',  'is_active' => false, 'display_order' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    // -------------------------------------------------------------------------
    // GET /api/currencies
    // -------------------------------------------------------------------------

    /**
     * The endpoint is public — no authentication token should be required.
     */
    public function test_currencies_endpoint_is_publicly_accessible(): void
    {
        $this->seedCurrencies();

        $this->getJson('/api/currencies')
             ->assertStatus(200);
    }

    /**
     * Only currencies with is_active = true are returned.
     */
    public function test_returns_only_active_currencies(): void
    {
        $this->seedCurrencies();

        $response = $this->getJson('/api/currencies');

        $response->assertStatus(200)
                 ->assertJsonCount(2, 'currencies');

        $codes = collect($response->json('currencies'))->pluck('code')->all();
        $this->assertContains('USD', $codes);
        $this->assertContains('VND', $codes);
        $this->assertNotContains('EUR', $codes);
        $this->assertNotContains('GBP', $codes);
    }

    /**
     * Each currency object must expose code, name, and symbol fields.
     * is_active is intentionally omitted from the response (callers only ever
     * see active ones).
     */
    public function test_response_has_correct_structure(): void
    {
        $this->seedCurrencies();

        $this->getJson('/api/currencies')
             ->assertStatus(200)
             ->assertJsonStructure([
                 'success',
                 'currencies' => [
                     '*' => ['code', 'name', 'symbol', 'display_order'],
                 ],
             ])
             ->assertJson(['success' => true]);
    }

    /**
     * Results are sorted by display_order ascending so the UI renders them
     * in the intended order without client-side sorting.
     */
    public function test_currencies_are_ordered_by_display_order(): void
    {
        // Insert in reverse order to confirm DB ordering is applied.
        Currency::insert([
            ['code' => 'VND', 'name' => 'Vietnamese Dong', 'symbol' => '₫', 'is_active' => true, 'display_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'USD', 'name' => 'US Dollar',       'symbol' => '$', 'is_active' => true, 'display_order' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response  = $this->getJson('/api/currencies');
        $currencies = $response->json('currencies');

        $this->assertEquals('USD', $currencies[0]['code']);
        $this->assertEquals('VND', $currencies[1]['code']);
    }

    /**
     * When no currencies are active, the API returns an empty array — not an error.
     */
    public function test_returns_empty_array_when_no_active_currencies(): void
    {
        Currency::insert([
            ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'is_active' => false, 'display_order' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->getJson('/api/currencies')
             ->assertStatus(200)
             ->assertJson(['success' => true, 'currencies' => []]);
    }

    /**
     * Toggling a currency to active makes it appear in the next response
     * without any code change — validates the dynamic admin-controlled approach.
     */
    public function test_activating_a_currency_makes_it_appear_in_response(): void
    {
        $this->seedCurrencies();

        // EUR starts inactive — not in response
        $before = $this->getJson('/api/currencies')->json('currencies');
        $this->assertNotContains('EUR', collect($before)->pluck('code')->all());

        // Flip EUR to active (simulates an admin DB change)
        Currency::where('code', 'EUR')->update(['is_active' => true]);

        // Now EUR appears without any frontend code change
        $after = $this->getJson('/api/currencies')->json('currencies');
        $this->assertContains('EUR', collect($after)->pluck('code')->all());
    }
}
