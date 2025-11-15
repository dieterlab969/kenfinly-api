<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\LanguageController;
use App\Http\Controllers\Api\CsvController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ParticipantController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\BotAnalyticsController;
use Illuminate\Support\Facades\Route;

// Public routes with rate limiting
Route::post('/auth/register', [AuthController::class, 'register'])
    ->middleware(['check.blocked.ip', 'api.rate.limiter:5,1']);
Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware(['check.blocked.ip', 'api.rate.limiter:10,1']);
Route::get('/auth/config', [AuthController::class, 'config']);

// Email verification routes (public)
Route::post('/email/verify', [EmailVerificationController::class, 'verify']);
Route::post('/email/resend', [EmailVerificationController::class, 'resend']);
Route::get('/email/verification-status', [EmailVerificationController::class, 'status'])->middleware('auth:api');

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
    Route::post('/transactions/{transaction}/photos', [TransactionController::class, 'addPhoto']);
    Route::delete('/photos/{photoId}', [TransactionController::class, 'deletePhoto']);
    
    // Language preference
    Route::post('/user/language', [LanguageController::class, 'updateUserLanguage']);
    
    // CSV Import & Export
    Route::post('/csv/import', [CsvController::class, 'import']);
    Route::get('/csv/export', [CsvController::class, 'export']);
    
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
    
    // Bot Detection Analytics (admin only - add middleware as needed)
    Route::prefix('bot-analytics')->group(function () {
        Route::get('/registrations', [BotAnalyticsController::class, 'getRegistrationAnalytics']);
        Route::get('/bot-summary', [BotAnalyticsController::class, 'getBotDetectionSummary']);
        Route::get('/hourly-trends', [BotAnalyticsController::class, 'getHourlyTrends']);
    });
});

// Public webhook endpoint (no auth required)
Route::post('/webhooks/payment', [PaymentController::class, 'webhook']);
