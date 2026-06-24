<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Manage financial accounts belonging to the authenticated user.
 *
 * @tags Accounts
 */
class AccountController extends Controller
{
    /**
     * Resolve the default currency for a new account.
     *
     * Reads the application's current locale (set by LocalizationMiddleware
     * or the user's language preference) and maps it to a currency code via
     * the `currency.locale_currency_map` config entry.
     *
     * Falls back to 'USD' when the locale is not present in the map.
     *
     * @return string ISO-4217 currency code, e.g. 'USD' or 'VND'.
     */
    private function defaultCurrencyForLocale(): string
    {
        $locale = app()->getLocale();
        $map    = config('currency.locale_currency_map', []);

        return $map[$locale] ?? 'USD';
    }

    /**
     * List all accounts for the authenticated user.
     *
     * Returns every account owned by the current user together with a
     * transaction count derived from the related transactions table.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $user = auth('api')->user();

        $accounts = Account::where('user_id', $user->id)
            ->withCount('transactions')
            ->get();

        return response()->json([
            'success' => true,
            'accounts' => $accounts,
        ]);
    }

    /**
     * Create a new account.
     *
     * @param  Request  $request
     * @return JsonResponse
     *
     * @bodyParam name string required Display name for the account. Example: "My Wallet"
     * @bodyParam balance numeric required Opening balance. Example: 1000000
     * @bodyParam currency string ISO-4217 currency code (max 3 chars). Example: VND
     * @bodyParam icon string Emoji or icon identifier (max 50 chars). Example: 💰
     * @bodyParam color string Hex colour for the account card (max 7 chars). Example: #4ade80
     *
     * @response 201 {"success": true, "message": "Account created successfully", "account": {"id": 1, "name": "My Wallet", "balance": 1000000, "currency": "VND"}}
     * @response 422 {"success": false, "errors": {"name": ["The name field is required."]}}
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'balance'  => 'required|numeric',
            'currency' => 'nullable|string|max:3',
            'icon'     => 'nullable|string|max:50',
            'color'    => 'nullable|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();

        $account = Account::create([
            'user_id'  => $user->id,
            'name'     => $request->name,
            'balance'  => $request->balance ?? 0,
            'currency' => $request->currency ?? $this->defaultCurrencyForLocale(),
            'icon'     => $request->icon,
            'color'    => $request->color,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully',
            'account' => $account,
        ], 201);
    }

    /**
     * Get details of a single account.
     *
     * Returns the account along with its transaction count.
     * The account must belong to the authenticated user.
     *
     * @param  int  $id  Account ID
     * @return JsonResponse
     *
     * @response 200 {"success": true, "account": {"id": 1, "name": "My Wallet", "balance": 1000000}}
     * @response 404 {"message": "No query results for model [App\\Models\\Account]"}
     */
    public function show(int $id): JsonResponse
    {
        $user = auth('api')->user();

        $account = Account::where('id', $id)
            ->where('user_id', $user->id)
            ->withCount('transactions')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'account' => $account,
        ]);
    }

    /**
     * Update an existing account.
     *
     * All fields are optional — only the fields provided will be changed.
     *
     * @param  Request  $request
     * @param  int  $id  Account ID
     * @return JsonResponse
     *
     * @bodyParam name string Display name for the account. Example: Savings
     * @bodyParam balance numeric Current balance. Example: 500000
     * @bodyParam currency string ISO-4217 currency code. Example: USD
     * @bodyParam icon string Emoji or icon identifier. Example: 🏦
     * @bodyParam color string Hex colour. Example: #818cf8
     *
     * @response 200 {"success": true, "message": "Account updated successfully", "account": {"id": 1}}
     * @response 422 {"success": false, "errors": {}}
     * @response 404 {"message": "No query results for model [App\\Models\\Account]"}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'sometimes|required|string|max:255',
            'balance'  => 'sometimes|required|numeric',
            'currency' => 'nullable|string|max:3',
            'icon'     => 'nullable|string|max:50',
            'color'    => 'nullable|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = auth('api')->user();

        $account = Account::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $account->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Account updated successfully',
            'account' => $account,
        ]);
    }

    /**
     * Delete an account.
     *
     * Accounts that still have transactions attached cannot be deleted.
     * Remove all transactions first, or archive the account instead.
     *
     * @param  int  $id  Account ID
     * @return JsonResponse
     *
     * @response 200 {"success": true, "message": "Account deleted successfully"}
     * @response 400 {"success": false, "message": "Cannot delete account with existing transactions"}
     * @response 404 {"message": "No query results for model [App\\Models\\Account]"}
     */
    public function destroy(int $id): JsonResponse
    {
        $user = auth('api')->user();

        $account = Account::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($account->transactions()->count() > 0) {
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
