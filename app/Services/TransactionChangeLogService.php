<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\TransactionChangeLog;
use App\Models\User;

class TransactionChangeLogService
{
    public function logCreate(Transaction $transaction, User $user): void
    {
        TransactionChangeLog::create([
            'transaction_id' => $transaction->id,
            'user_id' => $user->id,
            'action' => 'created',
            'changes' => [
                'new' => $this->getTransactionData($transaction),
            ],
        ]);
    }

    public function logUpdate(Transaction $transaction, User $user, array $oldData): void
    {
        $newData = $this->getTransactionData($transaction);
        $changes = $this->calculateChanges($oldData, $newData);

        if (empty($changes)) {
            return;
        }

        TransactionChangeLog::create([
            'transaction_id' => $transaction->id,
            'user_id' => $user->id,
            'action' => 'updated',
            'changes' => [
                'old' => $oldData,
                'new' => $newData,
                'diff' => $changes,
            ],
        ]);
    }

    public function logDelete(Transaction $transaction, User $user): void
    {
        TransactionChangeLog::create([
            'transaction_id' => $transaction->id,
            'user_id' => $user->id,
            'action' => 'deleted',
            'changes' => [
                'old' => $this->getTransactionData($transaction),
            ],
        ]);
    }

    public function logPhotoAdded(Transaction $transaction, User $user, string $filename): void
    {
        TransactionChangeLog::create([
            'transaction_id' => $transaction->id,
            'user_id' => $user->id,
            'action' => 'photo_added',
            'changes' => [
                'filename' => $filename,
            ],
        ]);
    }

    public function logPhotoRemoved(Transaction $transaction, User $user, string $filename): void
    {
        TransactionChangeLog::create([
            'transaction_id' => $transaction->id,
            'user_id' => $user->id,
            'action' => 'photo_removed',
            'changes' => [
                'filename' => $filename,
            ],
        ]);
    }

    protected function getTransactionData(Transaction $transaction): array
    {
        return [
            'type' => $transaction->type,
            'amount' => $transaction->amount,
            'category_id' => $transaction->category_id,
            'account_id' => $transaction->account_id,
            'notes' => $transaction->notes,
            'transaction_date' => $transaction->transaction_date->format('Y-m-d'),
        ];
    }

    protected function calculateChanges(array $old, array $new): array
    {
        $changes = [];

        foreach ($new as $key => $value) {
            if (!isset($old[$key]) || $old[$key] != $value) {
                $changes[$key] = [
                    'from' => $old[$key] ?? null,
                    'to' => $value,
                ];
            }
        }

        return $changes;
    }
}
