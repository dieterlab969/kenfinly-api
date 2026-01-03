<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Command to enroll all existing users without a subscription into the Free subscription plan.
 *
 * This command queries users who do not have any active subscriptions and assigns them
 * the Free plan. It provides progress feedback during execution and reports the result.
 */
class EnrollExistingUsersInFreePlan extends Command
{
    /**
     * The name and signature of the console command.
     *
     * This is the command you run in the terminal to execute this task.
     *
     * @var string
     */
    protected $signature = 'app:enroll-existing-users';

    /**
     * The console command description.
     *
     * Describes the purpose of the command.
     *
     * @var string
     */
    protected $description = 'Enroll all existing users without a subscription into the Free plan';

    /**
     * Execute the console command.
     *
     * Finds the Free subscription plan and enrolls all users without subscriptions into it.
     * Displays a progress bar during the enrollment process.
     *
     * @return int Command exit status code: 0 for success, 1 for failure.
     */
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
