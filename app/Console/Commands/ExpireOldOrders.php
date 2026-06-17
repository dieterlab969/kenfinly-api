<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;

class ExpireOldOrders extends Command
{
    protected $signature   = 'orders:expire';
    protected $description = 'Transition pending orders older than 5 minutes to expired status.';

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
