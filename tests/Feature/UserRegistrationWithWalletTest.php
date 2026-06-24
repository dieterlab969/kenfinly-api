<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class UserRegistrationWithWalletTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that wallet is created when user registers via API.
     *
     * The register endpoint auto-verifies the email for MVP convenience, so the
     * user is immediately active. No verification_expires_at field is returned.
     */
    public function test_wallet_is_created_when_user_registers_via_api(): void
    {
        Http::fake();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'New User',
            'email'                 => 'newuser@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'status',
                    'email_verified',
                ],
                'verification_sent',
            ])
            ->assertJson([
                'success' => true,
                'user'    => [
                    'email'          => 'newuser@example.com',
                    'status'         => 'active',
                    'email_verified' => true,
                ],
                'verification_sent' => false,
            ]);

        $user = User::where('email', 'newuser@example.com')->first();
        $this->assertNotNull($user);

        // Auto-registration creates a default wallet for the new user.
        $this->assertEquals(1, $user->accounts()->count());

        $wallet = $user->accounts()->first();
        $this->assertEquals('My Wallet', $wallet->name);
        $this->assertEquals('0.00', $wallet->balance);
    }

    /**
     * Test that user with wallet can create transactions.
     */
    public function test_user_with_wallet_can_create_transaction(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);

        $user = User::factory()->create();
        $user->assignRole('owner');

        $this->assertGreaterThan(0, $user->accounts()->count());

        $wallet   = $user->accounts()->first();
        $category = Category::where('type', 'expense')->first();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/transactions', [
                'account_id'       => $wallet->id,
                'category_id'      => $category->id,
                'type'             => 'expense',
                'amount'           => 50.00,
                'notes'            => 'Test transaction',
                'transaction_date' => now()->format('Y-m-d'),
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'transaction',
            ]);

        $this->assertDatabaseHas('transactions', [
            'user_id'    => $user->id,
            'account_id' => $wallet->id,
            'amount'     => '50.00',
        ]);
    }

    /**
     * Test that user without wallet cannot create transaction.
     */
    public function test_user_without_wallet_cannot_create_transaction(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);

        $user = User::factory()->create();
        $user->assignRole('owner');
        $user->accounts()->delete();

        $this->assertEquals(0, $user->accounts()->count());

        $category = Category::where('type', 'expense')->first();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/transactions', [
                'account_id'       => 999,
                'category_id'      => $category->id,
                'type'             => 'expense',
                'amount'           => 50.00,
                'notes'            => 'Test transaction',
                'transaction_date' => now()->format('Y-m-d'),
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'You must have at least one account to create transactions. Please create an account first.',
            ]);
    }

    /**
     * Test that a registered user (auto-verified) can log in and create a transaction.
     *
     * Since registration auto-verifies the email in MVP mode, there is no
     * separate verification step. The user can log in immediately.
     */
    public function test_newly_registered_user_can_create_transaction_after_email_verification(): void
    {
        Http::fake();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);

        // Register — auto-verification means user is immediately active.
        $registerResponse = $this->postJson('/api/auth/register', [
            'name'                  => 'New User',
            'email'                 => 'newuser@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $registerResponse->assertStatus(201)
            ->assertJson(['success' => true]);

        $user = User::where('email', 'newuser@example.com')->first();
        $this->assertNotNull($user);

        // Auto-verified: log in directly — no email token step required.
        $loginResponse = $this->postJson('/api/auth/login', [
            'email'    => 'newuser@example.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertOk()
            ->assertJsonStructure([
                'success',
                'access_token',
                'token_type',
                'expires_in',
                'user',
            ]);

        $token    = $loginResponse->json('access_token');
        $wallet   = $user->accounts()->first();
        $category = Category::where('type', 'income')->first();

        $transactionResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/transactions', [
            'account_id'       => $wallet->id,
            'category_id'      => $category->id,
            'type'             => 'income',
            'amount'           => 100.00,
            'notes'            => 'First transaction',
            'transaction_date' => now()->format('Y-m-d'),
        ]);

        $transactionResponse->assertStatus(201);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'amount'  => '100.00',
        ]);

        $wallet->refresh();
        $this->assertEquals('100.00', $wallet->balance);
    }
}
