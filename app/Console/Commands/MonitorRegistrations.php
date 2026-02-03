<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\SuspiciousActivity;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MonitorRegistrations extends Command
{
    protected $signature = 'monitor:registrations 
                            {--hours=24 : Number of hours to analyze}
                            {--threshold=10 : Alert threshold for registrations per hour}
                            {--show-ips : Show IP-based statistics}';

    protected $description = 'Monitor registration rates and detect unusual patterns or bot activity';

    public function handle()
    {
        $hours = (int) $this->option('hours');
        $threshold = (int) $this->option('threshold');
        $showIps = $this->option('show-ips');

        $this->info("Registration Monitoring Report - Last {$hours} hours");
        $this->line(str_repeat('=', 70));

        // Overall registration statistics
        $this->displayOverallStats($hours);
        
        // Hourly breakdown
        $this->displayHourlyBreakdown($hours, $threshold);
        
        // Suspicious activity summary
        $this->displaySuspiciousActivitySummary($hours);
        
        // IP-based statistics (if requested)
        if ($showIps) {
            $this->displayIpStatistics($hours);
        }
        
        // Email domain analysis
        $this->displayEmailDomainAnalysis($hours);
        
        // Alert detection
        $this->detectAnomalies($hours, $threshold);

        return 0;
    }

    protected function displayOverallStats($hours)
    {
        $since = Carbon::now()->subHours($hours);
        
        $totalRegistrations = User::where('created_at', '>=', $since)->count();
        $pendingUsers = User::where('created_at', '>=', $since)
            ->where('status', 'pending')
            ->count();
        $activeUsers = User::where('created_at', '>=', $since)
            ->where('status', 'active')
            ->count();
        
        $this->newLine();
        $this->info('📊 Overall Statistics:');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Registrations', $totalRegistrations],
                ['Active Users', $activeUsers],
                ['Pending Verification', $pendingUsers],
                ['Average per Hour', round($totalRegistrations / $hours, 2)],
            ]
        );
    }

    protected function displayHourlyBreakdown($hours, $threshold)
    {
        $since = Carbon::now()->subHours($hours);
        
        // Get users and group them manually (database-agnostic approach)
        $users = User::where('created_at', '>=', $since)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($users->isEmpty()) {
            $this->warn('No registrations found in the specified time range.');
            return;
        }

        // Group by hour manually
        $hourlyData = $users->groupBy(function ($user) {
            return $user->created_at->format('Y-m-d H:00:00');
        })->map(function ($group) {
            return count($group);
        })->sortKeysDesc();

        $this->newLine();
        $this->info('📈 Hourly Breakdown:');
        
        $tableData = $hourlyData->map(function ($count, $hour) use ($threshold) {
            $alert = $count > $threshold ? '⚠️  SPIKE' : '';
            return [
                Carbon::parse($hour)->format('Y-m-d H:i'),
                $count,
                $alert
            ];
        })->values()->toArray();

        $this->table(['Hour', 'Registrations', 'Alert'], $tableData);
    }

    protected function displaySuspiciousActivitySummary($hours)
    {
        $since = Carbon::now()->subHours($hours);
        
        $suspiciousCount = SuspiciousActivity::where('created_at', '>=', $since)->count();
        
        $bySeverity = SuspiciousActivity::select('severity', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', $since)
            ->groupBy('severity')
            ->get()
            ->pluck('count', 'severity')
            ->toArray();

        $byActivityType = SuspiciousActivity::select('activity_type', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', $since)
            ->groupBy('activity_type')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();

        $this->newLine();
        $this->info('🚨 Suspicious Activity Summary:');
        $this->line("Total Suspicious Activities: {$suspiciousCount}");
        
        if (!empty($bySeverity)) {
            $this->table(
                ['Severity', 'Count'],
                collect($bySeverity)->map(fn($count, $severity) => [$severity, $count])->toArray()
            );
        }

        if ($byActivityType->isNotEmpty()) {
            $this->newLine();
            $this->line('Top Activity Types:');
            $this->table(
                ['Activity Type', 'Count'],
                $byActivityType->map(fn($item) => [$item->activity_type, $item->count])->toArray()
            );
        }
    }

    protected function displayIpStatistics($hours)
    {
        $since = Carbon::now()->subHours($hours);
        
        // Find IPs with multiple registration attempts
        $topIps = SuspiciousActivity::select('ip_address', DB::raw('COUNT(*) as attempts'))
            ->where('created_at', '>=', $since)
            ->whereNotNull('ip_address')
            ->groupBy('ip_address')
            ->orderBy('attempts', 'desc')
            ->limit(10)
            ->get();

        if ($topIps->isNotEmpty()) {
            $this->newLine();
            $this->info('🌐 Top IPs by Suspicious Activity:');
            $this->table(
                ['IP Address', 'Attempts'],
                $topIps->map(fn($item) => [$item->ip_address, $item->attempts])->toArray()
            );
        }
    }

    protected function displayEmailDomainAnalysis($hours)
    {
        $since = Carbon::now()->subHours($hours);
        
        // Get users and extract domains manually (database-agnostic approach)
        $users = User::where('created_at', '>=', $since)->get();
        
        if ($users->isEmpty()) {
            return;
        }
        
        $domainStats = $users->groupBy(function ($user) {
            return substr(strrchr($user->email, "@"), 1);
        })->map(function ($group) {
            return count($group);
        })->sortDesc()->take(10);

        if ($domainStats->isNotEmpty()) {
            $this->newLine();
            $this->info('📧 Top Email Domains:');
            $this->table(
                ['Domain', 'Registrations'],
                $domainStats->map(fn($count, $domain) => [$domain, $count])->values()->toArray()
            );
        }
    }

    protected function detectAnomalies($hours, $threshold)
    {
        $since = Carbon::now()->subHours($hours);
        
        // Check for registration spikes
        $recentHourCount = User::where('created_at', '>=', Carbon::now()->subHour())->count();
        
        $alerts = [];
        
        if ($recentHourCount > $threshold) {
            $alerts[] = "⚠️  Registration spike detected: {$recentHourCount} registrations in the last hour (threshold: {$threshold})";
        }
        
        // Check for high suspicious activity rate
        $recentSuspicious = SuspiciousActivity::where('created_at', '>=', Carbon::now()->subHour())
            ->where('severity', 'high')
            ->count();
        
        if ($recentSuspicious > 5) {
            $alerts[] = "🚨 High severity suspicious activities: {$recentSuspicious} in the last hour";
        }
        
        // Check for repeated failures from same IP
        $repeatedIpFailures = SuspiciousActivity::select('ip_address', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', Carbon::now()->subHours(2))
            ->groupBy('ip_address')
            ->having('count', '>', 3)
            ->get();
        
        if ($repeatedIpFailures->isNotEmpty()) {
            $alerts[] = "🔒 {$repeatedIpFailures->count()} IP(s) with repeated suspicious attempts (>3 in 2 hours)";
        }

        if (!empty($alerts)) {
            $this->newLine();
            $this->error('⚠️  ALERTS DETECTED:');
            foreach ($alerts as $alert) {
                $this->warn($alert);
            }
        } else {
            $this->newLine();
            $this->info('✅ No anomalies detected. Registration patterns appear normal.');
        }
    }
}
