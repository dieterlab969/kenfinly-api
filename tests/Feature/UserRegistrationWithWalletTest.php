<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class UserRegistrationWithWalletTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setRegistrationEmailBypass('1');
    }

    private function setRegistrationEmailBypass(string $value): void
    {
        putenv("DISABLE_REGISTRATION_EMAIL={$value}");
        $_ENV['DISABLE_REGISTRATION_EMAIL'] = $value;
        $_SERVER['DISABLE_REGISTRATION_EMAIL'] = $value;
    }

    private function registerUser(array $overrides = []): TestResponse
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        return $this->postJson('/api/auth/register', array_merge([
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ], $overrides));
    }

    private function createOwnerUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole('owner');

        return $user;
    }

    /**
     * Test that wallet is created when user registers via API.
     */
    public function test_wallet_is_created_when_user_registers_via_api(): void
    {
        $response = $this->registerUser();

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('verification_sent', false)
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
                'verification_expires_at',
            ]);

        $user = User::where('email', 'newuser@example.com')->firstOrFail();
        
        $this->assertEquals(1, $user->accounts()->count());
        
        $wallet = $user->accounts()->first();
        $this->assertNotNull($wallet);
        $this->assertEquals('My Wallet', $wallet->name);
        $this->assertEquals('0.00', $wallet->balance);

        $this->assertDatabaseHas('accounts', [
            'user_id' => $user->id,
            'name' => 'My Wallet',
        ]);
    }

    /**
     * Test that user with wallet can create transactions.
     */
    public function test_user_with_wallet_can_create_transaction(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);

        $user = $this->createOwnerUser();
        $this->assertGreaterThan(0, $user->accounts()->count());

        $wallet = $user->accounts()->first();
        $category = Category::where('type', 'expense')->first();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/transactions', [
                'account_id' => $wallet->id,
                'category_id' => $category->id,
                'type' => 'expense',
                'amount' => 50.00,
                'notes' => 'Test transaction',
                'transaction_date' => now()->format('Y-m-d'),
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'transaction',
            ]);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'account_id' => $wallet->id,
            'amount' => '50.00',
        ]);
    }

    /**
     * Test that user without wallet cannot create transaction.
     */
    public function test_user_without_wallet_cannot_create_transaction(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\CategorySeeder::class);

        $user = $this->createOwnerUser();
        $user->accounts()->delete();

        $this->assertEquals(0, $user->accounts()->count());

        $category = Category::where('type', 'expense')->first();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/transactions', [
                'account_id' => 999,
                'category_id' => $category->id,
                'type' => 'expense',
                'amount' => 50.00,
                'notes' => 'Test transaction',
                'transaction_date' => now()->format('Y-m-d'),
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'You must have at least one account to create transactions. Please create an account first.',
            ]);
    }

    /**
     * Test that newly registered user can immediately create transaction.
     */
    public function test_newly_registered_user_can_immediately_create_transaction(): void
    {
        $this->seed(\Database\Seeders\CategorySeeder::class);

        $registerResponse = $this->registerUser();

        $registerResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('verification_sent', false);

        $user = User::where('email', 'newuser@example.com')->firstOrFail();
        $wallet = $user->accounts()->first();
        $category = Category::where('type', 'income')->first();

        $this->assertNotNull($wallet);

        $transactionResponse = $this->actingAs($user, 'api')->postJson('/api/transactions', [
            'account_id' => $wallet->id,
            'category_id' => $category->id,
            'type' => 'income',
            'amount' => 100.00,
            'notes' => 'First transaction',
            'transaction_date' => now()->format('Y-m-d'),
        ]);

        $transactionResponse->assertStatus(201);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'amount' => '100.00',
        ]);

        $wallet->refresh();
        $this->assertEquals('100.00', $wallet->balance);
    }
}
