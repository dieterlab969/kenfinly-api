<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $user = auth('api')->user();
        
        $query = Transaction::where('user_id', $user->id)
            ->with(['category', 'account']);

        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('transaction_date', [
                $request->start_date,
                $request->end_date
            ]);
        }

        $transactions = $query->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'transactions' => $transactions
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
            'transaction_date' => 'required|date',
            'receipt' => 'nullable|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth('api')->user();
        
        $account = Account::where('id', $request->account_id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            $receiptPath = null;
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('receipts', 'public');
            }

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'account_id' => $request->account_id,
                'category_id' => $request->category_id,
                'type' => $request->type,
                'amount' => $request->amount,
                'notes' => $request->notes,
                'transaction_date' => $request->transaction_date,
                'receipt_path' => $receiptPath,
            ]);

            $balanceChange = $request->type === 'income' 
                ? $request->amount 
                : -$request->amount;
            
            $account->increment('balance', $balanceChange);

            DB::commit();

            $transaction->load(['category', 'account']);

            return response()->json([
                'success' => true,
                'message' => 'Transaction created successfully',
                'transaction' => $transaction
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($receiptPath) {
                Storage::disk('public')->delete($receiptPath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to create transaction'
            ], 500);
        }
    }

    public function show($id)
    {
        $user = auth('api')->user();
        
        $transaction = Transaction::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['category', 'account'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'transaction' => $transaction
        ]);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'account_id' => 'sometimes|required|exists:accounts,id',
            'category_id' => 'sometimes|required|exists:categories,id',
            'type' => 'sometimes|required|in:income,expense',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
            'transaction_date' => 'sometimes|required|date',
            'receipt' => 'nullable|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth('api')->user();
        
        $transaction = Transaction::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($request->has('account_id')) {
            $newAccount = Account::where('id', $request->account_id)
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        DB::beginTransaction();
        try {
            $oldAmount = $transaction->amount;
            $oldType = $transaction->type;
            $oldAccountId = $transaction->account_id;

            $oldAccount = Account::where('id', $oldAccountId)
                ->where('user_id', $user->id)
                ->firstOrFail();
            $oldBalanceChange = $oldType === 'income' ? -$oldAmount : $oldAmount;
            $oldAccount->increment('balance', $oldBalanceChange);

            if ($request->hasFile('receipt')) {
                if ($transaction->receipt_path) {
                    Storage::disk('public')->delete($transaction->receipt_path);
                }
                $transaction->receipt_path = $request->file('receipt')->store('receipts', 'public');
            }

            $transaction->fill($request->except('receipt'));
            $transaction->save();

            $newAccount = Account::where('id', $transaction->account_id)
                ->where('user_id', $user->id)
                ->firstOrFail();
            $newBalanceChange = $transaction->type === 'income' 
                ? $transaction->amount 
                : -$transaction->amount;
            $newAccount->increment('balance', $newBalanceChange);

            DB::commit();

            $transaction->load(['category', 'account']);

            return response()->json([
                'success' => true,
                'message' => 'Transaction updated successfully',
                'transaction' => $transaction
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update transaction'
            ], 500);
        }
    }

    public function destroy($id)
    {
        $user = auth('api')->user();
        
        $transaction = Transaction::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            $account = Account::findOrFail($transaction->account_id);
            $balanceChange = $transaction->type === 'income' 
                ? -$transaction->amount 
                : $transaction->amount;
            $account->increment('balance', $balanceChange);

            if ($transaction->receipt_path) {
                Storage::disk('public')->delete($transaction->receipt_path);
            }

            $transaction->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaction deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete transaction'
            ], 500);
        }
    }

    public function getDashboardData(Request $request)
    {
        $user = auth('api')->user();
        
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();
        $sevenDaysAgo = $now->copy()->subDays(6);

        $monthlySummary = [
            'income' => Transaction::where('user_id', $user->id)
                ->where('type', 'income')
                ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                ->sum('amount'),
            'expense' => Transaction::where('user_id', $user->id)
                ->where('type', 'expense')
                ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
                ->sum('amount'),
        ];
        $monthlySummary['total'] = $monthlySummary['income'] - $monthlySummary['expense'];

        $sevenDayExpenses = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$sevenDaysAgo, $now])
            ->select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $recentTransactions = Transaction::where('user_id', $user->id)
            ->with(['category', 'account'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get();

        $accounts = Account::where('user_id', $user->id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'monthly_summary' => $monthlySummary,
                'seven_day_expenses' => $sevenDayExpenses,
                'recent_transactions' => $recentTransactions,
                'accounts' => $accounts,
            ]
        ]);
    }
}
