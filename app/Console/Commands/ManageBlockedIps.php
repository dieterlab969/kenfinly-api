<?php

namespace App\Console\Commands;

use App\Models\BlockedIp;
use Illuminate\Console\Command;

class ManageBlockedIps extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'blocked-ip {action : Action to perform (list|block|unblock|clear-expired)} 
                            {ip? : IP address (required for block/unblock)}
                            {--reason= : Reason for blocking}
                            {--duration= : Block duration in minutes (default: 1440 for 24 hours)}
                            {--permanent : Make the block permanent}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage blocked IP addresses for bot prevention';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = $this->argument('action');

        return match($action) {
            'list' => $this->listBlockedIps(),
            'block' => $this->blockIp(),
            'unblock' => $this->unblockIp(),
            'clear-expired' => $this->clearExpiredBlocks(),
            default => $this->error("Invalid action. Use: list, block, unblock, or clear-expired")
        };
    }

    private function listBlockedIps()
    {
        $blocks = BlockedIp::orderBy('created_at', 'desc')->get();

        if ($blocks->isEmpty()) {
            $this->info('No blocked IP addresses found.');
            return 0;
        }

        $this->info("Total blocked IPs: " . $blocks->count());
        $this->newLine();

        $data = [];
        foreach ($blocks as $block) {
            $status = $block->is_permanent ? 'Permanent' : 
                     ($block->blocked_until && $block->blocked_until->isFuture() ? 
                      'Until ' . $block->blocked_until->format('Y-m-d H:i:s') : 
                      'Expired');

            $data[] = [
                $block->ip_address,
                $status,
                $block->block_count,
                substr($block->reason, 0, 50) . (strlen($block->reason) > 50 ? '...' : ''),
                $block->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $this->table(
            ['IP Address', 'Status', 'Block Count', 'Reason', 'Created'],
            $data
        );

        return 0;
    }

    private function blockIp()
    {
        $ip = $this->argument('ip');
        
        if (!$ip) {
            $this->error('IP address is required for blocking.');
            return 1;
        }

        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            $this->error('Invalid IP address format.');
            return 1;
        }

        $reason = $this->option('reason') ?? 'Manually blocked via command';
        $duration = $this->option('duration') ?? 1440;
        $permanent = $this->option('permanent');

        BlockedIp::blockIp(
            $ip,
            $reason,
            $permanent ? null : (int)$duration,
            $permanent
        );

        if ($permanent) {
            $this->info("IP address {$ip} has been permanently blocked.");
        } else {
            $this->info("IP address {$ip} has been blocked for {$duration} minutes.");
        }

        $this->line("Reason: {$reason}");

        return 0;
    }

    private function unblockIp()
    {
        $ip = $this->argument('ip');
        
        if (!$ip) {
            $this->error('IP address is required for unblocking.');
            return 1;
        }

        if (BlockedIp::unblockIp($ip)) {
            $this->info("IP address {$ip} has been unblocked.");
            return 0;
        }

        $this->error("IP address {$ip} was not found in the blocked list.");
        return 1;
    }

    private function clearExpiredBlocks()
    {
        $deleted = BlockedIp::where('is_permanent', false)
            ->where('blocked_until', '<', now())
            ->delete();

        $this->info("Cleared {$deleted} expired IP blocks.");
        return 0;
    }
}
