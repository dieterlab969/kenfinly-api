<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\BetaAccessController;
use App\Services\CurrencyService;

// Beta Access Routes (must be before middleware application)
Route::get('/beta-access', [BetaAccessController::class, 'show'])->name('beta-access');
Route::post('/beta-access', [BetaAccessController::class, 'verify'])->name('beta-access.verify');
Route::post('/beta-access/logout', [BetaAccessController::class, 'logout'])->name('beta-access.logout');

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

// Pricing page — standalone Blade view with currency-aware pricing.
Route::get('/pricing', function (Request $request, CurrencyService $currencyService) {
    $currency       = $currencyService->detectUserCurrency($request);
    $country        = $currencyService->detectCountryCode($request);
    $defaultGateway = $currencyService->defaultGateway($currency);

    return view('pricing', compact('currency', 'country', 'defaultGateway'));
})->name('pricing');

// ── Cart ──────────────────────────────────────────────────────────────────
Route::get('/cart',               [\App\Http\Controllers\CartController::class,     'index'])->name('cart');
Route::post('/cart/clear',        [\App\Http\Controllers\CartController::class,     'clear'])->name('cart.clear');
Route::post('/cart/coupon',       [\App\Http\Controllers\CartController::class,     'applyCoupon'])->name('cart.coupon');
Route::post('/cart/coupon/remove',[\App\Http\Controllers\CartController::class,     'removeCoupon'])->name('cart.coupon.remove');
Route::post('/cart/checkout',     [\App\Http\Controllers\CheckoutController::class, 'store'])->name('cart.checkout');

// ── One-Page Checkout ─────────────────────────────────────────────────────
Route::get('/checkout',                    [\App\Http\Controllers\CheckoutController::class, 'index'])->name('checkout');
Route::post('/checkout',                   [\App\Http\Controllers\CheckoutController::class, 'store'])->name('checkout.store');
Route::get('/checkout/paypal/capture',     [\App\Http\Controllers\CheckoutController::class, 'paypalCapture'])->name('checkout.paypal.capture');
Route::get('/checkout/paypal/cancel',      [\App\Http\Controllers\CheckoutController::class, 'paypalCancel'])->name('checkout.paypal.cancel');

// ── Order QR page ─────────────────────────────────────────────────────────
Route::get('/order/{orderCode}',  [\App\Http\Controllers\CheckoutController::class, 'show'])->name('order.show');

// ── Post-payment clean-up & Thank You page ────────────────────────────────
// The PayOS order page JS redirects to /checkout/complete?order={code} on
// confirmed payment. The controller clears the cart, flashes order details,
// then redirects to /checkout/thank-you for the final confirmation screen.
Route::get('/checkout/complete',   [\App\Http\Controllers\CheckoutController::class, 'complete'])->name('checkout.complete');
Route::get('/checkout/thank-you',  [\App\Http\Controllers\CheckoutController::class, 'thankYou'])->name('checkout.thank-you');

// Exclude Blade-rendered paths from the SPA catch-all.
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!docs|pricing|cart|checkout|order).*');