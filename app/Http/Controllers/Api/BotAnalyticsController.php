<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SuspiciousActivity;
use App\Models\BlockedIp;
use App\Models\EmailBounce;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BotAnalyticsController extends Controller
{
    /**
     * Get registration analytics and bot detection statistics
     */
    public function getRegistrationAnalytics(Request $request)
    {
        $hours = $request->input('hours', 24);
        $since = Carbon::now()->subHours($hours);

        return response()->json([
            'period' => [
                'hours' => $hours,
                'from' => $since->toIso8601String(),
                'to' => now()->toIso8601String(),
            ],
            'registrations' => $this->getRegistrationStats($since),
            'suspicious_activity' => $this->getSuspiciousActivityStats($since),
            'email_bounces' => EmailBounce::getStatistics($hours),
            'blocked_ips' => $this->getBlockedIpStats($since),
            'trends' => $this->getTrends($since),
        ]);
    }

    /**
     * Get bot detection summary
     */
    public function getBotDetectionSummary(Request $request)
    {
        $hours = $request->input('hours', 24);
        $since = Carbon::now()->subHours($hours);

        $topPatterns = SuspiciousActivity::select('activity_type', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', $since)
            ->groupBy('activity_type')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get();

        $topIps = SuspiciousActivity::select('ip_address', DB::raw('COUNT(*) as attempts'))
            ->where('created_at', '>=', $since)
            ->whereNotNull('ip_address')
            ->groupBy('ip_address')
            ->orderBy('attempts', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'period_hours' => $hours,
            'total_suspicious' => SuspiciousActivity::where('created_at', '>=', $since)->count(),
            'top_patterns' => $topPatterns,
            'top_offending_ips' => $topIps,
            'severity_breakdown' => SuspiciousActivity::select('severity', DB::raw('COUNT(*) as count'))
                ->where('created_at', '>=', $since)
                ->groupBy('severity')
                ->get()
                ->pluck('count', 'severity'),
        ]);
    }

    /**
     * Get hourly registration trends
     */
    public function getHourlyTrends(Request $request)
    {
        $hours = $request->input('hours', 24);
        $since = Carbon::now()->subHours($hours);

        // Get registrations and group by hour (database-agnostic)
        $users = User::where('created_at', '>=', $since)->get();
        $registrations = $users->groupBy(function ($user) {
            return $user->created_at->format('Y-m-d H:00:00');
        })->map(function ($group, $hour) {
            return ['hour' => $hour, 'count' => count($group)];
        })->sortBy('hour')->values();

        // Get suspicious activities and group by hour (database-agnostic)
        $activities = SuspiciousActivity::where('created_at', '>=', $since)->get();
        $suspicious = $activities->groupBy(function ($activity) {
            return $activity->created_at->format('Y-m-d H:00:00');
        })->map(function ($group, $hour) {
            return ['hour' => $hour, 'count' => count($group)];
        })->sortBy('hour')->values();

        return response()->json([
            'period_hours' => $hours,
            'registrations_by_hour' => $registrations,
            'suspicious_by_hour' => $suspicious,
        ]);
    }

    /**
     * Helper: Get registration statistics
     */
    protected function getRegistrationStats(Carbon $since): array
    {
        $total = User::where('created_at', '>=', $since)->count();
        $active = User::where('created_at', '>=', $since)
            ->where('status', 'active')
            ->count();
        $pending = User::where('created_at', '>=', $since)
            ->where('status', 'pending')
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'pending' => $pending,
            'verification_rate' => $total > 0 ? round(($active / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Helper: Get suspicious activity statistics
     */
    protected function getSuspiciousActivityStats(Carbon $since): array
    {
        $total = SuspiciousActivity::where('created_at', '>=', $since)->count();
        
        $bySeverity = SuspiciousActivity::select('severity', DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', $since)
            ->groupBy('severity')
            ->get()
            ->pluck('count', 'severity')
            ->toArray();

        return [
            'total' => $total,
            'by_severity' => $bySeverity,
            'high_severity_count' => $bySeverity['high'] ?? 0,
        ];
    }

    /**
     * Helper: Get blocked IP statistics
     */
    protected function getBlockedIpStats(Carbon $since): array
    {
        $total = BlockedIp::where('created_at', '>=', $since)->count();
        $active = BlockedIp::where('expires_at', '>', now())
            ->orWhereNull('expires_at')
            ->count();
        $expired = BlockedIp::whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->count();

        return [
            'total_blocked' => $total,
            'active_blocks' => $active,
            'expired_blocks' => $expired,
        ];
    }

    /**
     * Helper: Get trend data
     */
    protected function getTrends(Carbon $since): array
    {
        $hours = now()->diffInHours($since);
        $midpoint = $since->copy()->addHours($hours / 2);

        $firstHalf = User::where('created_at', '>=', $since)
            ->where('created_at', '<', $midpoint)
            ->count();
        $secondHalf = User::where('created_at', '>=', $midpoint)
            ->count();

        $trend = 'stable';
        if ($secondHalf > $firstHalf * 1.5) {
            $trend = 'increasing';
        } elseif ($secondHalf < $firstHalf * 0.5) {
            $trend = 'decreasing';
        }

        return [
            'registration_trend' => $trend,
            'first_half_count' => $firstHalf,
            'second_half_count' => $secondHalf,
        ];
    }
}
