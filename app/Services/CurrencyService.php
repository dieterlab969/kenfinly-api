<?php

namespace App\Services;

use Illuminate\Http\Request;
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
 *                      Config: config/paypal.php →  plans.*.amount_usd
 *
 * The two sets of plan prices are maintained independently.  There is no
 * live conversion between them on the fly; each is the "correct" price
 * for that market, set by the business.
 *
 * DETECTION PRIORITY (highest → lowest)
 * ──────────────────────────────────────
 *  1. Authenticated user's saved `currency` column  (explicit user preference)
 *  2. Session cache  (TTL controlled by config/currency.php → session_ttl_minutes)
 *  3. Cloudflare CF-IPCountry header  (free, ~0 ms, requires CF proxy)
 *  4. stevebauman/location IP lookup  (local MaxMind GeoLite2 DB)
 *  5. Config default  (env CURRENCY_DEFAULT → "VND")
 *
 * Supported currencies: "VND" (Vietnam) and "USD" (all other countries).
 */
class CurrencyService
{
    // ── Legacy static helpers (kept for backwards compatibility) ──────────

    /**
     * Convert an amount between VND and USD using the configured exchange rate.
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

        $rate = (float) config('currency.vnd_to_usd_rate', 25500);
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

    // ── Detection API ─────────────────────────────────────────────────────

    /**
     * Detect the currency that should be presented to the current visitor.
     *
     * Checks priority order: saved user preference → session cache →
     * Cloudflare header → IP lookup → configured default.
     *
     * @param  Request  $request
     * @return string  "VND" | "USD"
     */
    public function detectUserCurrency(Request $request): string
    {
        // 1. Authenticated user's saved preference
        $saved = $this->savedUserCurrency();
        if ($saved !== null) {
            return $saved;
        }

        // 2. Session cache
        $cached = $this->sessionCurrency();
        if ($cached !== null) {
            return $cached;
        }

        // 3 + 4. Geo-detect
        $country  = $this->detectCountryCode($request);
        $currency = $this->countryToCurrency($country);

        $this->cacheInSession($currency, $country);

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
     * Convert a VND integer amount to USD using the configured exchange rate.
     *
     * @param  int  $vnd
     * @return float  rounded to 2 decimal places
     */
    public function vndToUsd(int $vnd): float
    {
        $rate = (float) config('currency.vnd_to_usd_rate', 25500);
        if ($rate <= 0) {
            $rate = 25500;
        }

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
     * Clear the session-cached currency (e.g. after the user changes their
     * country preference in settings).
     */
    public function clearSessionCache(): void
    {
        session()->forget(['detected_currency', 'detected_country', 'currency_cached_at']);
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

    private function sessionCurrency(): ?string
    {
        $cachedAt = session('currency_cached_at');
        $ttl      = (int) config('currency.session_ttl_minutes', 30);

        if ($cachedAt && now()->diffInMinutes($cachedAt) < $ttl) {
            $c = session('detected_currency');
            if ($c !== null) {
                return $c;
            }
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

    private function cacheInSession(string $currency, ?string $country): void
    {
        session([
            'detected_currency'  => $currency,
            'detected_country'   => $country,
            'currency_cached_at' => now()->toISOString(),
        ]);
    }
}
