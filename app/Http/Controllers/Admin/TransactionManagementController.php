<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::with(['user', 'account', 'category', 'photos', 'changeLogs']);

        if ($request->has('user_email')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('email', 'like', "%{$request->user_email}%");
            });
        }

        if ($request->has('date_from')) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        $perPage = $request->get('per_page', 15);
        $transactions = $query->latest('transaction_date')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    public function show(string $id)
    {
        $transaction = Transaction::with([
            'user', 
            'account', 
            'category', 
            'photos', 
            'changeLogs.user'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $transaction
        ]);
    }
}
