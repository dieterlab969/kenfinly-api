<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserSubscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 4 ownership regression coverage.
 *
 * Every resource in this file is exercised once by its owner and once by a
 * different authenticated user. Account-like resources intentionally return
 * 404 for the other user to avoid leaking resource existence.
 */
class Phase4AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create([
            'email_verified_at' => now(),
            'status' => 'active',
        ]);
    }

    public function test_transaction_owner_can_view_and_another_user_cannot(): void
    {
        $owner = $this->user();
        $other = $this->user();
        $account = Account::create([
            'user_id' => $owner->id,
            'name' => 'Owner wallet',
            'balance' => 0,
            'currency' => 'USD',
        ]);
        $category = Category::whereNull('user_id')->first()
            ?: Category::create([
                'name' => 'Other',
                'slug' => 'phase4-other',
                'type' => 'expense',
                'user_id' => null,
                'is_system' => true,
            ]);
        $transaction = Transaction::create([
            'user_id' => $owner->id,
            'account_id' => $account->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'ledger_type' => 'real',
            'amount' => 10,
            'amount_minor' => 1000,
            'transaction_date' => now()->toDateString(),
            'currency' => 'USD',
            'source_type' => 'manual',
        ]);

        $this->actingAs($owner, 'api')
            ->getJson("/api/transactions/{$transaction->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->actingAs($other, 'api')
            ->getJson("/api/transactions/{$transaction->id}")
            ->assertForbidden();
    }

    public function test_category_owner_can_update_and_another_user_is_forbidden(): void
    {
        $owner = $this->user();
        $other = $this->user();
        $category = Category::create([
            'name' => 'Owner category',
            'slug' => 'phase4-owner-category',
            'type' => 'expense',
            'user_id' => $owner->id,
            'is_system' => false,
        ]);

        $this->actingAs($owner, 'api')
            ->putJson("/api/categories/{$category->id}", ['name' => 'Updated category'])
            ->assertOk();

        $this->actingAs($other, 'api')
            ->putJson("/api/categories/{$category->id}", ['name' => 'Intruder update'])
            ->assertForbidden();
    }

    public function test_user_subscription_owner_can_view_and_another_user_gets_not_found(): void
    {
        $owner = $this->user();
        $other = $this->user();
        $subscription = UserSubscription::create([
            'user_id' => $owner->id,
            'service_name' => 'Phase 4 service',
            'amount' => 10,
            'currency' => 'USD',
            'billing_cycle' => 'MONTHLY',
            'next_billing_date' => now()->addMonth()->toDateString(),
            'is_trial' => false,
            'status' => 'ACTIVE',
            'is_deleted' => false,
        ]);

        $this->actingAs($owner, 'api')
            ->getJson("/api/user-subscriptions/{$subscription->id}")
            ->assertOk()
            ->assertJsonPath('subscription.id', $subscription->id);

        $this->actingAs($other, 'api')
            ->getJson("/api/user-subscriptions/{$subscription->id}")
            ->assertNotFound();
    }
}