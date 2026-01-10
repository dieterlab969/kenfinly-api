<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function getSummary(Request $request)
    {
        $userId = auth()->id();
        $accountId = $request->query('account_id');

        $query = Transaction::where('user_id', $userId);

        if ($accountId) {
            $query->where('account_id', $accountId);
        }

        $totalIncome = (clone $query)->where('type', 'income')->sum('amount');
        $totalExpense = (clone $query)->where('type', 'expense')->sum('amount');
        $balance = $totalIncome - $totalExpense;

        return response()->json([
            'total_income' => $totalIncome,
            'total_expense' => $totalExpense,
            'balance' => $balance,
            'transaction_count' => $query->count(),
        ]);
    }

    public function getCategoryBreakdown(Request $request)
    {
        $userId = auth()->id();
        $type = $request->query('type', 'expense');

        $breakdown = Transaction::where('user_id', $userId)
            ->where('type', $type)
            ->select('category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->with('category')
            ->get();

        return response()->json($breakdown);
    }

    public function getTrends(Request $request)
    {
        $userId = auth()->id();
        $months = $request->query('months', 12);

        $trends = Transaction::where('user_id', $userId)
            ->select(
                DB::raw('DATE_FORMAT(transaction_date, "%Y-%m") as month'),
                'type',
                DB::raw('SUM(amount) as total')
            )
            ->where('transaction_date', '>=', now()->subMonths($months))
            ->groupBy('month', 'type')
            ->orderBy('month')
            ->get();

        return response()->json($trends);
    }
}
