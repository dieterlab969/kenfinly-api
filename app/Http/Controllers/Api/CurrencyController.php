<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Services\CurrencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Exposes currency data and geo-detection over the API.
 *
 * Routes:
 *   GET  /api/currencies         — list all app-active currencies (public)
 *   GET  /api/currency/detect   — detect & return currency + country for visitor
 *   POST /api/currency/save     — save the authenticated user's explicit preference
 */
class CurrencyController extends Controller
{
    public function __construct(private readonly CurrencyService $currencyService)
    {
    }

    /**
     * Detect the currency and country code for the current visitor.
     *
     * For authenticated users, returns their saved preference if one exists.
     * For guests, performs geo-detection and caches the result in the session.
     *
     * GET /api/currency/detect
     *
     * @return JsonResponse
     * {
     *   "currency":        "VND" | "USD",
     *   "country_code":    "VN" | "US" | null,
     *   "default_gateway": "payos" | "paypal",
     *   "plans": {
     *     "monthly": { "currency": "VND", "amount": 50000, "amount_display": "50,000 ₫" },
     *     "yearly":  { "currency": "VND", "amount": 169000, "amount_display": "169,000 ₫" }
     *   }
     * }
     */

    /**
     * Return all app-active currencies ordered by display_order.
     *
     * PUBLIC endpoint — no authentication required.
     * Mirrors the Language module's index() pattern for consistency.
     *
     * The SQL executed is:
     *   SELECT code, name, symbol, display_order
     *   FROM   currencies
     *   WHERE  is_active = true
     *   ORDER  BY display_order ASC;
     *
     * GET /api/currencies
     *
     * @return JsonResponse {
     *   "success": true,
     *   "currencies": [
     *     { "code": "USD", "name": "US Dollar", "symbol": "$", "display_order": 1 },
     *     { "code": "VND", "name": "Vietnamese Dong", "symbol": "₫", "display_order": 2 }
     *   ]
     * }
     */
    public function index(): JsonResponse
    {
        $currencies = Currency::getActive()
            ->map(fn (Currency $c) => [
                'code'          => $c->code,
                'name'          => $c->name,
                'symbol'        => $c->symbol,
                'display_order' => $c->display_order,
            ]);

        return response()->json([
            'success'    => true,
            'currencies' => $currencies,
        ]);
    }

    public function detect(Request $request): JsonResponse
    {
        $currency    = $this->currencyService->detectUserCurrency($request);
        $country     = $this->currencyService->detectCountryCode($request);
        $gateway     = $this->currencyService->defaultGateway($currency);

        $plans = $this->buildPlansPayload($currency);

        return response()->json([
            'currency'        => $currency,
            'country_code'    => $country,
            'default_gateway' => $gateway,
            'plans'           => $plans,
        ]);
    }

    /**
     * Save the authenticated user's explicit currency preference.
     *
     * POST /api/currency/save
     * Body: { "currency": "VND" | "USD" }
     */
    public function save(Request $request): JsonResponse
    {
        $activeCodes = Currency::activeCodes();
        $request->validate([
            'currency' => [
                'required',
                'string',
                $activeCodes ? Rule::in($activeCodes) : 'in:VND,USD',
            ],
        ]);

        $user = auth('api')->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user->update([
            'currency'     => $request->input('currency'),
            'country_code' => $request->input('country_code', $user->country_code),
        ]);

        // Bust the session cache so next detect() call reads the saved value
        $this->currencyService->clearSessionCache();

        return response()->json([
            'currency'     => $user->currency,
            'country_code' => $user->country_code,
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private function buildPlansPayload(string $currency): array
    {
        $plans = [];

        foreach (['monthly', 'yearly'] as $plan) {
            if ($currency === 'USD') {
                $amountUsd = config("paypal.plans.{$plan}.amount_usd", 0.0);
                $plans[$plan] = [
                    'currency'       => 'USD',
                    'amount'         => $amountUsd,
                    'amount_display' => '$' . number_format($amountUsd, 2),
                ];
            } else {
                $amountVnd = config("payos.plans.{$plan}.amount", 0);
                $plans[$plan] = [
                    'currency'       => 'VND',
                    'amount'         => $amountVnd,
                    'amount_display' => number_format($amountVnd) . ' ₫',
                ];
            }
        }

        return $plans;
    }
}
