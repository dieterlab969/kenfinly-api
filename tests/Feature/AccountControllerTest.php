<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for AccountController (wallet CRUD API).
 *
 * Covers:
 *  - Authentication guards on every endpoint
 *  - Full CRUD lifecycle (store / show / update / destroy)
 *  - Input validation via StoreAccountRequest and UpdateAccountRequest
 *  - Ownership isolation (multi-tenant security)
 *  - Business-rule enforcement (balance immutability on update, delete guard)
 *  - API Resource shape (all expected fields present)
 *  - account_type field validation and persistence
 *  - Color hex format validation
 *  - Currency ISO-4217 length validation
 */
class AccountControllerTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Create a user with a verified email so they can authenticate
     * against the JWT guard right away.
     */
    private function makeUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'status'            => 'active',
        ], $overrides));
    }

    /**
     * Create a bare account (no auto-wallet seeding) for a user.
     */
    private function makeAccount(User $user, array $overrides = []): Account
    {
        return Account::create(array_merge([
            'user_id'  => $user->id,
            'name'     => 'Test Wallet',
            'balance'  => 500.00,
            'currency' => 'USD',
        ], $overrides));
    }

    // ── index ─────────────────────────────────────────────────────────────

    /** @test */
    public function unauthenticated_user_cannot_list_accounts(): void
    {
        $this->getJson('/api/accounts')
            ->assertUnauthorized();
    }

    /** @test */
    public function authenticated_user_can_list_their_accounts(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->getJson('/api/accounts')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'accounts',
            ])
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function index_returns_only_accounts_belonging_to_authenticated_user(): void
    {
        $user  = $this->makeUser();
        $other = $this->makeUser();

        // Delete any auto-created wallets so the counts are predictable
        Account::where('user_id', $user->id)->delete();
        Account::where('user_id', $other->id)->delete();

        $this->makeAccount($user,  ['name' => 'My Savings']);
        $this->makeAccount($user,  ['name' => 'My Checking']);
        $this->makeAccount($other, ['name' => 'Other User Wallet']);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/accounts')
            ->assertOk();

        $accounts = $response->json('accounts');
        $this->assertCount(2, $accounts);

        foreach ($accounts as $account) {
            $this->assertEquals($user->id, $account['user_id']);
        }
    }

    /** @test */
    public function index_returns_transaction_count_with_each_account(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/accounts')
            ->assertOk();

        $accountData = $response->json('accounts.0');
        $this->assertArrayHasKey('transactions_count', $accountData);
    }

    /** @test */
    public function index_response_includes_all_expected_fields_per_account(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $this->makeAccount($user, [
            'name'         => 'Field Check',
            'account_type' => 'savings',
            'icon'         => '🏦',
            'color'        => '#3b82f6',
        ]);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/accounts')
            ->assertOk();

        $account = $response->json('accounts.0');

        $requiredFields = [
            'id', 'user_id', 'name', 'balance', 'currency',
            'icon', 'color', 'account_type', 'transactions_count',
        ];

        foreach ($requiredFields as $field) {
            $this->assertArrayHasKey($field, $account, "Expected field '{$field}' missing from account response.");
        }

        $this->assertEquals('savings', $account['account_type']);
    }

    // ── store ─────────────────────────────────────────────────────────────

    /** @test */
    public function unauthenticated_user_cannot_create_an_account(): void
    {
        $this->postJson('/api/accounts', [
            'name'    => 'New Wallet',
            'balance' => 0,
        ])->assertUnauthorized();
    }

    /** @test */
    public function authenticated_user_can_create_an_account_with_valid_data(): void
    {
        $user = $this->makeUser();

        $payload = [
            'name'     => 'Holiday Fund',
            'balance'  => 1000.50,
            'currency' => 'USD',
            'icon'     => '🏖️',
            'color'    => '#f59e0b',
        ];

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', $payload)
            ->assertCreated()
            ->assertJsonStructure([
                'success',
                'message',
                'account' => ['id', 'name', 'balance', 'currency', 'user_id'],
            ])
            ->assertJson([
                'success' => true,
                'account' => [
                    'name'     => 'Holiday Fund',
                    'currency' => 'USD',
                ],
            ]);

        $this->assertDatabaseHas('accounts', [
            'user_id'  => $user->id,
            'name'     => 'Holiday Fund',
            'currency' => 'USD',
        ]);
    }

    /** @test */
    public function store_defaults_currency_to_usd_when_not_provided_and_locale_is_en(): void
    {
        $user = $this->makeUser();
        $this->app->setLocale('en');

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', ['name' => 'Quick Wallet', 'balance' => 0])
            ->assertCreated()
            ->assertJson(['account' => ['currency' => 'USD']]);
    }

    /** @test */
    public function store_defaults_currency_based_on_current_locale_vi_maps_to_vnd(): void
    {
        $user = $this->makeUser();
        $this->app->setLocale('vi');

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', ['name' => 'Ví của tôi', 'balance' => 0])
            ->assertCreated()
            ->assertJson(['account' => ['currency' => 'VND']]);

        $this->assertDatabaseHas('accounts', [
            'user_id'  => $user->id,
            'name'     => 'Ví của tôi',
            'currency' => 'VND',
        ]);
    }

    /** @test */
    public function store_falls_back_to_usd_when_locale_is_not_in_the_map(): void
    {
        $user = $this->makeUser();
        $this->app->setLocale('ja'); // Japanese — not in locale_currency_map

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', ['name' => 'Unknown Locale Wallet', 'balance' => 0])
            ->assertCreated()
            ->assertJson(['account' => ['currency' => 'USD']]);
    }

    /** @test */
    public function store_uses_explicitly_provided_currency_over_locale_default(): void
    {
        $user = $this->makeUser();
        $this->app->setLocale('en'); // locale says USD, but request overrides

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', [
                'name'     => 'Override Wallet',
                'balance'  => 0,
                'currency' => 'VND',
            ])
            ->assertCreated()
            ->assertJson(['account' => ['currency' => 'VND']]);
    }

    /** @test */
    public function store_rejects_missing_name(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', ['balance' => 100])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['name']]);
    }

    /** @test */
    public function store_rejects_missing_balance(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', ['name' => 'No Balance'])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['balance']]);
    }

    /** @test */
    public function store_rejects_non_numeric_balance(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', ['name' => 'Bad Balance', 'balance' => 'not-a-number'])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['balance']]);
    }

    /** @test */
    public function store_rejects_name_longer_than_255_characters(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', ['name' => str_repeat('a', 256), 'balance' => 0])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['name']]);
    }

    /** @test */
    public function store_rejects_currency_longer_than_3_characters(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', [
                'name'     => 'Test',
                'balance'  => 0,
                'currency' => 'TOOLONG',
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['currency']]);
    }

    /** @test */
    public function store_rejects_currency_shorter_than_3_characters(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', [
                'name'     => 'Test',
                'balance'  => 0,
                'currency' => 'US',   // ISO 4217 requires exactly 3 characters
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['currency']]);
    }

    /** @test */
    public function store_rejects_invalid_hex_color(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', [
                'name'    => 'Color Test',
                'balance' => 0,
                'color'   => 'not-a-color',   // must be #rrggbb or #rgb
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['color']]);
    }

    /** @test */
    public function store_accepts_valid_account_type(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', [
                'name'         => 'Investment Portfolio',
                'balance'      => 5000.00,
                'currency'     => 'USD',
                'account_type' => 'investment',
            ])
            ->assertCreated()
            ->assertJson([
                'success' => true,
                'account' => ['account_type' => 'investment'],
            ]);

        $this->assertDatabaseHas('accounts', [
            'user_id'      => $user->id,
            'name'         => 'Investment Portfolio',
            'account_type' => 'investment',
        ]);
    }

    /** @test */
    public function store_rejects_invalid_account_type(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', [
                'name'         => 'Bad Type Wallet',
                'balance'      => 0,
                'account_type' => 'piggy_bank',   // not in the allowed enum
            ])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['account_type']]);
    }

    /** @test */
    public function store_defaults_account_type_to_wallet_when_omitted(): void
    {
        $user = $this->makeUser();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/accounts', ['name' => 'Simple Wallet', 'balance' => 0])
            ->assertCreated();

        $this->assertEquals('wallet', $response->json('account.account_type'));
    }

    // ── show ──────────────────────────────────────────────────────────────

    /** @test */
    public function unauthenticated_user_cannot_view_an_account(): void
    {
        $user    = $this->makeUser();
        $account = $this->makeAccount($user);

        $this->getJson("/api/accounts/{$account->id}")
            ->assertUnauthorized();
    }

    /** @test */
    public function authenticated_user_can_view_their_own_account(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['name' => 'Visible Account']);

        $this->actingAs($user, 'api')
            ->getJson("/api/accounts/{$account->id}")
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'account' => ['id', 'name', 'balance', 'currency', 'transactions_count'],
            ])
            ->assertJson([
                'success'  => true,
                'account'  => ['id' => $account->id, 'name' => 'Visible Account'],
            ]);
    }

    /** @test */
    public function user_cannot_view_another_users_account(): void
    {
        $user    = $this->makeUser();
        $other   = $this->makeUser();
        $account = $this->makeAccount($other);

        $this->actingAs($user, 'api')
            ->getJson("/api/accounts/{$account->id}")
            ->assertNotFound();
    }

    /** @test */
    public function show_returns_404_for_nonexistent_account(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->getJson('/api/accounts/999999')
            ->assertNotFound();
    }

    // ── update ────────────────────────────────────────────────────────────

    /** @test */
    public function unauthenticated_user_cannot_update_an_account(): void
    {
        $user    = $this->makeUser();
        $account = $this->makeAccount($user);

        $this->putJson("/api/accounts/{$account->id}", ['name' => 'Hacked'])
            ->assertUnauthorized();
    }

    /** @test */
    public function authenticated_user_can_update_their_own_account(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['name' => 'Old Name', 'currency' => 'USD']);

        $this->actingAs($user, 'api')
            ->putJson("/api/accounts/{$account->id}", [
                'name'     => 'New Name',
                'currency' => 'VND',
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'account' => ['name' => 'New Name', 'currency' => 'VND'],
            ]);

        $this->assertDatabaseHas('accounts', [
            'id'       => $account->id,
            'name'     => 'New Name',
            'currency' => 'VND',
        ]);
    }

    /** @test */
    public function update_supports_partial_updates_without_overwriting_untouched_fields(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, [
            'name'     => 'Stays The Same',
            'balance'  => 250.00,
            'currency' => 'VND',
        ]);

        $this->actingAs($user, 'api')
            ->putJson("/api/accounts/{$account->id}", ['color' => '#ff0000'])
            ->assertOk();

        $this->assertDatabaseHas('accounts', [
            'id'      => $account->id,
            'name'    => 'Stays The Same',
            'color'   => '#ff0000',
            'balance' => '250.00',
        ]);
    }

    /**
     * CRITICAL — balance immutability on update.
     *
     * Sending `balance` in a PUT request must not mutate the stored balance.
     * This is enforced at two layers:
     *   1. UpdateAccountRequest — no `balance` validation rule
     *   2. Controller  — only whitelisted keys reach Account::update()
     *
     * @test
     */
    public function update_ignores_balance_field_even_when_explicitly_sent(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, [
            'name'    => 'Protected Wallet',
            'balance' => 1000.00,
        ]);

        $this->actingAs($user, 'api')
            ->putJson("/api/accounts/{$account->id}", [
                'name'    => 'Protected Wallet Renamed',
                'balance' => 99999.00,   // attacker tries to inflate balance
            ])
            ->assertOk()
            ->assertJson(['success' => true]);

        // Balance must remain at original value — the write was silently ignored
        $this->assertDatabaseHas('accounts', [
            'id'      => $account->id,
            'name'    => 'Protected Wallet Renamed',
            'balance' => '1000.00',
        ]);

        $this->assertDatabaseMissing('accounts', [
            'id'      => $account->id,
            'balance' => '99999.00',
        ]);
    }

    /** @test */
    public function update_rejects_empty_name_when_name_is_provided(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->actingAs($user, 'api')
            ->putJson("/api/accounts/{$account->id}", ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['name']]);
    }

    /** @test */
    public function update_rejects_invalid_hex_color(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->actingAs($user, 'api')
            ->putJson("/api/accounts/{$account->id}", ['color' => 'red'])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['color']]);
    }

    /** @test */
    public function update_rejects_invalid_account_type(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->actingAs($user, 'api')
            ->putJson("/api/accounts/{$account->id}", ['account_type' => 'unknown'])
            ->assertUnprocessable()
            ->assertJsonStructure(['errors' => ['account_type']]);
    }

    /** @test */
    public function update_can_change_account_type(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['account_type' => 'wallet']);

        $this->actingAs($user, 'api')
            ->putJson("/api/accounts/{$account->id}", ['account_type' => 'savings'])
            ->assertOk()
            ->assertJson(['account' => ['account_type' => 'savings']]);

        $this->assertDatabaseHas('accounts', [
            'id'           => $account->id,
            'account_type' => 'savings',
        ]);
    }

    /** @test */
    public function user_cannot_update_another_users_account(): void
    {
        $user    = $this->makeUser();
        $other   = $this->makeUser();
        $account = $this->makeAccount($other);

        $this->actingAs($user, 'api')
            ->putJson("/api/accounts/{$account->id}", ['name' => 'Hijacked'])
            ->assertNotFound();
    }

    // ── destroy ───────────────────────────────────────────────────────────

    /** @test */
    public function unauthenticated_user_cannot_delete_an_account(): void
    {
        $user    = $this->makeUser();
        $account = $this->makeAccount($user);

        $this->deleteJson("/api/accounts/{$account->id}")
            ->assertUnauthorized();
    }

    /** @test */
    public function authenticated_user_can_delete_an_empty_account(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->actingAs($user, 'api')
            ->deleteJson("/api/accounts/{$account->id}")
            ->assertOk()
            ->assertJson(['success' => true, 'message' => 'Account deleted successfully']);

        $this->assertDatabaseMissing('accounts', ['id' => $account->id]);
    }

    /** @test */
    public function cannot_delete_an_account_that_has_transactions(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);

        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $user->assignRole('owner');

        $account  = $this->makeAccount($user);
        $category = Category::where('type', 'expense')->first();

        Transaction::create([
            'user_id'          => $user->id,
            'account_id'       => $account->id,
            'category_id'      => $category->id,
            'type'             => 'expense',
            'amount'           => 50.00,
            'transaction_date' => now()->format('Y-m-d'),
        ]);

        $this->actingAs($user, 'api')
            ->deleteJson("/api/accounts/{$account->id}")
            ->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Cannot delete account with existing transactions',
            ]);

        $this->assertDatabaseHas('accounts', ['id' => $account->id]);
    }

    /** @test */
    public function user_cannot_delete_another_users_account(): void
    {
        $user    = $this->makeUser();
        $other   = $this->makeUser();
        $account = $this->makeAccount($other);

        $this->actingAs($user, 'api')
            ->deleteJson("/api/accounts/{$account->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('accounts', ['id' => $account->id]);
    }

    /** @test */
    public function destroy_returns_404_for_nonexistent_account(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->deleteJson('/api/accounts/999999')
            ->assertNotFound();
    }
}
