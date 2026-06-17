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
    | Exchange Rate  (VND → USD)
    |--------------------------------------------------------------------------
    | A static rate used when no live-rate service is wired up.
    | 1 USD ≈ 25 500 VND as of mid-2025; update CURRENCY_VND_TO_USD_RATE in
    | your .env whenever the rate drifts significantly (±5%).
    |
    | To integrate a live feed: override CurrencyService::getVndToUsdRate()
    | to call your preferred exchange-rate API and cache the result.
    */
    'vnd_to_usd_rate' => (float) env('CURRENCY_VND_TO_USD_RATE', 25500),

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
