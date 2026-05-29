<?php

namespace App\Observers;

use App\Models\LedgerCategoryDailySummary;
use App\Models\Transaction;
use Illuminate\Support\Carbon;

/**
 * TransactionObserver — write-time rollup into ledger_category_daily_summaries.
 *
 * Keeps the analytics summary table in sync atomically.
 * Each mutation is a single indexed upsert + atomic increment/decrement —
 * never a full table recalculation.
 */
class TransactionObserver
{
    /**
     * Fields that affect the summary row's identity or value.
     */
    private const IMPACT_FIELDS = [
        'amount', 'amount_minor', 'type', 'category_id',
        'account_id', 'transaction_date', 'user_id',
    ];

    public function created(Transaction $transaction): void
    {
        $this->applyDelta($transaction, +1);
    }

    public function updated(Transaction $transaction): void
    {
        // Only process if a field that affects the summary actually changed
        $dirty = array_intersect(array_keys($transaction->getDirty()), self::IMPACT_FIELDS);
        if (empty($dirty)) {
            return;
        }

        // Roll back the OLD values
        $this->applyDeltaFromRaw(
            userId:      (int) $transaction->getOriginal('user_id'),
            accountId:   (int) $transaction->getOriginal('account_id'),
            categoryId:  $transaction->getOriginal('category_id'),
            type:        (string) $transaction->getOriginal('type'),
            date:        Carbon::parse($transaction->getOriginal('transaction_date'))->toDateString(),
            amountMinor: $this->resolveOriginalMinor($transaction),
            delta:       -1,
            catName:     null,
            colorHex:    null,
        );

        // Apply the NEW values
        $this->applyDelta($transaction, +1);
    }

    public function deleted(Transaction $transaction): void
    {
        $this->applyDelta($transaction, -1);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function applyDelta(Transaction $transaction, int $sign): void
    {
        $category = $transaction->relationLoaded('category')
            ? $transaction->category
            : $transaction->category()->first();

        $this->applyDeltaFromRaw(
            userId:      $transaction->user_id,
            accountId:   $transaction->account_id,
            categoryId:  $transaction->category_id,
            type:        $transaction->type,
            date:        Carbon::parse($transaction->transaction_date)->toDateString(),
            amountMinor: $this->resolveMinor($transaction),
            delta:       $sign,
            catName:     $category?->name ?? 'Uncategorized',
            colorHex:    $category?->color ?? '#6B7280',
        );
    }

    private function applyDeltaFromRaw(
        int $userId,
        int $accountId,
        ?int $categoryId,
        string $type,
        string $date,
        int $amountMinor,
        int $delta,
        ?string $catName,
        ?string $colorHex,
    ): void {
        $key = [
            'user_id'      => $userId,
            'account_id'   => $accountId,
            'category_id'  => $categoryId,
            'type'         => $type,
            'summary_date' => $date,
        ];

        // Ensure the row exists before incrementing
        LedgerCategoryDailySummary::firstOrCreate($key, array_merge($key, [
            'category_name' => $catName ?? 'Uncategorized',
            'color_hex'     => $colorHex ?? '#6B7280',
            'amount_minor'  => 0,
            'tx_count'      => 0,
        ]));

        // Atomic update — no race conditions on single-row ops
        LedgerCategoryDailySummary::where($key)->update([
            'amount_minor' => \Illuminate\Support\Facades\DB::raw("amount_minor + " . ($delta * $amountMinor)),
            'tx_count'     => \Illuminate\Support\Facades\DB::raw("tx_count + " . $delta),
        ]);

        // Clean up zero-balance rows (optional hygiene — keeps the table lean)
        LedgerCategoryDailySummary::where($key)
            ->where('tx_count', '<=', 0)
            ->where('amount_minor', '<=', 0)
            ->delete();
    }

    private function resolveMinor(Transaction $transaction): int
    {
        if ($transaction->amount_minor !== null) {
            return (int) $transaction->amount_minor;
        }

        return (int) round((float) $transaction->amount * 100);
    }

    private function resolveOriginalMinor(Transaction $transaction): int
    {
        $origMinor = $transaction->getOriginal('amount_minor');
        if ($origMinor !== null) {
            return (int) $origMinor;
        }

        return (int) round((float) $transaction->getOriginal('amount') * 100);
    }
}
