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
            'price' => 50000.00,
            'currency' => 'VND',
            'billing_cycle' => 'monthly',
            'features' => [
                'Calendar View',
                'Advanced Data Visualizations',
                'Filtering and Sorting',
                'Time-based Analysis',
                'Predictive Insights',
                'Report Exports (PDF, CSV, Excel)'
            ],
            'sort_order' => 2,
        ]);

        SubscriptionPlan::create([
            'name' => 'Pro Yearly',
            'description' => 'Best value for power users',
            'price' => 169000.00,
            'currency' => 'VND',
            'billing_cycle' => 'yearly',
            'features' => [
                'All Monthly Pro Features',
                'Yearly Discount'
            ],
            'sort_order' => 3,
        ]);
    }
}
