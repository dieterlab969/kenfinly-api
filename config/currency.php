<?php

/**
 * Currency Configuration
 *
 * Governs how Kenfinly detects, converts, and displays currencies across the
 * pricing and checkout pages.
 *
 * Detection priority (highest → lowest):
 *   1. Authenticated user's saved `currency` column
 *   2. Session cache (avoids re-querying IP on every page load)
 *   3. Cloudflare CF-IPCountry header  (free, zero-latency if behind CF)
 *   4. stevebauman/location IP lookup  (free, local GeoIP2 DB)
 *   5. Default: VND (server is in Vietnam)
 *
 * Currency→Country mapping:
 *   VN  → VND  (processed via PayOS / VietQR)
 *   Any other country → USD  (processed via PayPal)
 *
 * Required environment variables (optional overrides):
 *   CURRENCY_VND_TO_USD_RATE  — static fallback rate, e.g. 25500
 *                               Used only when live fetch is disabled or fails.
 *   CURRENCY_DEFAULT          — override the server default (default: VND)
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    | Used when IP detection is disabled or fails for guest users.
    | "VND" is correct for a Vietnamese SaaS; change to "USD" if your primary
    | market is international.
    */
    'default' => env('CURRENCY_DEFAULT', 'VND'),

    /*
    |--------------------------------------------------------------------------
    | VND → Country Mapping
    |--------------------------------------------------------------------------
    | Two-letter ISO 3166-1 alpha-2 country codes that should resolve to VND.
    | Add neighbouring countries if you accept VND from them (e.g. Cambodian
    | banks that transact in VND), otherwise leave as just 'VN'.
    */
    'vnd_countries' => ['VN'],

    /*
    |--------------------------------------------------------------------------
    | Static Fallback Exchange Rate  (VND → USD)
    |--------------------------------------------------------------------------
    | Used ONLY when the live ExchangeRate-API fetch fails or times out.
    | CurrencyService::getLiveUsdToVndRate() attempts a live fetch first,
    | caches it for 24 hours, and only falls back to this value on error.
    |
    | Update CURRENCY_VND_TO_USD_RATE in your .env if the live API becomes
    | permanently unavailable and you need a temporary static safety net.
    | 1 USD ≈ 25 500 VND as of mid-2025.
    */
    'vnd_to_usd_rate' => (float) env('CURRENCY_VND_TO_USD_RATE', 25500),

    /*
    |--------------------------------------------------------------------------
    | Live Exchange Rate API
    |--------------------------------------------------------------------------
    | URL of the free ExchangeRate-API endpoint that returns a JSON object
    | with a `rates` key.  The service requires no API key for the open tier.
    |
    | Response shape expected:
    |   { "result": "success", "rates": { "VND": 25450.0, ... } }
    |
    | Cache key : 'usd_vnd_rate'
    | Cache TTL : 86 400 seconds (24 hours)
    |
    | If the fetch fails, CurrencyService falls back to `vnd_to_usd_rate`
    | above WITHOUT caching, so the live fetch is retried next request.
    */
    'exchange_rate_api_url' => env(
        'CURRENCY_EXCHANGE_RATE_API_URL',
        'https://open.er-api.com/v6/latest/USD'
    ),

    /*
    |--------------------------------------------------------------------------
    | Exchange Rate API HTTP Timeout (seconds)
    |--------------------------------------------------------------------------
    | Maximum seconds to wait for the exchange rate API before giving up and
    | using the static fallback.  Keep this low (3–5 s) so a slow API does
    | not delay the checkout page for the user.
    */
    'exchange_rate_timeout' => (int) env('CURRENCY_EXCHANGE_RATE_TIMEOUT', 5),

    /*
    |--------------------------------------------------------------------------
    | Locale → Currency Map
    |--------------------------------------------------------------------------
    | Maps BCP-47 / ISO 639-1 language locale codes to their canonical
    | currency code.  Used by AccountController when creating a new wallet
    | without an explicit currency — the app's current locale (set by
    | LocalizationMiddleware or the user's language preference) determines
    | the sensible default.
    |
    | Lookup: app()->getLocale() → currency code → fallback 'USD'.
    |
    | Add more locales here as new markets are supported:
    |   'ja' => 'JPY', 'ko' => 'KRW', 'de' => 'EUR', etc.
    */
    'locale_currency_map' => [
        'vi' => 'VND',
        'en' => 'USD',
    ],

    /*
    |--------------------------------------------------------------------------
    | Session Cache TTL (minutes)
    |--------------------------------------------------------------------------
    | How long the detected currency is kept in the session without re-querying
    | the IP geolocation service.  30 minutes balances freshness vs. load.
    */
    'session_ttl_minutes' => (int) env('CURRENCY_SESSION_TTL', 30),

    /*
    |--------------------------------------------------------------------------
    | Geolocation Driver
    |--------------------------------------------------------------------------
    | "cloudflare"  — reads the CF-IPCountry header; zero cost, but requires
    |                 the site to be proxied behind Cloudflare.
    | "ip_lookup"   — uses stevebauman/location (local MaxMind GeoIP2 DB).
    | "auto"        — tries Cloudflare first, falls back to ip_lookup.
    | "disabled"    — always use the default currency (useful for local dev).
    */
    'geo_driver' => env('CURRENCY_GEO_DRIVER', 'auto'),

];
