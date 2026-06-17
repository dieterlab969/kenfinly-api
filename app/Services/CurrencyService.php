<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Stevebauman\Location\Facades\Location;

/**
 * CurrencyService — Hybrid IP + User-Profile currency detection and conversion.
 *
 * WHY TWO CURRENCY PATHS EXIST
 * ─────────────────────────────
 * Kenfinly has two payment gateways for a deliberate reason:
 *
 *   PayOS (VietQR)  →  processes ONLY Vietnamese Đồng (VND)
 *                      Amounts are integers, no decimals.
 *                      Config: config/payos.php  →  plans.*.amount
 *
 *   PayPal          →  processes ONLY US Dollars (USD)
 *                      Amounts are floats with 2 decimal places.
 *                      Conversion: live USD/VND rate (see getLiveUsdToVndRate())
 *
 * LIVE EXCHANGE RATE
 * ──────────────────
 * getLiveUsdToVndRate() fetches the current USD→VND rate from the open
 * ExchangeRate-API (no key required) and caches it for 24 hours.
 * If the fetch fails or returns an invalid value, it falls back to the
 * static CURRENCY_VND_TO_USD_RATE env variable so the checkout loop never
 * breaks.  The fallback is intentionally NOT cached, meaning the live fetch
 * is retried on every request until it succeeds.
 *
 * SESSION ARCHITECTURE
 * ─────────────────────
 * LocalizationMiddleware runs detection ONCE per session (first web request)
 * and stores the result in two canonical session keys:
 *
 *   session('user_currency')  — "VND" | "USD"
 *   session('user_country')   — ISO 3166-1 alpha-2 or null
 *
 * All subsequent calls to this service read directly from those session keys
 * without running any GeoIP logic. The detection methods below are the
 * fallback used by the middleware on that first request.
 *
 * DETECTION PRIORITY (highest → lowest)
 * ──────────────────────────────────────
 *  1. Authenticated user's saved `currency` column  (permanent DB preference)
 *  2. Session cache  (populated by LocalizationMiddleware on first request)
 *  3. Cloudflare CF-IPCountry header  (free, ~0 ms, if behind CF proxy)
 *  4. stevebauman/location IP lookup  (local MaxMind GeoLite2 DB)
 *  5. Config default  (env CURRENCY_DEFAULT → "VND")
 */
class CurrencyService
{
    // ── Live exchange rate ────────────────────────────────────────────────

    /**
     * Fetch the live USD→VND exchange rate, cached for 24 hours.
     *
     * Strategy:
     *  1. Return the cached value if present (Cache key: 'usd_vnd_rate').
     *  2. Fetch from open.er-api.com/v6/latest/USD using Laravel's HTTP client.
     *  3. On success → store in Cache for 86 400 s (24 h) and return.
     *  4. On any failure → log a warning, return the static .env fallback
     *     WITHOUT caching so the live fetch is retried on the next request.
     *
     * @return float  e.g. 25 450.0  (VND per 1 USD)
     */
    public function getLiveUsdToVndRate(): float
    {
        $fallback = (float) config('currency.vnd_to_usd_rate', 25500);
        if ($fallback <= 0) {
            $fallback = 25500;
        }

        try {
            return Cache::remember('usd_vnd_rate', 86400, function () use ($fallback) {
                $apiUrl = config(
                    'currency.exchange_rate_api_url',
                    'https://open.er-api.com/v6/latest/USD'
                );

                $response = Http::timeout(
                    config('currency.exchange_rate_timeout', 5)
                )->get($apiUrl);

                if ($response->successful()) {
                    $rate = (float) ($response->json('rates.VND') ?? 0);

                    if ($rate > 0) {
                        Log::info('CurrencyService: live USD→VND rate cached', [
                            'rate'   => $rate,
                            'source' => $apiUrl,
                        ]);
                        return $rate;
                    }
                }

                // Throw so Cache::remember does NOT store this failed attempt
                throw new \RuntimeException(
                    'Exchange rate API returned no valid VND rate (status: ' .
                    $response->status() . ')'
                );
            });
        } catch (\Exception $e) {
            Log::warning('CurrencyService: live rate unavailable, using static fallback', [
                'error'    => $e->getMessage(),
                'fallback' => $fallback,
            ]);

            return $fallback;
        }
    }

    /**
     * Bust the cached exchange rate.
     *
     * Call this from an admin action or Artisan command when you know the
     * cached rate is stale and want the next request to re-fetch immediately.
     */
    public function forgetCachedRate(): void
    {
        Cache::forget('usd_vnd_rate');
    }

    // ── Legacy static helpers (kept for backwards compatibility) ──────────

    /**
     * Convert an amount between VND and USD.
     *
     * Uses the live cached rate for VND↔USD conversions so that display
     * amounts on the pricing / checkout pages stay consistent with what
     * the PayPal order will actually charge.
     *
     * @param  float   $amount
     * @param  string  $fromCurrency  "VND" | "USD"
     * @param  string  $toCurrency    "VND" | "USD"
     * @return float
     */
    public static function convert(float $amount, string $fromCurrency, string $toCurrency): float
    {
        if ($fromCurrency === $toCurrency) {
            return $amount;
        }

        // Read from cache first; fall back to config if cache is empty
        $rate = (float) (Cache::get('usd_vnd_rate') ?: config('currency.vnd_to_usd_rate', 25500));
        if ($rate <= 0) {
            $rate = 25500;
        }

        if ($fromCurrency === 'VND' && $toCurrency === 'USD') {
            return round($amount / $rate, 2);
        }

        if ($fromCurrency === 'USD' && $toCurrency === 'VND') {
            return round($amount * $rate);
        }

        return $amount;
    }

    /**
     * Format an amount for human-readable display.
     *
     * @param  float   $amount
     * @param  string  $currency  "VND" | "USD"
     * @return string
     */
    public static function format(float $amount, string $currency = 'USD'): string
    {
        if ($currency === 'VND') {
            return number_format($amount, 0, ',', '.') . ' ₫';
        }

        return '$' . number_format($amount, 2, '.', ',');
    }

    /**
     * List supported currencies.
     *
     * @return array<string, string>
     */
    public static function getSupportedCurrencies(): array
    {
        return [
            'USD' => 'US Dollar',
            'VND' => 'Vietnamese Dong',
        ];
    }

    // ── Session accessors ─────────────────────────────────────────────────

    /**
     * Read the currency that LocalizationMiddleware stored in the session.
     * Returns null when the session hasn't been populated yet (first request,
     * or when called from an API route that has no session).
     *
     * @return string|null  "VND" | "USD" | null
     */
    public function getSessionCurrency(): ?string
    {
        $c = session('user_currency');
        return ($c !== null && $c !== '') ? strtoupper($c) : null;
    }

    /**
     * Read the country code that LocalizationMiddleware stored in the session.
     *
     * @return string|null  e.g. "VN", "US", or null
     */
    public function getSessionCountry(): ?string
    {
        $c = session('user_country');
        return ($c !== null && $c !== '') ? strtoupper($c) : null;
    }

    // ── Detection API ─────────────────────────────────────────────────────

    /**
     * Detect the currency that should be presented to the current visitor.
     *
     * Priority: saved DB preference → session → CF header → IP lookup → default.
     *
     * In practice, on all web routes the session is already populated by
     * LocalizationMiddleware before this method is ever called, so the
     * CF/IP code paths are cold-standby fallbacks.
     *
     * @param  Request  $request
     * @return string  "VND" | "USD"
     */
    public function detectUserCurrency(Request $request): string
    {
        // 1. Authenticated user's saved permanent preference
        $saved = $this->savedUserCurrency();
        if ($saved !== null) {
            return $saved;
        }

        // 2. Session — populated by LocalizationMiddleware on first web request
        $cached = $this->getSessionCurrency();
        if ($cached !== null) {
            return $cached;
        }

        // 3 + 4. Geo-detect (fallback for API routes / missing session)
        $country  = $this->detectCountryCode($request);
        $currency = $this->countryToCurrency($country);

        // Write to session for the rest of this request's lifecycle
        session([
            'user_country'  => $country,
            'user_currency' => $currency,
        ]);

        return $currency;
    }

    /**
     * Detect the visitor's ISO 3166-1 alpha-2 country code.
     *
     * @param  Request  $request
     * @return string|null  e.g. "VN", "US", or null when detection is impossible
     */
    public function detectCountryCode(Request $request): ?string
    {
        $driver = config('currency.geo_driver', 'auto');

        if ($driver === 'disabled') {
            return null;
        }

        if (in_array($driver, ['cloudflare', 'auto'], true)) {
            $cf = $this->cloudflareCountry($request);
            if ($cf !== null) {
                return $cf;
            }
        }

        if (in_array($driver, ['ip_lookup', 'auto'], true)) {
            return $this->ipLookupCountry($request);
        }

        return null;
    }

    /**
     * Map a country code to a supported currency code.
     *
     * @param  string|null  $countryCode
     * @return string  "VND" (Vietnam) | "USD" (all others)
     */
    public function countryToCurrency(?string $countryCode): string
    {
        if ($countryCode === null) {
            return config('currency.default', 'VND');
        }

        $vndCountries = config('currency.vnd_countries', ['VN']);

        return in_array(strtoupper($countryCode), $vndCountries, true) ? 'VND' : 'USD';
    }

    /**
     * Convert a VND integer amount to USD using the live cached exchange rate.
     *
     * @param  int  $vnd
     * @return float  rounded to 2 decimal places
     */
    public function vndToUsd(int $vnd): float
    {
        $rate = $this->getLiveUsdToVndRate();

        return round($vnd / $rate, 2);
    }

    /**
     * Which payment gateway should be pre-selected for a given currency.
     *
     * @param  string  $currency  "VND" | "USD"
     * @return string  "payos" | "paypal"
     */
    public function defaultGateway(string $currency): string
    {
        return $currency === 'USD' ? 'paypal' : 'payos';
    }

    /**
     * Clear the currency/country from the session.
     *
     * Call this after the user explicitly changes their currency preference
     * so the next request re-evaluates it (or picks up the new DB value).
     */
    public function clearSessionCache(): void
    {
        session()->forget(['user_currency', 'user_country']);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private function savedUserCurrency(): ?string
    {
        try {
            $user = auth('api')->user();
            if ($user && ! empty($user->currency)) {
                return strtoupper($user->currency);
            }
        } catch (\Exception) {
            // JWT guard throws when no token is present — that is fine
        }

        return null;
    }

    /**
     * Read the Cloudflare CF-IPCountry header.
     * Returns null when absent or for Tor/anonymous traffic ("T1").
     */
    private function cloudflareCountry(Request $request): ?string
    {
        $country = $request->header('CF-IPCountry')
                ?? ($_SERVER['HTTP_CF_IPCOUNTRY'] ?? null);

        if (! $country || in_array($country, ['T1', 'XX', ''], true)) {
            return null;
        }

        return strtoupper($country);
    }

    /**
     * Look up the country code for the request's IP using the
     * stevebauman/location package (MaxMind GeoLite2 local DB).
     */
    private function ipLookupCountry(Request $request): ?string
    {
        try {
            $ip = $request->ip();

            // Local / private IPs cannot be resolved
            if (! $ip || $ip === '127.0.0.1' || str_starts_with($ip, '192.168.')) {
                return null;
            }

            $location = Location::get($ip);

            return $location ? strtoupper($location->countryCode) : null;
        } catch (\Exception $e) {
            Log::debug('CurrencyService: IP lookup failed', ['error' => $e->getMessage()]);

            return null;
        }
    }
}
