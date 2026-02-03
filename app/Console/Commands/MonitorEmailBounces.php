<?php

namespace App\Console\Commands;

use App\Models\EmailBounce;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MonitorEmailBounces extends Command
{
    protected $signature = 'monitor:email-bounces 
                            {--hours=24 : Number of hours to analyze}
                            {--show-details : Show detailed bounce information}';

    protected $description = 'Monitor email bounce rates and identify problematic email addresses';

    public function handle()
    {
        $hours = (int) $this->option('hours');
        $showDetails = $this->option('show-details');

        $this->info("Email Bounce Monitoring Report - Last {$hours} hours");
        $this->line(str_repeat('=', 70));

        // Overall statistics
        $this->displayOverallStats($hours);
        
        // Bounce type breakdown
        $this->displayBounceTypeBreakdown($hours);
        
        // Top bouncing emails
        $this->displayTopBouncingEmails($hours, $showDetails);
        
        // Domain analysis
        $this->displayDomainAnalysis($hours);
        
        // Blocked emails
        $this->displayBlockedEmails();

        return 0;
    }

    protected function displayOverallStats($hours)
    {
        $stats = EmailBounce::getStatistics($hours);

        $this->newLine();
        $this->info('📊 Overall Email Bounce Statistics:');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Bounces', $stats['total_bounces']],
                ['Hard Bounces', $stats['hard_bounces']],
                ['Soft Bounces', $stats['soft_bounces']],
                ['Unique Emails', $stats['unique_emails']],
                ['Blocked Emails', $stats['blocked_emails']],
            ]
        );

        // Calculate bounce rate if we have data
        if ($stats['total_bounces'] > 0) {
            $hardBounceRate = round(($stats['hard_bounces'] / $stats['total_bounces']) * 100, 2);
            $this->line("Hard Bounce Rate: {$hardBounceRate}%");
        }
    }

    protected function displayBounceTypeBreakdown($hours)
    {
        $since = now()->subHours($hours);

        $breakdown = EmailBounce::select('bounce_type', DB::raw('COUNT(*) as count'))
            ->where('last_bounced_at', '>=', $since)
            ->groupBy('bounce_type')
            ->get();

        if ($breakdown->isNotEmpty()) {
            $this->newLine();
            $this->info('📈 Bounce Type Breakdown:');
            $this->table(
                ['Bounce Type', 'Count'],
                $breakdown->map(fn($item) => [$item->bounce_type, $item->count])->toArray()
            );
        }
    }

    protected function displayTopBouncingEmails($hours, $showDetails)
    {
        $since = now()->subHours($hours);

        $topBounces = EmailBounce::where('last_bounced_at', '>=', $since)
            ->orderBy('bounce_count', 'desc')
            ->limit(10)
            ->get();

        if ($topBounces->isNotEmpty()) {
            $this->newLine();
            $this->info('🔝 Top Bouncing Email Addresses:');
            
            if ($showDetails) {
                $this->table(
                    ['Email', 'Type', 'Count', 'Reason', 'Last Bounce'],
                    $topBounces->map(fn($bounce) => [
                        $bounce->email,
                        $bounce->bounce_type,
                        $bounce->bounce_count,
                        $bounce->bounce_reason ?? 'N/A',
                        $bounce->last_bounced_at->diffForHumans(),
                    ])->toArray()
                );
            } else {
                $this->table(
                    ['Email', 'Type', 'Count'],
                    $topBounces->map(fn($bounce) => [
                        $bounce->email,
                        $bounce->bounce_type,
                        $bounce->bounce_count,
                    ])->toArray()
                );
            }
        }
    }

    protected function displayDomainAnalysis($hours)
    {
        $since = now()->subHours($hours);

        // Get bounces and extract domains manually (database-agnostic approach)
        $bounces = EmailBounce::where('last_bounced_at', '>=', $since)->get();
        
        if ($bounces->isEmpty()) {
            return;
        }
        
        $domainStats = $bounces->groupBy(function ($bounce) {
            return substr(strrchr($bounce->email, "@"), 1);
        })->map(function ($group) {
            return count($group);
        })->sortDesc()->take(10);

        if ($domainStats->isNotEmpty()) {
            $this->newLine();
            $this->info('🌐 Top Domains by Bounce Count:');
            $this->table(
                ['Domain', 'Bounces'],
                $domainStats->map(fn($count, $domain) => [$domain, $count])->values()->toArray()
            );
        }
    }

    protected function displayBlockedEmails()
    {
        $blocked = EmailBounce::where(function ($query) {
            $query->where('bounce_type', 'hard')
                ->orWhere(function ($q) {
                    $q->where('bounce_type', 'soft')
                        ->where('bounce_count', '>=', 3);
                });
        })->count();

        $this->newLine();
        if ($blocked > 0) {
            $this->warn("⚠️  {$blocked} email addresses are currently blocked from receiving emails");
            $this->line('Use --show-details to see which emails are blocked');
        } else {
            $this->info('✅ No email addresses are currently blocked');
        }
    }
}
