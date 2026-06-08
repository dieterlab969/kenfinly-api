<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BetaAccessController;

// Beta Access Gate (no middleware restriction needed)
Route::get('/beta-access', [BetaAccessController::class, 'show'])->name('beta-access');
Route::post('/beta-access/verify', [BetaAccessController::class, 'verify'])->name('beta-access.verify');

// All other routes (protected by beta gatekeeper middleware)
Route::middleware('beta-access')->get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
