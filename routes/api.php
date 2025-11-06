<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\CategoryController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    
    // Dashboard
    Route::get('/dashboard', [TransactionController::class, 'getDashboardData']);
    
    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    
    // Accounts
    Route::apiResource('accounts', AccountController::class);
    
    // Transactions
    Route::apiResource('transactions', TransactionController::class);
});
