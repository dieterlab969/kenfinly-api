<?php

namespace Tests\Unit;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserWalletCreationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that a wallet is automatically created when a new user is registered.
     */
    public function test_wallet_is_created_automatically_on_user_registration(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('password123'),
        ]);

        $this->assertDatabaseHas('accounts', [
            'user_id' => $user->id,
        ]);

        $this->assertEquals(1, $user->accounts()->count());
    }

    /**
     * Test that the auto-created wallet has correct default values.
     */
    public function test_auto_created_wallet_has_correct_default_values(): void
    {
        $user = User::factory()->create();

        $wallet = $user->accounts()->first();

        $this->assertNotNull($wallet);
        $this->assertEquals('My Wallet', $wallet->name);
        $this->assertEquals('0.00', $wallet->balance);
        $this->assertEquals('USD', $wallet->currency);
        $this->assertEquals('💰', $wallet->icon);
        $this->assertEquals('#3b82f6', $wallet->color);
    }

    /**
     * Test that multiple users each get their own wallet.
     */
    public function test_multiple_users_each_get_their_own_wallet(): void
    {
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        $user2 = User::factory()->create(['email' => 'user2@example.com']);
        $user3 = User::factory()->create(['email' => 'user3@example.com']);

        $this->assertEquals(1, $user1->accounts()->count());
        $this->assertEquals(1, $user2->accounts()->count());
        $this->assertEquals(1, $user3->accounts()->count());

        $wallet1 = $user1->accounts()->first();
        $wallet2 = $user2->accounts()->first();
        $wallet3 = $user3->accounts()->first();

        $this->assertEquals($user1->id, $wallet1->user_id);
        $this->assertEquals($user2->id, $wallet2->user_id);
        $this->assertEquals($user3->id, $wallet3->user_id);

        $this->assertNotEquals($wallet1->id, $wallet2->id);
        $this->assertNotEquals($wallet2->id, $wallet3->id);
    }

    /**
     * Test that user can access their wallet through the relationship.
     */
    public function test_user_can_access_wallet_through_relationship(): void
    {
        $user = User::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Collection::class, $user->accounts);
        $this->assertGreaterThan(0, $user->accounts->count());
        
        $wallet = $user->accounts->first();
        $this->assertInstanceOf(Account::class, $wallet);
        $this->assertEquals($user->id, $wallet->user_id);
    }

    /**
     * Test that wallet creation happens even during bulk user creation.
     */
    public function test_wallet_creation_works_with_factory(): void
    {
        $users = User::factory()->count(5)->create();

        foreach ($users as $user) {
            $this->assertEquals(1, $user->accounts()->count());
            $wallet = $user->accounts()->first();
            $this->assertEquals('My Wallet', $wallet->name);
        }
    }

    /**
     * Test account belongs to correct user.
     */
    public function test_wallet_belongs_to_correct_user(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $wallet = $user->accounts()->first();
        
        $this->assertNotNull($wallet->user);
        $this->assertEquals($user->id, $wallet->user->id);
        $this->assertEquals('Test User', $wallet->user->name);
        $this->assertEquals('test@example.com', $wallet->user->email);
    }
}
