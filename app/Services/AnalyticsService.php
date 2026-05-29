<?php

namespace App\Services;

use App\Models\LedgerCategoryDailySummary;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * AnalyticsService — reads ONLY from ledger_category_daily_summaries.
 *
 * Design constraints:
 *   • Zero raw transaction table scans at request time.
 *   • All aggregations are GROUP BY on an indexed summary table → < 5 ms.
 *   • Stateless: every method is pure given its inputs.
 */
class AnalyticsService
{
    /**
     * Build the full analytics payload for the given user and query parameters.
     *
     * @param  array{
     *     filter_type: string,
     *     from_date?: string,
     *     to_date?: string,
     *     account_id?: int|null
     * } $params
     */
    public function getAnalytics(array $params, User $user): array
    {
        [$fromDate, $toDate] = $this->resolveDateRange($params);
        $accountId = isset($params['account_id']) ? (int) $params['account_id'] : null;

        $base = LedgerCategoryDailySummary::query()
            ->where('user_id', $user->id)
            ->whereBetween('summary_date', [$fromDate, $toDate]);

        if ($accountId !== null) {
            $base->where('account_id', $accountId);
        }

        // ── 1. Summary totals (single indexed GROUP BY on type) ──────────────
        $typeTotals = (clone $base)
            ->selectRaw('type, SUM(amount_minor) AS total_minor')
            ->groupBy('type')
            ->pluck('total_minor', 'type');

        $totalIncome  = (int) ($typeTotals['income']  ?? 0);
        $totalExpense = (int) ($typeTotals['expense'] ?? 0);

        // ── 2. Category breakdown (expense only — for donut chart) ───────────
        $categoryRows = (clone $base)
            ->where('type', 'expense')
            ->selectRaw('category_id, category_name, color_hex, SUM(amount_minor) AS cat_total')
            ->groupBy('category_id', 'category_name', 'color_hex')
            ->orderByRaw('SUM(amount_minor) DESC')
            ->get();

        $categoryBreakdown = $this->buildCategoryBreakdown($categoryRows, $totalExpense);

        // ── 3. Trend chart data (expense by day — for bar chart) ─────────────
        $trendRows = (clone $base)
            ->where('type', 'expense')
            ->selectRaw('summary_date, SUM(amount_minor) AS day_total')
            ->groupBy('summary_date')
            ->orderBy('summary_date')
            ->get();

        $trendChartData = $trendRows->map(fn ($row) => [
            'label'       => Carbon::parse($row->summary_date)->format('d/m'),
            'value_minor' => (int) $row->day_total,
        ])->values()->all();

        return [
            'status' => 'success',
            'data'   => [
                'summary' => [
                    'total_income_minor'  => $totalIncome,
                    'total_expense_minor' => $totalExpense,
                ],
                'category_breakdown' => $categoryBreakdown,
                'trend_chart_data'   => $trendChartData,
            ],
        ];
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Resolve the effective date range from the filter params.
     *
     * @return array{string, string} [$fromDate, $toDate] in Y-m-d format
     */
    private function resolveDateRange(array $params): array
    {
        $filterType = $params['filter_type'] ?? '31_days';

        return match ($filterType) {
            '7_days'  => [
                Carbon::today()->subDays(6)->toDateString(),
                Carbon::today()->toDateString(),
            ],
            '31_days' => [
                Carbon::today()->subDays(30)->toDateString(),
                Carbon::today()->toDateString(),
            ],
            'custom' => [
                (string) $params['from_date'],
                (string) $params['to_date'],
            ],
            default  => [
                Carbon::today()->subDays(30)->toDateString(),
                Carbon::today()->toDateString(),
            ],
        };
    }

    /**
     * Build category breakdown array with percentages that always sum to 100.
     *
     * Uses the "largest remainder method" to distribute rounding error.
     */
    private function buildCategoryBreakdown(Collection $rows, int $totalExpense): array
    {
        if ($totalExpense === 0 || $rows->isEmpty()) {
            return [];
        }

        // Step 1 — compute raw float percentages
        $items = $rows->map(fn ($row) => [
            'category_name' => $row->category_name,
            'amount_minor'  => (int) $row->cat_total,
            'color_hex'     => $row->color_hex,
            'raw_pct'       => ($row->cat_total / $totalExpense) * 100,
        ])->all();

        // Step 2 — floor each percentage
        $floored   = array_map(fn ($item) => (int) floor($item['raw_pct']), $items);
        $remainder = 100 - array_sum($floored);

        // Step 3 — give the rounding remainder to items with largest fractional parts
        $fractions = [];
        foreach ($items as $idx => $item) {
            $fractions[] = ['idx' => $idx, 'frac' => $item['raw_pct'] - floor($item['raw_pct'])];
        }
        usort($fractions, fn ($a, $b) => $b['frac'] <=> $a['frac']);

        for ($i = 0; $i < $remainder && $i < count($fractions); $i++) {
            $floored[$fractions[$i]['idx']]++;
        }

        // Step 4 — assemble final output
        return array_values(array_map(fn ($item, $idx) => [
            'category_name' => $item['category_name'],
            'percentage'    => $floored[$idx],
            'amount_minor'  => $item['amount_minor'],
            'color_hex'     => $item['color_hex'],
        ], $items, array_keys($items)));
    }
}
