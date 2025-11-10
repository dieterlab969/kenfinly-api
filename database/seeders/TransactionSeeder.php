<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'owner@example.com')->first();
        
        if (!$owner) {
            $this->command->warn('Owner user not found. Please run TestUsersSeeder first.');
            return;
        }

        $accounts = Account::where('user_id', $owner->id)->get();
        
        if ($accounts->count() === 0) {
            $this->command->warn('No accounts found for owner. Please run AccountSeeder first.');
            return;
        }

        $incomeCategories = Category::where('type', 'income')->get();
        $expenseCategories = Category::where('type', 'expense')->get();

        $transactions = [
            [
                'account_index' => 0,
                'type' => 'income',
                'amount' => 5000000,
                'notes' => 'Monthly salary',
                'days_ago' => 1,
            ],
            [
                'account_index' => 1,
                'type' => 'expense',
                'amount' => 150000,
                'notes' => 'Grocery shopping',
                'days_ago' => 2,
            ],
            [
                'account_index' => 0,
                'type' => 'expense',
                'amount' => 500000,
                'notes' => 'Electric bill payment',
                'days_ago' => 3,
            ],
            [
                'account_index' => 1,
                'type' => 'expense',
                'amount' => 200000,
                'notes' => 'Restaurant dinner',
                'days_ago' => 4,
            ],
            [
                'account_index' => 0,
                'type' => 'income',
                'amount' => 1000000,
                'notes' => 'Freelance project',
                'days_ago' => 5,
            ],
            [
                'account_index' => 1,
                'type' => 'expense',
                'amount' => 300000,
                'notes' => 'Shopping',
                'days_ago' => 6,
            ],
            [
                'account_index' => 0,
                'type' => 'expense',
                'amount' => 100000,
                'notes' => 'Transportation',
                'days_ago' => 7,
            ],
            [
                'account_index' => 1,
                'type' => 'income',
                'amount' => 500000,
                'notes' => 'Gift received',
                'days_ago' => 8,
            ],
        ];

        foreach ($transactions as $txn) {
            $account = $accounts[$txn['account_index'] % $accounts->count()];
            
            $category = $txn['type'] === 'income'
                ? $incomeCategories->random()
                : $expenseCategories->random();

            $transaction = Transaction::create([
                'user_id' => $owner->id,
                'account_id' => $account->id,
                'category_id' => $category->id,
                'type' => $txn['type'],
                'amount' => $txn['amount'],
                'notes' => $txn['notes'],
                'transaction_date' => Carbon::now()->subDays($txn['days_ago'])->format('Y-m-d'),
            ]);

            $balanceChange = $txn['type'] === 'income' ? $txn['amount'] : -$txn['amount'];
            $account->increment('balance', $balanceChange);
        }

        $this->command->info('Transactions seeded successfully across multiple accounts!');
        $this->command->info('Total transactions created: ' . count($transactions));
    }
}
