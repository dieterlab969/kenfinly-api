<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'owner@example.com')->first();
        if ($owner) {
            Account::create([
                'user_id' => $owner->id,
                'name' => 'Cash',
                'balance' => 5000.00,
                'currency' => 'USD',
                'icon' => '💵',
                'color' => '#10B981',
            ]);

            Account::create([
                'user_id' => $owner->id,
                'name' => 'Bank Account',
                'balance' => 15000.00,
                'currency' => 'USD',
                'icon' => '🏦',
                'color' => '#3B82F6',
            ]);

            Account::create([
                'user_id' => $owner->id,
                'name' => 'Credit Card',
                'balance' => -2500.00,
                'currency' => 'USD',
                'icon' => '💳',
                'color' => '#EF4444',
            ]);
        }

        $viewer = User::where('email', 'viewer@example.com')->first();
        if ($viewer) {
            Account::create([
                'user_id' => $viewer->id,
                'name' => 'Cash',
                'balance' => 1000.00,
                'currency' => 'USD',
                'icon' => '💵',
                'color' => '#10B981',
            ]);
        }

        echo "Accounts seeded successfully!\n";
    }
}
