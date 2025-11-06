<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/
// API Routes
Route::prefix('api')->group(function () {
    // Public routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Protected routes (require authentication)
    Route::middleware('auth:api')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Example: Protected routes with role-based access
        Route::middleware('role:owner,editor')->group(function () {
            // Routes accessible by owners and editors
            // Route::get('/transactions', [TransactionController::class, 'index']);
        });

        Route::middleware('role:owner')->group(function () {
            // Routes accessible only by owners
            // Route::delete('/account/{id}', [AccountController::class, 'destroy']);
        });
    });
});
