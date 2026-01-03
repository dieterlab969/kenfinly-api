<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class EnrollExistingUsersInFreePlan extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:enroll-existing-users';
    protected $description = 'Enroll all existing users without a subscription into the Free plan';

    public function handle()
    {
        $freePlan = \App\Models\SubscriptionPlan::where('name', 'Free')->first();

        if (!$freePlan) {
            $this->error('Free plan not found. Please seed the subscription plans first.');
            return 1;
        }

        $users = \App\Models\User::whereDoesntHave('subscriptions')->get();

        if ($users->isEmpty()) {
            $this->info('All users already have a subscription.');
            return 0;
        }

        $bar = $this->output->createProgressBar($users->count());
        $bar->start();

        foreach ($users as $user) {
            \App\Models\Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $freePlan->id,
                'status' => 'active',
                'amount' => 0,
                'currency' => 'VND',
                'start_date' => now(),
            ]);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Successfully enrolled {$users->count()} users in the Free plan.");

        return 0;
    }
}
