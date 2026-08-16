<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TransactionAnalyticsService
{
    public function dashboard(User $user): array
    {
        $now = now();
        $currentStart = $now->copy()->startOfMonth();
        $currentEnd = $now->copy()->endOfMonth();
        $previousStart = $now->copy()->subMonth()->startOfMonth();
        $previousEnd = $now->copy()->subMonth()->endOfMonth();

        $sum = static fn (string $type, $start, $end) => Transaction::where('user_id', $user->id)
            ->where('type', $type)
            ->whereBetween('transaction_date', [$start, $end])
            ->sum('amount');

        $currentIncome = $sum('income', $currentStart, $currentEnd);
        $currentExpense = $sum('expense', $currentStart, $currentEnd);
        $previousIncome = $sum('income', $previousStart, $previousEnd);
        $previousExpense = $sum('expense', $previousStart, $previousEnd);

        $accounts = Account::where('user_id', $user->id)->get();
        $totalBalance = $accounts->sum('balance');
        $balanceHistory = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i)->endOfMonth()->format('Y-m-d');
            $future = Transaction::where('user_id', $user->id)
                ->whereDate('transaction_date', '>', $date)
                ->select(DB::raw('SUM(CASE WHEN type = "income" THEN amount ELSE -amount END) as net_change'))
                ->first();
            $balanceHistory[] = [
                'date' => $date,
                'balance' => $totalBalance - ($future->net_change ?? 0),
            ];
        }

        $recent = Transaction::where('user_id', $user->id)
            ->select(['id', 'account_id', 'category_id', 'type', 'ledger_type', 'amount', 'amount_minor', 'currency', 'transaction_date', 'created_at'])
            ->with(['category:id,name,slug,icon,color,type', 'account:id,name,currency,icon,color'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->map(static fn (Transaction $transaction) => [
                'id' => $transaction->id,
                'account_id' => $transaction->account_id,
                'category_id' => $transaction->category_id,
                'type' => $transaction->type,
                'ledger_type' => $transaction->ledger_type,
                'amount' => $transaction->amount,
                'amount_minor' => $transaction->amount_minor,
                'currency' => $transaction->currency,
                'transaction_date' => optional($transaction->transaction_date)->toDateString(),
                'created_at' => optional($transaction->created_at)->toIso8601String(),
                'category' => $transaction->category?->only(['id', 'name', 'slug', 'icon', 'color', 'type']),
                'account' => $transaction->account?->only(['id', 'name', 'currency', 'icon', 'color']),
            ])->values();

        return [
            'monthly_summary' => [
                'current' => [
                    'month' => $now->format('F Y'),
                    'income' => $currentIncome,
                    'expense' => $currentExpense,
                    'net' => $currentIncome - $currentExpense,
                ],
                'previous' => [
                    'month' => $now->copy()->subMonth()->format('F Y'),
                    'income' => $previousIncome,
                    'expense' => $previousExpense,
                    'net' => $previousIncome - $previousExpense,
                ],
            ],
            'seven_day_expenses' => Transaction::where('user_id', $user->id)
                ->where('type', 'expense')
                ->whereBetween('transaction_date', [$now->copy()->subDays(6), $now])
                ->select(DB::raw('DATE(transaction_date) as date'), DB::raw('SUM(amount) as total'))
                ->groupBy('date')->orderBy('date')->get(),
            'balance_history' => $balanceHistory,
            'recent_transactions' => $recent,
            'accounts' => $accounts,
        ];
    }
}