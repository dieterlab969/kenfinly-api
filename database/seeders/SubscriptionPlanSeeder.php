<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'         => 'Free',
                'description'  => 'Essential tools for personal finance at no cost.',
                'price'        => 0.00,
                'currency'     => 'VND',
                'billing_cycle'=> 'forever',
                'features'     => [
                    'Expense & income tracking',
                    '1 wallet account',
                    'Basic categories',
                    '7-day transaction history',
                ],
                'is_active'    => true,
                'sort_order'   => 1,
            ],
            [
                'name'         => 'Monthly Pro',
                'description'  => 'Full power for your finances, billed monthly.',
                'price'        => (float) env('PAYOS_MONTHLY_AMOUNT', 79000),
                'currency'     => 'VND',
                'billing_cycle'=> 'monthly',
                'features'     => [
                    'Everything in Free',
                    'Unlimited wallet accounts',
                    'Multi-currency support',
                    'Advanced analytics & charts',
                    'Budget planning & goals',
                    'CSV import & export',
                    'Saving habit tracker',
                    'Priority support',
                ],
                'is_active'    => true,
                'sort_order'   => 2,
            ],
            [
                'name'         => 'Yearly Pro',
                'description'  => 'Best value — all Pro features for a full year.',
                'price'        => (float) env('PAYOS_YEARLY_AMOUNT', 169000),
                'currency'     => 'VND',
                'billing_cycle'=> 'yearly',
                'features'     => [
                    'Everything in Monthly Pro',
                    'Early access to new features',
                    'Dedicated support channel',
                    'Team collaboration (coming soon)',
                    'API access (coming soon)',
                    'Custom report builder',
                    'Audit trail & history',
                ],
                'is_active'    => true,
                'sort_order'   => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::firstOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
