<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BetaAccessController;

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

// Pricing page — standalone Blade view.
Route::get('/pricing', function () {
    return view('pricing');
})->name('pricing');

// ── Cart & Checkout ───────────────────────────────────────────────────────
Route::get('/cart',               [\App\Http\Controllers\CartController::class,     'index'])->name('cart');
Route::post('/cart/clear',        [\App\Http\Controllers\CartController::class,     'clear'])->name('cart.clear');
Route::post('/cart/coupon',       [\App\Http\Controllers\CartController::class,     'applyCoupon'])->name('cart.coupon');
Route::post('/cart/coupon/remove',[\App\Http\Controllers\CartController::class,     'removeCoupon'])->name('cart.coupon.remove');
Route::post('/cart/checkout',     [\App\Http\Controllers\CheckoutController::class, 'store'])->name('cart.checkout');
Route::get('/order/{orderCode}',  [\App\Http\Controllers\CheckoutController::class, 'show'])->name('order.show');

// Exclude /docs, /pricing, /cart, /order/* from the SPA catch-all.
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!docs|pricing|cart|order).*');