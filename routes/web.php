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
    return redirect('/halo');
});

Route::get('/halo', function () {
    return view('welcome');
});

Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');