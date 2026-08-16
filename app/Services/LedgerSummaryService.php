<?php

namespace App\Services;

use App\Models\LedgerDailySummary;
use App\Models\Transaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Standard 4 — Real-Time Ledger Rollup (Write-Time Summary).
 *
 * Every transaction write must atomically update `ledger_daily_summaries` so that
 * dashboards never have to scan raw transactions for SUM().
 *
 * Must be called from within the same DB::transaction() as the Transaction insert.
 */
class LedgerSummaryService
{
    /**
     * Remove a transaction's contribution from the daily rollup.
     *
     * This is used by update/delete use cases inside their outer database
     * transaction so the raw ledger and its summary cannot drift apart.
     */
    public function reverseTransaction(Transaction $transaction): void
    {
        $userId = (int) $transaction->user_id;
        $ledgerType = $transaction->ledger_type ?: 'real';
        $summaryDate = $transaction->transaction_date instanceof Carbon
            ? $transaction->transaction_date->toDateString()
            : (string) $transaction->transaction_date;
        $amountMinor = $this->resolveAmountMinor($transaction);
        // API transactions store amount as an absolute value; the type is the
        // source of truth for real-ledger income versus expense. Halo/system
        // rows without a type may still use the sign of amount_minor.
        $isIncome = $transaction->type === 'income'
            || ($transaction->type !== 'expense' && $amountMinor > 0);
        $absolute = abs($amountMinor);

        DB::transaction(function () use (
            $userId,
            $ledgerType,
            $summaryDate,
            $isIncome,
            $absolute
        ): void {
            $summary = LedgerDailySummary::where([
                'user_id' => $userId,
                'ledger_type' => $ledgerType,
                'summary_date' => $summaryDate,
            ])->lockForUpdate()->first();

            if (!$summary) {
                return;
            }

            $summary->income_minor = max(0, (int) $summary->income_minor - ($isIncome ? $absolute : 0));
            $summary->expense_minor = max(0, (int) $summary->expense_minor - ($isIncome ? 0 : $absolute));
            $summary->net_minor = (int) $summary->income_minor - (int) $summary->expense_minor;
            $summary->transaction_count = max(0, (int) $summary->transaction_count - 1);
            $summary->save();
        });
    }

    public function applyTransaction(Transaction $transaction): LedgerDailySummary
    {
        $userId = (int) $transaction->user_id;
        $ledgerType = $transaction->ledger_type ?: 'real';
        $summaryDate = $transaction->transaction_date instanceof Carbon
            ? $transaction->transaction_date->toDateString()
            : (string) $transaction->transaction_date;

        $amountMinor = $this->resolveAmountMinor($transaction);
        if ($amountMinor === 0) {
            return $this->touchSummary($userId, $ledgerType, $summaryDate);
        }

        $isIncome = $transaction->type === 'income' || $amountMinor > 0;
        $absolute = abs($amountMinor);
        $incomeDelta = $isIncome ? $absolute : 0;
        $expenseDelta = $isIncome ? 0 : $absolute;
        $netDelta = $isIncome ? $absolute : -$absolute;

        return DB::transaction(function () use (
            $userId,
            $ledgerType,
            $summaryDate,
            $incomeDelta,
            $expenseDelta,
            $netDelta
        ) {
            $summary = LedgerDailySummary::where([
                'user_id' => $userId,
                'ledger_type' => $ledgerType,
                'summary_date' => $summaryDate,
            ])->lockForUpdate()->first();

            if (!$summary) {
                $summary = LedgerDailySummary::create([
                    'user_id' => $userId,
                    'ledger_type' => $ledgerType,
                    'summary_date' => $summaryDate,
                    'income_minor' => $incomeDelta,
                    'expense_minor' => $expenseDelta,
                    'net_minor' => $netDelta,
                    'transaction_count' => 1,
                ]);

                return $summary;
            }

            $summary->income_minor += $incomeDelta;
            $summary->expense_minor += $expenseDelta;
            $summary->net_minor += $netDelta;
            $summary->transaction_count += 1;
            $summary->save();

            return $summary;
        });
    }

    private function touchSummary(int $userId, string $ledgerType, string $summaryDate): LedgerDailySummary
    {
        return LedgerDailySummary::firstOrCreate(
            [
                'user_id' => $userId,
                'ledger_type' => $ledgerType,
                'summary_date' => $summaryDate,
            ],
            [
                'income_minor' => 0,
                'expense_minor' => 0,
                'net_minor' => 0,
                'transaction_count' => 0,
            ]
        );
    }

    private function resolveAmountMinor(Transaction $transaction): int
    {
        if ($transaction->amount_minor !== null) {
            return (int) $transaction->amount_minor;
        }

        $signed = (float) $transaction->amount;
        return (int) round($signed * 100);
    }
}
