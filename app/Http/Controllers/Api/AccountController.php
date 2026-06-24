<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Http\Resources\AccountResource;
use App\Models\Account;
use Illuminate\Http\JsonResponse;

/**
 * Manage financial accounts (wallets) belonging to the authenticated user.
 *
 * OWNERSHIP MODEL
 * ───────────────
 * Every query scopes to `user_id = auth()->id()`.  Passing a valid account ID
 * that belongs to another user returns 404 — we intentionally do not reveal
 * whether the resource exists at all (IDOR prevention).
 *
 * BALANCE POLICY
 * ──────────────
 * - `store()` accepts an opening balance once (CreateWalletPayload contract).
 * - `update()` explicitly strips `balance` from the validated payload via
 *   UpdateAccountRequest — the field is not in its rules.
 * - Any post-creation balance change must flow through POST /api/transactions.
 *
 * @tags Accounts
 */
class AccountController extends Controller
{
    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Resolve the default currency for a new account based on the current
     * application locale (set by LocalizationMiddleware or user preference).
     * Falls back to 'USD' when the locale has no mapped currency.
     */
    private function defaultCurrencyForLocale(): string
    {
        $locale = app()->getLocale();
        $map    = config('currency.locale_currency_map', []);

        return $map[$locale] ?? 'USD';
    }

    // ── index ─────────────────────────────────────────────────────────────

    /**
     * List all accounts owned by the authenticated user.
     *
     * Includes a `transactions_count` for each account so the frontend can
     * disable the Delete button when transactions exist.
     *
     * GET /api/accounts
     *
     * @return JsonResponse
     * @response 200 { "success": true, "accounts": [ ...AccountResource ] }
     */
    public function index(): JsonResponse
    {
        $accounts = Account::where('user_id', auth('api')->id())
            ->withCount('transactions')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success'  => true,
            'accounts' => AccountResource::collection($accounts),
        ]);
    }

    // ── store ─────────────────────────────────────────────────────────────

    /**
     * Create a new account for the authenticated user.
     *
     * `balance` in the request body is the *opening balance* — the only
     * moment a balance figure is accepted as direct input.
     *
     * POST /api/accounts
     *
     * @param  StoreAccountRequest  $request
     * @return JsonResponse
     * @response 201 { "success": true, "message": "...", "account": AccountResource }
     * @response 422 { "success": false, "message": "Validation failed.", "errors": {} }
     */
    public function store(StoreAccountRequest $request): JsonResponse
    {
        $user = auth('api')->user();

        $account = Account::create([
            'user_id'      => $user->id,
            'name'         => $request->validated('name'),
            'balance'      => $request->validated('balance'),
            'currency'     => $request->validated('currency') ?? $this->defaultCurrencyForLocale(),
            'icon'         => $request->validated('icon'),
            'color'        => $request->validated('color'),
            'account_type' => $request->validated('account_type', 'wallet'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully',
            'account' => new AccountResource($account),
        ], 201);
    }

    // ── show ──────────────────────────────────────────────────────────────

    /**
     * Show a single account belonging to the authenticated user.
     *
     * Returns 404 for accounts that belong to other users (IDOR prevention —
     * we do not reveal whether the account ID exists at all).
     *
     * GET /api/accounts/{id}
     *
     * @param  int  $id
     * @return JsonResponse
     * @response 200 { "success": true, "account": AccountResource }
     * @response 404
     */
    public function show(int $id): JsonResponse
    {
        $account = Account::where('id', $id)
            ->where('user_id', auth('api')->id())
            ->withCount('transactions')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'account' => new AccountResource($account),
        ]);
    }

    // ── update ────────────────────────────────────────────────────────────

    /**
     * Update metadata fields of an account.
     *
     * `balance` is intentionally blocked at two layers:
     *   1. UpdateAccountRequest — no `balance` rule, so it is never validated.
     *   2. `$request->only([...])` — only whitelisted keys reach the model.
     *
     * PUT /api/accounts/{id}
     *
     * @param  UpdateAccountRequest  $request
     * @param  int  $id
     * @return JsonResponse
     * @response 200 { "success": true, "message": "...", "account": AccountResource }
     * @response 422 { "success": false, "message": "Validation failed.", "errors": {} }
     * @response 404
     */
    public function update(UpdateAccountRequest $request, int $id): JsonResponse
    {
        $account = Account::where('id', $id)
            ->where('user_id', auth('api')->id())
            ->firstOrFail();

        // Whitelist prevents any `balance` key (or other unlisted field) from
        // reaching the model even if the client sends it anyway.
        $account->update(
            $request->only(['name', 'currency', 'icon', 'color', 'account_type'])
        );

        return response()->json([
            'success' => true,
            'message' => 'Account updated successfully',
            'account' => new AccountResource($account->fresh()),
        ]);
    }

    // ── destroy ───────────────────────────────────────────────────────────

    /**
     * Delete an account.
     *
     * Deletion is blocked at two independent layers:
     *   1. Application layer (this method) — returns HTTP 400 with a message.
     *   2. Database layer — the FK on transactions.account_id is RESTRICT, so
     *      even a direct DB DELETE cannot silently cascade-delete transaction
     *      history.
     *
     * DELETE /api/accounts/{id}
     *
     * @param  int  $id
     * @return JsonResponse
     * @response 200 { "success": true, "message": "Account deleted successfully" }
     * @response 400 { "success": false, "message": "Cannot delete account with existing transactions" }
     * @response 404
     */
    public function destroy(int $id): JsonResponse
    {
        $account = Account::where('id', $id)
            ->where('user_id', auth('api')->id())
            ->firstOrFail();

        if ($account->hasTransactions()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete account with existing transactions',
            ], 400);
        }

        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully',
        ]);
    }
}
