<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Transaction;
use App\Models\TransactionPhoto;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Transaction use cases.
 *
 * Every method owns the boundary around the transaction row, account balance,
 * ledger summary, photos, and audit log. Controllers only orchestrate HTTP.
 */
class TransactionService
{
    public function __construct(
        private readonly LedgerSummaryService $ledgerSummary,
        private readonly TransactionPhotoService $photoService,
        private readonly TransactionChangeLogService $changeLogService,
    ) {
    }

    public function create(
        User $user,
        array $payload,
        ?UploadedFile $receipt = null,
        ?Account $authorizedAccount = null
    ): Transaction
    {
        return DB::transaction(function () use ($user, $payload, $receipt, $authorizedAccount): Transaction {
            $account = $authorizedAccount
                ? Account::whereKey($authorizedAccount->id)->lockForUpdate()->firstOrFail()
                : $this->ownedAccount($user, (int) $payload['account_id'], true);
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'account_id' => $account->id,
                'category_id' => $payload['category_id'],
                'type' => $payload['type'],
                'ledger_type' => 'real',
                'amount' => $payload['amount'],
                'amount_minor' => $this->amountMinor($payload['amount']),
                'notes' => $payload['notes'] ?? null,
                'transaction_date' => $payload['transaction_date'],
                'currency' => $account->currency ?? 'VND',
                'source_type' => 'manual',
            ]);

            $this->ledgerSummary->applyTransaction($transaction);
            $this->changeBalance($account, $transaction, 1);
            $this->attachReceipt($transaction, $user, $receipt);
            $this->changeLogService->logCreate($transaction, $user);

            return $transaction->load(['category', 'account', 'photos']);
        });
    }

    public function update(User $user, Transaction $transaction, array $payload, ?UploadedFile $receipt = null): Transaction
    {
        if ($transaction->isImmutable()) {
            throw new \DomainException(
                'Ledger transactions sourced from Halo or system flows are immutable. Use a reversing entry instead.'
            );
        }

        return DB::transaction(function () use ($user, $transaction, $payload, $receipt): Transaction {
            $oldData = [
                'type' => $transaction->type,
                'amount' => (string) $transaction->amount,
                'category_id' => $transaction->category_id,
                'account_id' => $transaction->account_id,
                'notes' => $transaction->notes,
                'transaction_date' => $transaction->transaction_date->format('Y-m-d'),
            ];
            $oldTransaction = clone $transaction;
            $accountIds = array_values(array_unique([
                (int) $transaction->account_id,
                (int) ($payload['account_id'] ?? $transaction->account_id),
            ]));
            sort($accountIds);
            $accounts = Account::whereIn('id', $accountIds)
                ->where('user_id', $user->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $oldAccount = $accounts->get($transaction->account_id);
            $newAccount = $accounts->get($payload['account_id'] ?? $transaction->account_id);
            abort_if(!$oldAccount || !$newAccount, 404);

            $this->ledgerSummary->reverseTransaction($oldTransaction);
            $this->changeBalance($oldAccount, $oldTransaction, -1);

            $data = array_intersect_key($payload, array_flip([
                'account_id', 'category_id', 'type', 'amount', 'notes', 'transaction_date',
            ]));
            if (array_key_exists('amount', $data)) {
                $data['amount_minor'] = $this->amountMinor($data['amount']);
            }
            if ($receipt) {
                if ($transaction->receipt_path) {
                    Storage::disk('public')->delete($transaction->receipt_path);
                }
                $data['receipt_path'] = $receipt->store('receipts', 'public');
            }

            $transaction->fill($data);
            $transaction->save();
            $this->ledgerSummary->applyTransaction($transaction);
            $this->changeBalance($newAccount, $transaction, 1);
            $this->changeLogService->logUpdate($transaction, $user, $oldData);

            return $transaction->load(['category', 'account', 'photos', 'changeLogs']);
        });
    }

    public function delete(User $user, Transaction $transaction): void
    {
        if ($transaction->isImmutable()) {
            throw new \DomainException(
                'Ledger transactions sourced from Halo or system flows cannot be deleted. Use a reversing entry instead.'
            );
        }

        DB::transaction(function () use ($user, $transaction): void {
            $account = $this->ownedAccount($user, (int) $transaction->account_id, true);
            $this->ledgerSummary->reverseTransaction($transaction);
            $this->changeBalance($account, $transaction, -1);
            $this->changeLogService->logDelete($transaction, $user);

            if ($transaction->receipt_path) {
                Storage::disk('public')->delete($transaction->receipt_path);
            }
            foreach ($transaction->photos as $photo) {
                $this->photoService->deletePhoto($photo);
            }
            $transaction->delete();
        });
    }

    private function ownedAccount(User $user, int $accountId, bool $lock = false): Account
    {
        $query = Account::where('id', $accountId)->where('user_id', $user->id);
        if ($lock) {
            $query->lockForUpdate();
        }
        return $query->firstOrFail();
    }

    private function changeBalance(Account $account, Transaction $transaction, int $direction): void
    {
        $delta = $transaction->type === 'income'
            ? (float) $transaction->amount
            : -(float) $transaction->amount;
        $account->increment('balance', $delta * $direction);
    }

    private function amountMinor(mixed $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }

    private function attachReceipt(Transaction $transaction, User $user, ?UploadedFile $receipt): ?TransactionPhoto
    {
        if (!$receipt) {
            return null;
        }

        $photo = $this->photoService->uploadPhoto($transaction, $receipt, $user);
        $this->changeLogService->logPhotoAdded($transaction, $user, $photo->original_filename);
        return $photo;
    }
}