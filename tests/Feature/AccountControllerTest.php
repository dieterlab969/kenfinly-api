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
 * Covers authentication guards, full CRUD lifecycle, input validation,
 * ownership isolation, and business-rule enforcement (e.g. cannot delete
 * an account that still has transactions).
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
    public function store_defaults_currency_to_usd_when_not_provided(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/accounts', ['name' => 'Quick Wallet', 'balance' => 0])
            ->assertCreated()
            ->assertJson(['account' => ['currency' => 'USD']]);
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
