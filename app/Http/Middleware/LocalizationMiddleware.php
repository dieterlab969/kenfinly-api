<?php

namespace App\Http\Middleware;

use App\Services\CurrencyService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * LocalizationMiddleware — runs on every web request.
 *
 * WHAT IT DOES
 * ─────────────
 * On the very first web request of a visitor (no session yet):
 *   1. Detects the visitor's country code via CF header → IP lookup → null.
 *   2. Resolves the currency (VND for VN, USD for everything else).
 *   3. Stores both in the session under canonical keys:
 *        session('user_country')  — e.g. "VN" | "US" | null
 *        session('user_currency') — "VND" | "USD"
 *
 * On every subsequent request:
 *   1. Session keys are already populated → zero GeoIP work.
 *   2. Cookie is refreshed (TTL extended), keeping the frontend in sync.
 *
 * CROSS-STACK BRIDGE
 * ───────────────────
 * After resolving the currency, the middleware attaches an `app_currency`
 * cookie to the outgoing response:
 *   - httpOnly: FALSE  →  intentionally readable by client-side JavaScript
 *   - Secure: true only in production (avoids localhost HTTPS issues)
 *   - SameSite: Lax   →  survives PayPal/PayOS redirects back to the site
 *   - Path: /          →  available on all pages
 *   - TTL: 7 days      →  persists across browser restarts
 *
 * The React frontend (AuthContext.jsx) reads this cookie on first render,
 * making the currency immediately available in React state without any API
 * call.
 *
 * REGISTERED IN: bootstrap/app.php → $middleware->web(append: [...])
 */
class LocalizationMiddleware
{
    public function __construct(private readonly CurrencyService $currencyService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        // ── Step 1: Resolve from session (fast path) or detect (first visit) ──
        $country  = session('user_country');   // null → not yet detected
        $currency = session('user_currency');  // null → not yet detected

        if ($currency === null) {
            // First request of this session — run the detection chain.
            // CurrencyService handles CF header → IP lookup → config default.
            $country  = $this->currencyService->detectCountryCode($request);
            $currency = $this->currencyService->countryToCurrency($country);

            // Persist for all future requests in this session
            session([
                'user_country'  => $country,
                'user_currency' => $currency,
            ]);
        }

        // ── Step 2: Continue to controller ───────────────────────────────────
        $response = $next($request);

        // ── Step 3: Attach JS-readable cookie (refreshed on every request) ───
        // Using Laravel's cookie() helper ensures it respects the app's
        // encryption key settings — the cookie VALUE is not encrypted so
        // JavaScript can read it as plain text.
        $response->withCookie(
            cookie(
                name:     'app_currency',
                value:    $currency,
                minutes:  60 * 24 * 7,   // 7 days
                path:     '/',
                domain:   null,
                secure:   app()->isProduction(),
                httpOnly: false,          // JS-readable: intentional
                raw:      false,
                sameSite: 'Lax',
            )
        );

        return $response;
    }
}
