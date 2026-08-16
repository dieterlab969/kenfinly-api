<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TransactionQuery
{
    public function paginateForUser(int $userId, array $filters): LengthAwarePaginator
    {
        return Transaction::query()
            ->where('user_id', $userId)
            ->with(['category', 'account'])
            ->when(isset($filters['account_id']), fn ($query) => $query->where('account_id', $filters['account_id']))
            ->when(isset($filters['type']), fn ($query) => $query->where('type', $filters['type']))
            ->when(isset($filters['start_date']), fn ($query) => $query->whereDate('transaction_date', '>=', $filters['start_date']))
            ->when(isset($filters['end_date']), fn ($query) => $query->whereDate('transaction_date', '<=', $filters['end_date']))
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();
    }
}