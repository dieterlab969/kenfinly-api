<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TransferController extends Controller
{
    /**
     * Transfer funds between two wallets owned by the authenticated user.
     *
     * Both balance updates and both transaction records are written inside a
     * single ACID database transaction. If either operation fails the whole
     * block is rolled back — preventing money from disappearing or appearing
     * without a matching counterpart.
     *
     * POST /api/v1/accounts/transfer
     * Body: { from_account_id, to_account_id, amount, notes? }
     */
    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_account_id' => ['required', 'integer'],
            'to_account_id'   => ['required', 'integer', 'different:from_account_id'],
            'amount'          => ['required', 'numeric', 'min:0.01'],
            'notes'           => ['nullable', 'string', 'max:200'],
        ], [
            'to_account_id.different' => 'Destination wallet must be different from the source wallet.',
            'amount.min'              => 'Transfer amount must be greater than zero.',
        ]);

        $userId = auth()->id();

        try {
            $result = DB::transaction(function () use ($validated, $userId) {
                // Lock both rows in a consistent order (lower ID first) to
                // prevent deadlocks when two concurrent transfers involve the
                // same pair of accounts in opposite directions.
                $ids = [(int) $validated['from_account_id'], (int) $validated['to_account_id']];
                sort($ids);

                $lockedAccounts = Account::where('user_id', $userId)
                    ->whereIn('id', $ids)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $fromAccount = $lockedAccounts->get((int) $validated['from_account_id']);
                $toAccount   = $lockedAccounts->get((int) $validated['to_account_id']);

                // Ownership / existence check
                if (! $fromAccount || ! $toAccount) {
                    abort(404, 'One or both wallets were not found.');
                }

                $amount = (float) $validated['amount'];

                // Sufficient-funds check
                if ((float) $fromAccount->balance < $amount) {
                    return [
                        'insufficient' => true,
                        'available'    => (float) $fromAccount->balance,
                        'requested'    => $amount,
                    ];
                }

                $today            = now()->toDateString();
                $idempotencyGroup = Str::uuid()->toString();

                // ── Debit record — expense on the source wallet ────────────────
                $debit = Transaction::create([
                    'user_id'         => $userId,
                    'account_id'      => $fromAccount->id,
                    'category_id'     => null,          // transfers have no category
                    'type'            => 'expense',
                    'ledger_type'     => 'real',
                    'source_type'     => 'adjustment',  // marks record as immutable
                    'amount'          => $amount,
                    'notes'           => $validated['notes'] ?? null,
                    'transaction_date' => $today,
                    'currency'        => $fromAccount->currency ?? 'VND',
                    'idempotency_key' => $idempotencyGroup . '-debit',
                ]);

                // ── Credit record — income on the destination wallet ───────────
                $credit = Transaction::create([
                    'user_id'         => $userId,
                    'account_id'      => $toAccount->id,
                    'category_id'     => null,
                    'type'            => 'income',
                    'ledger_type'     => 'real',
                    'source_type'     => 'adjustment',
                    'amount'          => $amount,
                    'notes'           => $validated['notes'] ?? null,
                    'transaction_date' => $today,
                    'currency'        => $toAccount->currency ?? 'VND',
                    'idempotency_key' => $idempotencyGroup . '-credit',
                ]);

                // ── Cross-link the paired records ──────────────────────────────
                $debit->update(['transfer_pair_id'  => $credit->id]);
                $credit->update(['transfer_pair_id' => $debit->id]);

                // ── Atomic balance updates ─────────────────────────────────────
                // Using increment/decrement keeps the balance accurate even
                // under concurrent requests.
                $fromAccount->decrement('balance', $amount);
                $toAccount->increment('balance', $amount);

                Log::info('Wallet transfer completed', [
                    'user_id'       => $userId,
                    'from_account'  => $fromAccount->id,
                    'to_account'    => $toAccount->id,
                    'amount'        => $amount,
                    'debit_txn_id'  => $debit->id,
                    'credit_txn_id' => $credit->id,
                ]);

                return [
                    'insufficient'  => false,
                    'from_account'  => $fromAccount->fresh(),
                    'to_account'    => $toAccount->fresh(),
                    'amount'        => $amount,
                    'debit_txn_id'  => $debit->id,
                    'credit_txn_id' => $credit->id,
                ];
            });

            // Insufficient balance — return 422 so the client shows the warning
            if ($result['insufficient']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient balance in source wallet.',
                    'errors'  => [
                        'amount' => [
                            sprintf(
                                'Wallet balance is %.2f. Transfer of %.2f is not possible.',
                                $result['available'],
                                $result['requested']
                            ),
                        ],
                    ],
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Transfer completed successfully.',
                'data'    => [
                    'amount'          => $result['amount'],
                    'debit_txn_id'    => $result['debit_txn_id'],
                    'credit_txn_id'   => $result['credit_txn_id'],
                    'from_account'    => [
                        'id'      => $result['from_account']->id,
                        'name'    => $result['from_account']->name,
                        'balance' => (float) $result['from_account']->balance,
                    ],
                    'to_account'      => [
                        'id'      => $result['to_account']->id,
                        'name'    => $result['to_account']->name,
                        'balance' => (float) $result['to_account']->balance,
                    ],
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Wallet transfer failed', [
                'user_id' => $userId,
                'error'   => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Transfer failed due to a server error. No balances were changed.',
            ], 500);
        }
    }
}
