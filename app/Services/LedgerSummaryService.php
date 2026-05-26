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
