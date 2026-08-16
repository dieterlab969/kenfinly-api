<?php

namespace App\Services;

use App\Models\Account;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountService
{
    public function listFor(User $user)
    {
        return Account::where('user_id', $user->id)
            ->withCount('transactions')
            ->orderBy('name')
            ->get();
    }

    public function create(User $user, array $payload): Account
    {
        return DB::transaction(fn () => Account::create([
            'user_id' => $user->id,
            'name' => $payload['name'],
            'balance' => $payload['balance'],
            'currency' => $payload['currency'] ?? $this->defaultCurrency(),
            'icon' => $payload['icon'] ?? null,
            'color' => $payload['color'] ?? null,
            'account_type' => $payload['account_type'] ?? 'wallet',
        ]));
    }

    public function findOwned(User $user, int $id, bool $withCount = false): Account
    {
        $query = Account::where('id', $id)->where('user_id', $user->id);
        if ($withCount) {
            $query->withCount('transactions');
        }
        return $query->firstOrFail();
    }

    public function update(Account $account, array $payload): Account
    {
        $account->update(array_intersect_key($payload, array_flip([
            'name', 'currency', 'icon', 'color', 'account_type',
        ])));
        return $account->fresh();
    }

    public function delete(Account $account): void
    {
        DB::transaction(function () use ($account): void {
            if ($account->hasTransactions()) {
                throw new \DomainException('Cannot delete account with existing transactions');
            }
            $account->delete();
        });
    }

    private function defaultCurrency(): string
    {
        return config('currency.locale_currency_map.' . app()->getLocale(), 'USD');
    }
}