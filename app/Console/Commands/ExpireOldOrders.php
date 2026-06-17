<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;

/**
 * Artisan command that transitions stale pending orders to "expired" status.
 *
 * An order becomes eligible when:
 *  - Its `status` is "pending", AND
 *  - Its `expires_at` timestamp is in the past (default order TTL: 5 minutes).
 *
 * Intended to be registered in the scheduler so it runs every minute:
 *
 *   $schedule->command('orders:expire')->everyMinute();
 *
 * Can also be triggered manually:
 *
 *   php artisan orders:expire
 */
class ExpireOldOrders extends Command
{
    /** @var string The console command signature. */
    protected $signature   = 'orders:expire';

    /** @var string Human-readable description shown in `php artisan list`. */
    protected $description = 'Transition pending orders older than 5 minutes to expired status.';

    /**
     * Execute the console command.
     *
     * Loads all pending orders whose `expires_at` has passed, flips each
     * one to "expired", and writes the count to the console output.
     *
     * @return int Command::SUCCESS (0) always — failures are non-fatal.
     */
    public function handle(): int
    {
        $expired = Order::where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->get();

        if ($expired->isEmpty()) {
            $this->info('No orders to expire.');
            return self::SUCCESS;
        }

        $count = 0;
        foreach ($expired as $order) {
            $order->update(['status' => 'expired']);
            $count++;
        }

        $this->info("Expired {$count} order(s).");

        return self::SUCCESS;
    }
}
