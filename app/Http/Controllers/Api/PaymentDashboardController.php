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

class PaymentDashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('admin');
    }

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

    private function getTransactionMetrics($startDate): array
    {
        $subscriptions = Subscription::where('created_at', '>=', $startDate)->get();
        
        $total = count($subscriptions);
        $successful = $subscriptions->where('status', 'active')->count();
        $failed = $subscriptions->where('status', 'failed')->count();
        $refunded = $subscriptions->where('status', 'canceled')->count();

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

    private function getSubscriptionMetrics($startDate): array
    {
        $subscriptions = Subscription::where('created_at', '>=', $startDate)->get();
        $activeCount = Subscription::where('status', 'active')->count();
        $canceledCount = Subscription::where('canceled_at', '>=', $startDate)->count();

        return [
            'total_new' => count($subscriptions),
            'active_total' => $activeCount,
            'canceled_in_period' => $canceledCount,
            'churn_rate' => $activeCount > 0 ? round(($canceledCount / $activeCount) * 100, 2) : 0,
        ];
    }

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

    private function getStartDate($period): Carbon
    {
        return match ($period) {
            'daily' => Carbon::now()->subDay(),
            'weekly' => Carbon::now()->subWeek(),
            'yearly' => Carbon::now()->subYear(),
            default => Carbon::now()->subMonth(),
        };
    }
}
