<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHaloTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Account;
use App\Models\Transaction;
use App\Services\LedgerSummaryService;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Halo-aware ledger transactions (rewards, deductions, and point events).
 *
 * Immutable ledger — only POST and GET are exposed (no PUT/DELETE).
 * Duplicate prevention via UNIQUE(user_id, idempotency_key).
 * Money is represented as integer minor units (`amount_minor`).
 *
 * @tags Halo — Transactions
 */
class HaloTransactionController extends Controller
{
    public function __construct(private readonly LedgerSummaryService $ledgerSummary)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $query = Transaction::where('user_id', $user->id)
            ->with(['category', 'account']);

        if ($ledgerType = $request->query('ledger_type')) {
            $query->where('ledger_type', $ledgerType);
        }
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }
        if ($start = $request->query('start_date')) {
            $query->where('transaction_date', '>=', $start);
        }
        if ($end = $request->query('end_date')) {
            $query->where('transaction_date', '<=', $end);
        }

        $perPage = (int) $request->query('per_page', 25);
        $perPage = max(1, min(100, $perPage));

        $page = $query->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->cursorPaginate($perPage);

        return response()->json([
            'success' => true,
            'data' => TransactionResource::collection($page),
            'next_cursor' => $page->nextCursor()?->encode(),
            'prev_cursor' => $page->previousCursor()?->encode(),
        ]);
    }

    public function store(StoreHaloTransactionRequest $request): JsonResponse
    {
        $user = auth('api')->user();
        $validated = $request->validated();

        $account = Account::where('id', $validated['account_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        $amountMinor = (int) $validated['amount_minor'];
        $type = $validated['type'];
        if ($type === 'income' && $amountMinor < 0) {
            $amountMinor = abs($amountMinor);
        } elseif ($type === 'expense' && $amountMinor < 0) {
            $amountMinor = abs($amountMinor);
        }

        $idempotencyKey = $validated['idempotency_key']
            ?? hash('sha256', json_encode([
                'user' => $user->id,
                'account' => $account->id,
                'category' => $validated['category_id'],
                'amount_minor' => $amountMinor,
                'type' => $type,
                'date' => $validated['transaction_date'],
                'notes' => $validated['notes'] ?? null,
            ]));

        try {
            $transaction = DB::transaction(function () use ($validated, $user, $account, $amountMinor, $type, $idempotencyKey) {
                $existing = Transaction::where('user_id', $user->id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();
                if ($existing) {
                    return $existing;
                }

                $transactionDate = CarbonImmutable::parse($validated['transaction_date'])->utc()->toDateString();

                $row = Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $account->id,
                    'category_id' => $validated['category_id'],
                    'type' => $type,
                    'ledger_type' => $validated['ledger_type'] ?? 'real',
                    'amount' => $amountMinor / 100,
                    'amount_minor' => $amountMinor,
                    'notes' => $validated['notes'] ?? null,
                    'transaction_date' => $transactionDate,
                    'currency' => $validated['currency'] ?? $account->currency ?? 'VND',
                    'source_type' => 'manual',
                    'idempotency_key' => $idempotencyKey,
                ]);

                $balanceDelta = $type === 'income' ? $amountMinor : -$amountMinor;
                $account->increment('balance', $balanceDelta);

                $this->ledgerSummary->applyTransaction($row);

                return $row;
            });
        } catch (QueryException $e) {
            // Standard 6 — duplicate idempotency_key under concurrent submit.
            if ($this->isDuplicateKeyError($e)) {
                $existing = Transaction::where('user_id', $user->id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->with(['category', 'account'])
                    ->first();
                if ($existing) {
                    return response()->json([
                        'success' => true,
                        'data' => new TransactionResource($existing),
                        'idempotent_replay' => true,
                    ], 200);
                }
                return response()->json([
                    'success' => false,
                    'message' => 'Duplicate transaction.',
                ], 409);
            }
            throw $e;
        }

        $transaction->load(['category', 'account']);

        return response()->json([
            'success' => true,
            'data' => new TransactionResource($transaction),
            'idempotent_replay' => !$transaction->wasRecentlyCreated,
        ], $transaction->wasRecentlyCreated ? 201 : 200);
    }

    private function isDuplicateKeyError(QueryException $e): bool
    {
        $code = (string) $e->getCode();
        $message = $e->getMessage();
        return $code === '23000'
            || $code === '23505'
            || str_contains($message, 'UNIQUE constraint failed')
            || str_contains($message, 'Duplicate entry');
    }
}
