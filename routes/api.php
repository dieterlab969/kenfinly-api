<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\LanguageController;
use App\Http\Controllers\Api\CsvImportController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ParticipantController;
use App\Http\Controllers\Api\AnalyticsController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Language routes (public)
Route::get('/languages', [LanguageController::class, 'index']);
Route::get('/languages/{code}/translations', [LanguageController::class, 'getTranslations']);

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
    
    // Language preference
    Route::post('/user/language', [LanguageController::class, 'updateUserLanguage']);
    
    // CSV Import
    Route::post('/transactions/import-csv', [CsvImportController::class, 'import']);
    
    // Payments & Licenses
    Route::post('/payments/create-intent', [PaymentController::class, 'createPaymentIntent']);
    Route::get('/licenses/my-licenses', [PaymentController::class, 'myLicenses']);
    
    // Participants & Invitations
    Route::post('/participants/invite', [ParticipantController::class, 'invite']);
    Route::post('/invitations/{token}/accept', [ParticipantController::class, 'acceptInvitation']);
    Route::get('/accounts/{accountId}/participants', [ParticipantController::class, 'listParticipants']);
    Route::delete('/accounts/{accountId}/participants/{userId}', [ParticipantController::class, 'removeParticipant']);
    
    // Analytics
    Route::get('/analytics/summary', [AnalyticsController::class, 'getSummary']);
    Route::get('/analytics/category-breakdown', [AnalyticsController::class, 'getCategoryBreakdown']);
    Route::get('/analytics/trends', [AnalyticsController::class, 'getTrends']);
});

// Public webhook endpoint (no auth required)
Route::post('/webhooks/payment', [PaymentController::class, 'webhook']);
