<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        SubscriptionPlan::create([
            'name' => 'Free',
            'description' => 'Basic features for personal use',
            'price' => 0.00,
            'billing_cycle' => 'forever',
            'features' => ['Basic Tracking', '1 Account', 'Standard Support'],
            'sort_order' => 1,
        ]);

        SubscriptionPlan::create([
            'name' => 'Pro',
            'description' => 'Advanced features for enthusiasts',
            'price' => 9.99,
            'billing_cycle' => 'monthly',
            'features' => ['Multi-account', 'Priority Support', 'Advanced Analytics'],
            'sort_order' => 2,
        ]);

        SubscriptionPlan::create([
            'name' => 'Expert',
            'description' => 'Full suite for power users',
            'price' => 29.99,
            'billing_cycle' => 'monthly',
            'features' => ['Custom Categories', 'Export to Excel', 'Dedicated Account Manager'],
            'sort_order' => 3,
        ]);
    }
}
