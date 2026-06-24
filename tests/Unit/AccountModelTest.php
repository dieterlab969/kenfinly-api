<?php

namespace Tests\Unit;

use App\Models\Account;
use App\Models\AccountParticipant;
use App\Models\Category;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for the Account (wallet) model.
 *
 * Covers: fillable attributes, attribute casts, Eloquent relationships
 * (user, transactions, participants, invitations), participant helpers
 * (hasParticipant, getParticipantRole), and the calculateBalance method.
 */
class AccountModelTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ───────────────────────────────────────────────────────────

    private function makeUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'status'            => 'active',
        ], $overrides));
    }

    private function makeAccount(User $user, array $overrides = []): Account
    {
        return Account::create(array_merge([
            'user_id'  => $user->id,
            'name'     => 'Test Account',
            'balance'  => 0.00,
            'currency' => 'USD',
        ], $overrides));
    }

    private function makeTransaction(Account $account, string $type, float $amount): Transaction
    {
        $this->seed(\Database\Seeders\CategorySeeder::class);
        $category = Category::where('type', $type)->first();

        return Transaction::create([
            'user_id'          => $account->user_id,
            'account_id'       => $account->id,
            'category_id'      => $category->id,
            'type'             => $type,
            'amount'           => $amount,
            'transaction_date' => now()->format('Y-m-d'),
        ]);
    }

    // ── Fillable & Casts ──────────────────────────────────────────────────

    /** @test */
    public function account_has_expected_fillable_attributes(): void
    {
        $account = new Account();

        $expected = [
            'user_id',
            'name',
            'balance',
            'currency',
            'icon',
            'color',
        ];

        $this->assertEquals($expected, $account->getFillable());
    }

    /** @test */
    public function balance_is_cast_to_decimal_with_two_places(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['balance' => 1234.5]);

        $account->refresh();

        $this->assertEquals('1234.50', $account->balance);
    }

    /** @test */
    public function balance_stores_with_full_precision(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['balance' => 9999999.99]);

        $account->refresh();

        $this->assertEquals('9999999.99', $account->balance);
    }

    /** @test */
    public function account_can_be_mass_assigned_via_create(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();

        $account = Account::create([
            'user_id'  => $user->id,
            'name'     => 'Savings',
            'balance'  => 500.00,
            'currency' => 'VND',
            'icon'     => '💰',
            'color'    => '#3b82f6',
        ]);

        $this->assertDatabaseHas('accounts', [
            'user_id'  => $user->id,
            'name'     => 'Savings',
            'currency' => 'VND',
        ]);
        $this->assertNotNull($account->id);
    }

    // ── Relationships ─────────────────────────────────────────────────────

    /** @test */
    public function user_relationship_returns_belongs_to_instance(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->assertInstanceOf(BelongsTo::class, $account->user());
    }

    /** @test */
    public function account_belongs_to_the_correct_user(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->assertNotNull($account->user);
        $this->assertInstanceOf(User::class, $account->user);
        $this->assertEquals($user->id, $account->user->id);
        $this->assertEquals($user->email, $account->user->email);
    }

    /** @test */
    public function transactions_relationship_returns_has_many_instance(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->assertInstanceOf(HasMany::class, $account->transactions());
    }

    /** @test */
    public function account_has_many_transactions(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->makeTransaction($account, 'income',  100.00);
        $this->makeTransaction($account, 'expense',  40.00);
        $this->makeTransaction($account, 'income',   60.00);

        $account->refresh();

        $this->assertInstanceOf(Collection::class, $account->transactions);
        $this->assertCount(3, $account->transactions);

        foreach ($account->transactions as $tx) {
            $this->assertInstanceOf(Transaction::class, $tx);
            $this->assertEquals($account->id, $tx->account_id);
        }
    }

    /** @test */
    public function transactions_relationship_only_returns_own_transactions(): void
    {
        $user     = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account1 = $this->makeAccount($user, ['name' => 'Account A']);
        $account2 = $this->makeAccount($user, ['name' => 'Account B']);

        $this->makeTransaction($account1, 'income', 200.00);
        $this->makeTransaction($account2, 'income', 300.00);

        $this->assertCount(1, $account1->transactions);
        $this->assertCount(1, $account2->transactions);
        $this->assertEquals($account1->id, $account1->transactions->first()->account_id);
    }

    /** @test */
    public function participants_relationship_returns_has_many_instance(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->assertInstanceOf(HasMany::class, $account->participants());
    }

    /** @test */
    public function invitations_relationship_returns_has_many_instance(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->assertInstanceOf(HasMany::class, $account->invitations());
    }

    // ── calculateBalance ──────────────────────────────────────────────────

    /** @test */
    public function calculate_balance_returns_zero_when_no_transactions_exist(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['balance' => 0]);

        $this->assertEquals(0.0, $account->calculateBalance());
    }

    /** @test */
    public function calculate_balance_sums_income_transactions_correctly(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['balance' => 0]);

        $this->makeTransaction($account, 'income', 100.00);
        $this->makeTransaction($account, 'income', 250.00);
        $this->makeTransaction($account, 'income',  50.00);

        $this->assertEquals(400.0, $account->calculateBalance());
    }

    /** @test */
    public function calculate_balance_subtracts_expense_transactions(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['balance' => 0]);

        $this->makeTransaction($account, 'income',  500.00);
        $this->makeTransaction($account, 'expense', 200.00);
        $this->makeTransaction($account, 'expense',  75.00);

        $this->assertEquals(225.0, $account->calculateBalance());
    }

    /** @test */
    public function calculate_balance_returns_negative_when_expenses_exceed_income(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['balance' => 0]);

        $this->makeTransaction($account, 'income',  100.00);
        $this->makeTransaction($account, 'expense', 300.00);

        $this->assertEquals(-200.0, $account->calculateBalance());
    }

    /** @test */
    public function calculate_balance_handles_multiple_income_and_expense_entries(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, ['balance' => 0]);

        $this->makeTransaction($account, 'income',  1000.00);
        $this->makeTransaction($account, 'income',   500.00);
        $this->makeTransaction($account, 'expense',  200.00);
        $this->makeTransaction($account, 'expense',  150.00);
        $this->makeTransaction($account, 'expense',   50.00);

        // income: 1500, expense: 400 → 1100
        $this->assertEquals(1100.0, $account->calculateBalance());
    }

    /** @test */
    public function calculate_balance_is_isolated_per_account(): void
    {
        $user     = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account1 = $this->makeAccount($user, ['name' => 'Account A', 'balance' => 0]);
        $account2 = $this->makeAccount($user, ['name' => 'Account B', 'balance' => 0]);

        $this->makeTransaction($account1, 'income', 300.00);
        $this->makeTransaction($account2, 'income', 700.00);

        $this->assertEquals(300.0, $account1->calculateBalance());
        $this->assertEquals(700.0, $account2->calculateBalance());
    }

    // ── hasParticipant ────────────────────────────────────────────────────

    /** @test */
    public function has_participant_returns_false_when_no_participants_exist(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $otherUser = $this->makeUser();

        $this->assertFalse($account->hasParticipant($otherUser->id));
    }

    /** @test */
    public function has_participant_returns_true_when_user_is_a_participant(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $owner = $this->makeUser();
        Account::where('user_id', $owner->id)->delete();
        $account = $this->makeAccount($owner);

        $participant = $this->makeUser();
        $role        = Role::where('name', 'viewer')->first();

        AccountParticipant::create([
            'account_id' => $account->id,
            'user_id'    => $participant->id,
            'role_id'    => $role->id,
        ]);

        $this->assertTrue($account->hasParticipant($participant->id));
    }

    /** @test */
    public function has_participant_returns_false_for_non_participant_user(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $owner = $this->makeUser();
        Account::where('user_id', $owner->id)->delete();
        $account = $this->makeAccount($owner);

        $participant = $this->makeUser();
        $stranger    = $this->makeUser();
        $role        = Role::where('name', 'viewer')->first();

        AccountParticipant::create([
            'account_id' => $account->id,
            'user_id'    => $participant->id,
            'role_id'    => $role->id,
        ]);

        $this->assertTrue($account->hasParticipant($participant->id));
        $this->assertFalse($account->hasParticipant($stranger->id));
    }

    // ── getParticipantRole ────────────────────────────────────────────────

    /** @test */
    public function get_participant_role_returns_null_when_user_is_not_a_participant(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $stranger = $this->makeUser();

        $this->assertNull($account->getParticipantRole($stranger->id));
    }

    /** @test */
    public function get_participant_role_returns_the_correct_role_name(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $owner = $this->makeUser();
        Account::where('user_id', $owner->id)->delete();
        $account = $this->makeAccount($owner);

        $editorUser = $this->makeUser();
        $editorRole = Role::where('name', 'editor')->first();

        AccountParticipant::create([
            'account_id' => $account->id,
            'user_id'    => $editorUser->id,
            'role_id'    => $editorRole->id,
        ]);

        $this->assertEquals('editor', $account->getParticipantRole($editorUser->id));
    }

    /** @test */
    public function get_participant_role_distinguishes_between_different_participant_roles(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $owner = $this->makeUser();
        Account::where('user_id', $owner->id)->delete();
        $account = $this->makeAccount($owner);

        $editor = $this->makeUser();
        $viewer = $this->makeUser();

        $editorRole = Role::where('name', 'editor')->first();
        $viewerRole = Role::where('name', 'viewer')->first();

        AccountParticipant::create([
            'account_id' => $account->id,
            'user_id'    => $editor->id,
            'role_id'    => $editorRole->id,
        ]);

        AccountParticipant::create([
            'account_id' => $account->id,
            'user_id'    => $viewer->id,
            'role_id'    => $viewerRole->id,
        ]);

        $this->assertEquals('editor', $account->getParticipantRole($editor->id));
        $this->assertEquals('viewer', $account->getParticipantRole($viewer->id));
    }

    // ── Model integrity ───────────────────────────────────────────────────

    /** @test */
    public function deleting_a_user_cascades_to_their_accounts(): void
    {
        $user = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user);

        $this->assertDatabaseHas('accounts', ['id' => $account->id]);

        $user->delete();

        $this->assertDatabaseMissing('accounts', ['id' => $account->id]);
    }

    /** @test */
    public function account_stores_optional_metadata_fields_correctly(): void
    {
        $user    = $this->makeUser();
        Account::where('user_id', $user->id)->delete();
        $account = $this->makeAccount($user, [
            'icon'  => '💰',
            'color' => '#6366f1',
        ]);

        $account->refresh();

        $this->assertEquals('💰',      $account->icon);
        $this->assertEquals('#6366f1', $account->color);
    }
}
