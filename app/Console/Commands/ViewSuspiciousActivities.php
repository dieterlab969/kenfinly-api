<?php

namespace App\Console\Commands;

use App\Models\SuspiciousActivity;
use Illuminate\Console\Command;

class ViewSuspiciousActivities extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'suspicious-activity {action : Action to perform (list|stats|by-ip|clear-old)} 
                            {ip? : Filter by IP address}
                            {--hours=24 : Number of hours to look back (default: 24)}
                            {--severity= : Filter by severity (low|medium|high)}
                            {--limit=50 : Maximum number of records to display}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'View and manage suspicious activity logs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $action = $this->argument('action');

        return match($action) {
            'list' => $this->listActivities(),
            'stats' => $this->showStats(),
            'by-ip' => $this->listByIp(),
            'clear-old' => $this->clearOldActivities(),
            default => $this->error("Invalid action. Use: list, stats, by-ip, or clear-old")
        };
    }

    private function listActivities()
    {
        $hours = $this->option('hours');
        $severity = $this->option('severity');
        $limit = $this->option('limit');

        $query = SuspiciousActivity::where('created_at', '>=', now()->subHours($hours))
            ->orderBy('created_at', 'desc');

        if ($severity) {
            $query->where('severity', $severity);
        }

        $activities = $query->limit($limit)->get();

        if ($activities->isEmpty()) {
            $this->info('No suspicious activities found in the specified time range.');
            return 0;
        }

        $this->info("Found {$activities->count()} suspicious activities in the last {$hours} hours");
        $this->newLine();

        $data = [];
        foreach ($activities as $activity) {
            $data[] = [
                $activity->ip_address,
                $activity->email ?? '-',
                $activity->username ?? '-',
                $activity->severity,
                substr($activity->reason, 0, 40) . (strlen($activity->reason) > 40 ? '...' : ''),
                $activity->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $this->table(
            ['IP Address', 'Email', 'Username', 'Severity', 'Reason', 'Time'],
            $data
        );

        return 0;
    }

    private function showStats()
    {
        $hours = $this->option('hours');

        $activities = SuspiciousActivity::where('created_at', '>=', now()->subHours($hours))->get();

        if ($activities->isEmpty()) {
            $this->info('No suspicious activities found in the specified time range.');
            return 0;
        }

        $total = $activities->count();
        $byIP = $activities->groupBy('ip_address')->map->count()->sortDesc();
        $bySeverity = $activities->groupBy('severity')->map->count();

        $this->info("Statistics for the last {$hours} hours:");
        $this->newLine();

        $this->line("Total Activities: {$total}");
        $this->newLine();

        $this->line("By Severity:");
        foreach ($bySeverity as $severity => $count) {
            $this->line("  {$severity}: {$count}");
        }
        $this->newLine();

        $this->line("Top 10 Most Active IPs:");
        $topIPs = [];
        foreach ($byIP->take(10) as $ip => $count) {
            $topIPs[] = [$ip, $count];
        }
        $this->table(['IP Address', 'Activity Count'], $topIPs);

        return 0;
    }

    private function listByIp()
    {
        $ip = $this->argument('ip');
        
        if (!$ip) {
            $this->error('IP address is required for this action.');
            return 1;
        }

        $hours = $this->option('hours');
        $activities = SuspiciousActivity::where('ip_address', $ip)
            ->where('created_at', '>=', now()->subHours($hours))
            ->orderBy('created_at', 'desc')
            ->get();

        if ($activities->isEmpty()) {
            $this->info("No suspicious activities found for IP {$ip} in the last {$hours} hours.");
            return 0;
        }

        $this->info("Found {$activities->count()} suspicious activities for IP {$ip}");
        $this->newLine();

        $data = [];
        foreach ($activities as $activity) {
            $data[] = [
                $activity->email ?? '-',
                $activity->username ?? '-',
                $activity->severity,
                $activity->reason,
                $activity->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $this->table(
            ['Email', 'Username', 'Severity', 'Reason', 'Time'],
            $data
        );

        return 0;
    }

    private function clearOldActivities()
    {
        $days = $this->ask('How many days of history to keep?', 30);

        $deleted = SuspiciousActivity::where('created_at', '<', now()->subDays($days))->delete();

        $this->info("Deleted {$deleted} suspicious activity records older than {$days} days.");
        return 0;
    }
}
