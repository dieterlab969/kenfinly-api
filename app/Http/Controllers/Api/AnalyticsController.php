<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Financial analytics and reporting for the authenticated user.
 *
 * @tags Analytics
 */
class AnalyticsController extends Controller
{
    private const VALID_RANGE_TYPES = ['TODAY', '7_DAYS', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR', 'CUSTOM'];

    /** Redis TTL by range type (seconds). Shorter TTL for intra-day ranges. */
    private const CACHE_TTL = [
        'TODAY'      => 60,
        '7_DAYS'     => 300,
        'THIS_MONTH' => 300,
        'LAST_MONTH' => 3600,
        'THIS_YEAR'  => 3600,
        'CUSTOM'     => 300,
    ];

    // ── New Analytics Summary endpoint (spec: GET /api/v1/analytics/summary) ──

    /**
     * Return a full analytics summary for a date range.
     *
     * Checks Redis first (key: analytics:user:{id}:range:{type}).
     * On miss: computes from raw transactions, stores result, returns data.
     *
     * @queryParam range_type string TODAY|7_DAYS|THIS_MONTH|LAST_MONTH|THIS_YEAR|CUSTOM. Default: THIS_MONTH
     * @queryParam start_date string Required when range_type=CUSTOM. Format: Y-m-d
     * @queryParam end_date   string Required when range_type=CUSTOM. Format: Y-m-d
     */
    public function summary(Request $request): JsonResponse
    {
        $userId    = (int) auth()->id();
        $rangeType = strtoupper($request->query('range_type', 'THIS_MONTH'));

        if (!in_array($rangeType, self::VALID_RANGE_TYPES, true)) {
            $rangeType = 'THIS_MONTH';
        }

        // Build cache key per spec
        $cacheKey = "analytics:user:{$userId}:range:{$rangeType}";
        $customStart = null;
        $customEnd   = null;

        if ($rangeType === 'CUSTOM') {
            $customStart = $request->query('start_date', Carbon::now()->startOfMonth()->toDateString());
            $customEnd   = $request->query('end_date',   Carbon::now()->toDateString());
            $cacheKey   .= ":{$customStart}:{$customEnd}";
        }

        // Cache hit → return immediately (<50 ms target)
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json($cached);
        }

        // Resolve date windows
        [$currentStart, $currentEnd, $previousStart, $previousEnd] =
            $this->resolveDateRanges($rangeType, $customStart, $customEnd);

        $data = [
            'range_type'     => $rangeType,
            'start_date'     => $currentStart->toDateString(),
            'end_date'       => $currentEnd->toDateString(),
            'overview'       => $this->buildOverview($userId, $currentStart, $currentEnd, $previousStart, $previousEnd),
            'charts'         => $this->buildCharts($userId, $currentStart, $currentEnd, $rangeType),
            'top_categories' => $this->buildTopCategories($userId, $currentStart, $currentEnd),
        ];

        $ttl = self::CACHE_TTL[$rangeType] ?? 300;
        Cache::put($cacheKey, $data, $ttl);

        return response()->json($data);
    }

    // ── Date range helpers ─────────────────────────────────────────────────────

    private function resolveDateRanges(string $rangeType, ?string $customStart, ?string $customEnd): array
    {
        $now = Carbon::now();

        switch ($rangeType) {
            case 'TODAY':
                return [
                    $now->copy()->startOfDay(),
                    $now->copy()->endOfDay(),
                    $now->copy()->subDay()->startOfDay(),
                    $now->copy()->subDay()->endOfDay(),
                ];

            case '7_DAYS':
                return [
                    $now->copy()->subDays(6)->startOfDay(),
                    $now->copy()->endOfDay(),
                    $now->copy()->subDays(13)->startOfDay(),
                    $now->copy()->subDays(7)->endOfDay(),
                ];

            case 'THIS_MONTH':
                return [
                    $now->copy()->startOfMonth()->startOfDay(),
                    $now->copy()->endOfMonth()->endOfDay(),
                    $now->copy()->subMonth()->startOfMonth()->startOfDay(),
                    $now->copy()->subMonth()->endOfMonth()->endOfDay(),
                ];

            case 'LAST_MONTH':
                $lm = $now->copy()->subMonth();
                return [
                    $lm->copy()->startOfMonth()->startOfDay(),
                    $lm->copy()->endOfMonth()->endOfDay(),
                    $lm->copy()->subMonth()->startOfMonth()->startOfDay(),
                    $lm->copy()->subMonth()->endOfMonth()->endOfDay(),
                ];

            case 'THIS_YEAR':
                return [
                    $now->copy()->startOfYear()->startOfDay(),
                    $now->copy()->endOfYear()->endOfDay(),
                    $now->copy()->subYear()->startOfYear()->startOfDay(),
                    $now->copy()->subYear()->endOfYear()->endOfDay(),
                ];

            default: // CUSTOM
                $cs       = Carbon::parse($customStart ?? $now->copy()->startOfMonth()->toDateString())->startOfDay();
                $ce       = Carbon::parse($customEnd   ?? $now->toDateString())->endOfDay();
                $diffDays = max(1, (int) $cs->diffInDays($ce));
                return [
                    $cs,
                    $ce,
                    $cs->copy()->subDays($diffDays + 1)->startOfDay(),
                    $cs->copy()->subDay()->endOfDay(),
                ];
        }
    }

    // ── Overview (MoM) ─────────────────────────────────────────────────────────

    private function buildOverview(int $userId, Carbon $cs, Carbon $ce, Carbon $ps, Carbon $pe): array
    {
        $aggregate = function (Carbon $start, Carbon $end) use ($userId): array {
            $row = Transaction::where('user_id', $userId)
                ->whereBetween('transaction_date', [$start->toDateString(), $end->toDateString()])
                ->selectRaw("
                    COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
                    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
                ")
                ->first();

            $income  = (float) ($row->income  ?? 0);
            $expense = (float) ($row->expense ?? 0);
            return compact('income', 'expense');
        };

        $cur = $aggregate($cs, $ce);
        $prv = $aggregate($ps, $pe);

        return [
            'current'  => [
                'income'  => $cur['income'],
                'expense' => $cur['expense'],
                'net'     => $cur['income'] - $cur['expense'],
            ],
            'previous' => [
                'income'  => $prv['income'],
                'expense' => $prv['expense'],
                'net'     => $prv['income'] - $prv['expense'],
            ],
            'mom_income_change_pct'  => $prv['income']  > 0
                ? round(($cur['income']  - $prv['income'])  / $prv['income']  * 100, 1)
                : null,
            'mom_expense_change_pct' => $prv['expense'] > 0
                ? round(($cur['expense'] - $prv['expense']) / $prv['expense'] * 100, 1)
                : null,
        ];
    }

    // ── Chart data ─────────────────────────────────────────────────────────────

    private function buildCharts(int $userId, Carbon $cs, Carbon $ce, string $rangeType): array
    {
        $diffDays = (int) $cs->diffInDays($ce);
        $driver   = DB::connection()->getDriverName();

        // Choose grouping granularity
        if ($diffDays > 365 * 3) {
            $part = 'quarter';
        } elseif ($diffDays > 90 || $rangeType === 'THIS_YEAR') {
            $part = 'month';
        } else {
            $part = 'day';
        }

        $selectExpr = $this->dateTruncExpr($driver, $part, 'transaction_date');

        $rows = Transaction::where('user_id', $userId)
            ->whereBetween('transaction_date', [$cs->toDateString(), $ce->toDateString()])
            ->selectRaw("
                {$selectExpr} AS period,
                COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
            ")
            ->groupByRaw($selectExpr)
            ->orderByRaw($selectExpr)
            ->get();

        return $rows->map(fn ($row) => [
            'label'   => $this->formatPeriodLabel((string) $row->period, $part),
            'income'  => (float) $row->income,
            'expense' => (float) $row->expense,
            'savings' => (float) $row->income - (float) $row->expense,
        ])->values()->all();
    }

    private function dateTruncExpr(string $driver, string $part, string $column): string
    {
        if ($driver === 'pgsql') {
            return match ($part) {
                'quarter' => "TO_CHAR(DATE_TRUNC('quarter', {$column}::date), 'YYYY-MM-DD')",
                'month'   => "TO_CHAR(DATE_TRUNC('month',   {$column}::date), 'YYYY-MM-DD')",
                default   => "{$column}::date::text",
            };
        }

        // MySQL fallback
        return match ($part) {
            'quarter' => "DATE_FORMAT(DATE_SUB({$column}, INTERVAL ((MONTH({$column})-1) MOD 3) MONTH), '%Y-%m-01')",
            'month'   => "DATE_FORMAT({$column}, '%Y-%m-01')",
            default   => "DATE_FORMAT({$column}, '%Y-%m-%d')",
        };
    }

    private function formatPeriodLabel(string $period, string $part): string
    {
        try {
            $date = Carbon::parse($period);
            return match ($part) {
                'quarter' => 'Q' . (int) ceil($date->month / 3) . '/' . $date->year,
                'month'   => $date->format('m/Y'),
                default   => $date->format('d/m'),
            };
        } catch (\Throwable) {
            return $period;
        }
    }

    // ── Top categories ─────────────────────────────────────────────────────────

    private function buildTopCategories(int $userId, Carbon $cs, Carbon $ce): array
    {
        $rows = Transaction::where('user_id', $userId)
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$cs->toDateString(), $ce->toDateString()])
            ->selectRaw('category_id, COALESCE(SUM(amount), 0) AS total_spend, COUNT(*) AS transaction_count')
            ->groupBy('category_id')
            ->orderByRaw('total_spend DESC')
            ->limit(10)
            ->with('category:id,name,icon,color')
            ->get();

        $grandTotal = $rows->sum(fn ($r) => (float) $r->total_spend);

        if ($grandTotal <= 0) {
            return [];
        }

        $items = $rows->map(fn ($row) => [
            'id'                => (int) $row->category_id,
            'name'              => $row->category->name  ?? 'Khác',
            'icon'              => $row->category->icon  ?? '📊',
            'color'             => $row->category->color ?? '#7B51F1',
            'total_spend'       => (float) $row->total_spend,
            'transaction_count' => (int) $row->transaction_count,
            'percentage_spend'  => (int) round((float) $row->total_spend / $grandTotal * 100),
        ])->values()->all();

        // Guarantee percentage sum = 100 (FR-ANL spec)
        $sumPct = (int) array_sum(array_column($items, 'percentage_spend'));
        if ($sumPct !== 100 && count($items) > 0) {
            $maxIdx = 0;
            foreach ($items as $idx => $item) {
                if ($item['total_spend'] > $items[$maxIdx]['total_spend']) {
                    $maxIdx = $idx;
                }
            }
            $items[$maxIdx]['percentage_spend'] += (100 - $sumPct);
        }

        return $items;
    }

    // ── Legacy endpoints (kept for backwards compatibility) ────────────────────

    /**
     * Get a financial summary (total income, expenses, net balance).
     *
     * @queryParam account_id int Filter by a specific account ID. Example: 1
     */
    public function getSummary(Request $request): JsonResponse
    {
        $userId    = auth()->id();
        $accountId = $request->query('account_id');

        $query = Transaction::where('user_id', $userId);

        if ($accountId) {
            $query->where('account_id', $accountId);
        }

        $totalIncome  = (clone $query)->where('type', 'income')->sum('amount');
        $totalExpense = (clone $query)->where('type', 'expense')->sum('amount');

        return response()->json([
            'total_income'      => $totalIncome,
            'total_expense'     => $totalExpense,
            'balance'           => $totalIncome - $totalExpense,
            'transaction_count' => $query->count(),
        ]);
    }

    public function getCategoryBreakdown(Request $request): JsonResponse
    {
        $userId = auth()->id();
        $type   = $request->query('type', 'expense');

        $breakdown = Transaction::where('user_id', $userId)
            ->where('type', $type)
            ->select('category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->with('category')
            ->get();

        return response()->json($breakdown);
    }

    public function getTrends(Request $request): JsonResponse
    {
        $userId = auth()->id();
        $months = (int) $request->query('months', 12);

        $driver  = DB::connection()->getDriverName();
        $monthFn = $driver === 'pgsql'
            ? "TO_CHAR(transaction_date::date, 'YYYY-MM')"
            : "DATE_FORMAT(transaction_date, '%Y-%m')";

        $trends = Transaction::where('user_id', $userId)
            ->selectRaw("{$monthFn} as month, type, SUM(amount) as total")
            ->where('transaction_date', '>=', now()->subMonths($months))
            ->groupByRaw("{$monthFn}, type")
            ->orderByRaw("{$monthFn}")
            ->get();

        return response()->json($trends);
    }
}
