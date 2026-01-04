<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\PaymentGateway;
use App\Models\PaymentGatewayAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Controller to provide payment dashboard metrics and overview.
 *
 * Provides aggregated data on transactions, gateways, subscriptions,
 * recent transactions, and system alerts for super admin users.
 */
class PaymentDashboardController extends Controller
{
    /**
     * PaymentDashboardController constructor.
     * Applies authentication and super admin middleware.
     */
    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('super_admin');
    }

    /**
     * Returns an overview of payment-related metrics based on the requested period.
     *
     * @param Request $request HTTP request containing optional 'period' query parameter.
     * @return JsonResponse JSON response containing transactions, gateways, subscriptions,
     * recent transactions, and alerts.
     */
    public function overview(Request $request): JsonResponse
    {
        $period = $request->get('period', 'monthly');
        $startDate = $this->getStartDate($period);

        return response()->json([
            'transactions' => $this->getTransactionMetrics($startDate),
            'gateways' => $this->getGatewayStatus(),
            'subscriptions' => $this->getSubscriptionMetrics($startDate),
            'recent_transactions' => $this->getRecentTransactions(),
            'alerts' => $this->getAlerts(),
        ]);
    }

    /**
     * Calculate transaction metrics since the given start date.
     *
     * @param Carbon $startDate The start date for filtering transactions.
     * @return array Metrics including total, success rate, failure rate, refund rate, and counts.
     */
    private function getTransactionMetrics(Carbon $startDate): array
    {
        $metrics = Subscription::where('created_at', '>=', $startDate)
            ->selectRaw('
                COUNT(*) as total,
                COUNT(CASE WHEN status = "active" THEN 1 END) as successful,
                COUNT(CASE WHEN status = "failed" THEN 1 END) as failed,
                COUNT(CASE WHEN status = "canceled" THEN 1 END) as refunded
            ')
            ->first();

        $total = $metrics->total;
        $successful = $metrics->successful;
        $failed = $metrics->failed;
        $refunded = $metrics->refunded;

        return [
            'total' => $total,
            'success_rate' => $total > 0 ? round(($successful / $total) * 100, 2) : 0,
            'failure_rate' => $total > 0 ? round(($failed / $total) * 100, 2) : 0,
            'refund_rate' => $total > 0 ? round(($refunded / $total) * 100, 2) : 0,
            'successful_count' => $successful,
            'failed_count' => $failed,
            'refunded_count' => $refunded,
        ];
    }

    /**
     * Retrieve status and uptime information for all payment gateways.
     *
     * Uptime is calculated based on audit logs over the past 7 days.
     *
     * @return array List of gateways with status, uptime, error counts, and credential counts.
     */
    private function getGatewayStatus(): array
    {
        return PaymentGateway::with('credentials')
            ->get()
            ->map(function ($gateway) {
                $auditLogs = PaymentGatewayAuditLog::where('payment_gateway_id', $gateway->id)
                    ->where('created_at', '>=', Carbon::now()->subDays(7))
                    ->get();

                $errors = $auditLogs->filter(fn($log) => $log->action === 'error')->count();
                $totalActions = $auditLogs->count();
                $uptime = $totalActions > 0 ? round((($totalActions - $errors) / $totalActions) * 100, 2) : 100;

                return [
                    'id' => $gateway->id,
                    'name' => $gateway->name,
                    'is_active' => $gateway->is_active,
                    'environment' => $gateway->environment,
                    'status' => $gateway->is_active ? 'active' : 'inactive',
                    'uptime' => $uptime,
                    'error_count_7d' => $errors,
                    'total_actions_7d' => $totalActions,
                    'credentials_count' => $gateway->credentials->count(),
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Calculate subscription metrics since the given start date.
     *
     * Includes total new subscriptions, active count, canceled count, and churn rate.
     *
     * @param Carbon $startDate The start date for filtering subscriptions.
     * @return array Subscription metrics.
     */
    private function getSubscriptionMetrics(Carbon $startDate): array
    {
        $newCount = Subscription::where('created_at', '>=', $startDate)->count();
        $activeCount = Subscription::where('status', 'active')->count();
        $canceledCount = Subscription::where('canceled_at', '>=', $startDate)->count();

        return [
            'total_new' => $newCount,
            'active_total' => $activeCount,
            'canceled_in_period' => $canceledCount,
            'churn_rate' => $activeCount > 0 ? round(($canceledCount / $activeCount) * 100, 2) : 0,
        ];
    }

    /**
     * Retrieve the 10 most recent subscription transactions with related user, plan, and gateway info.
     *
     * @return array List of recent transactions.
     */
    private function getRecentTransactions(): array
    {
        return Subscription::with('user', 'plan', 'gateway')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($subscription) {
                return [
                    'id' => $subscription->id,
                    'user_name' => $subscription->user->name,
                    'plan_name' => $subscription->plan->name ?? 'N/A',
                    'amount' => $subscription->amount,
                    'currency' => $subscription->currency,
                    'status' => $subscription->status,
                    'gateway' => $subscription->gateway->name ?? 'N/A',
                    'date' => $subscription->created_at->toIso8601String(),
                ];
            })
            ->toArray();
    }

    /**
     * Generate alerts based on inactive gateways, failed transactions, and unverified credentials.
     *
     * @return array List of alert messages with type, title, message, and severity.
     */
    private function getAlerts(): array
    {
        $alerts = [];

        $inactiveGateways = PaymentGateway::where('is_active', false)->count();
        if ($inactiveGateways > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Inactive Gateways',
                'message' => "{$inactiveGateways} payment gateway(s) are inactive",
                'severity' => 'medium',
            ];
        }

        $failedSubscriptions = Subscription::where('status', 'failed')
            ->where('created_at', '>=', Carbon::now()->subDays(1))
            ->count();
        if ($failedSubscriptions > 0) {
            $alerts[] = [
                'type' => 'error',
                'title' => 'Failed Transactions',
                'message' => "{$failedSubscriptions} transaction(s) failed in the last 24 hours",
                'severity' => 'high',
            ];
        }

        $credentialsNeedingVerification = DB::table('payment_gateway_credentials')
            ->where('verified', false)
            ->count();
        if ($credentialsNeedingVerification > 0) {
            $alerts[] = [
                'type' => 'info',
                'title' => 'Unverified Credentials',
                'message' => "{$credentialsNeedingVerification} credential(s) need verification",
                'severity' => 'low',
            ];
        }

        return $alerts;
    }

    /**
     * Determine the start date based on the requested period.
     *
     * Supported periods: daily, weekly, monthly (default), yearly.
     *
     * @param string $period The period string.
     * @return Carbon The calculated start date.
     */
    private function getStartDate(string $period): Carbon
    {
        return match ($period) {
            'daily' => Carbon::now()->subDay(),
            'weekly' => Carbon::now()->subWeek(),
            'yearly' => Carbon::now()->subYear(),
            default => Carbon::now()->subMonth(),
        };
    }
}
