<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\BetaAccessController;
use App\Services\CurrencyService;

// Beta Access Routes (must be before middleware application)
Route::get('/beta-access', [BetaAccessController::class, 'show'])->name('beta-access');
Route::post('/beta-access', [BetaAccessController::class, 'verify'])->name('beta-access.verify');
Route::post('/beta-access/logout', [BetaAccessController::class, 'logout'])->name('beta-access.logout');

// PWA: Service worker — must be served from root scope with no-cache headers
// (response()->make() is used instead of file() so headers aren't overridden)
Route::get('/sw.js', function () {
    return response()->make(
        file_get_contents(public_path('sw.js')),
        200,
        [
            'Content-Type'  => 'application/javascript; charset=utf-8',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma'        => 'no-cache',
            'Expires'       => '0',
            'Service-Worker-Allowed' => '/',
        ]
    );
});

// Health check route (whitelisted in middleware)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'environment' => config('app.env'),
    ]);
});

// Lightweight no-DB route used by the BetaAccess feature tests.
// Harmless in all environments — placed before the catch-all so it matches first.
Route::get('/_test_protected', fn () => response()->json(['ok' => true]));

// Protected routes
Route::get('/', function () {
    return view('welcome');
});

// Privacy Policy — public Blade page (no auth middleware).
// Also accessible at /privacy-policy for Facebook App Review bots.
Route::get('/chinh-sach-bao-mat', fn () => view('privacy-policy'))->name('privacy-policy');
Route::get('/privacy-policy',     fn () => view('privacy-policy'));

// Pricing page — standalone Blade view with currency-aware pricing.
Route::get('/pricing', function (Request $request, CurrencyService $currencyService) {
    $currency       = $currencyService->detectUserCurrency($request);
    $country        = $currencyService->detectCountryCode($request);
    $defaultGateway = $currencyService->defaultGateway($currency);

    return view('pricing', compact('currency', 'country', 'defaultGateway'));
})->name('pricing');

// SPA catch-all — serves the React app for all non-Blade paths.
// Checkout, cart, and order paths have been removed: WooCommerce on WordPress
// owns the full checkout flow. Laravel is now a pure webhook consumer.
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!docs|pricing).*');