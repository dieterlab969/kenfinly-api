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
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AccountManagementController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\RoleManagementController;
use App\Http\Controllers\Admin\CategoryManagementController;
use App\Http\Controllers\Admin\LanguageManagementController;
use App\Http\Controllers\Admin\LicenseManagementController;
use App\Http\Controllers\Admin\SettingsManagementController;
use App\Http\Controllers\Admin\CacheManagementController;
use App\Http\Controllers\Admin\TranslationManagementController;
use App\Http\Controllers\Admin\TransactionManagementController;
use App\Http\Controllers\Admin\LogoManagementController;
use App\Http\Controllers\Admin\FaviconManagementController;
use App\Http\Controllers\Api\WordPressController;
use App\Http\Controllers\Api\PublicSettingsController;
use App\Http\Controllers\Api\PublicLogoController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PublicAnalyticsController;
use App\Http\Controllers\Api\ConsentController;
use App\Http\Controllers\Api\LogoController;

// Public routes
Route::get('/logo', [LogoController::class, 'getLogo']);
Route::get('/subscription-plans', [\App\Http\Controllers\Api\SubscriptionPlanController::class, 'index']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::get('/settings/logos', [PublicLogoController::class, 'index']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/waitlist', [\App\Http\Controllers\Api\WaitlistController::class, 'store']);
Route::get('/auth/config', [AuthController::class, 'config']);
Route::get('/settings/company', [PublicSettingsController::class, 'getCompanyInfo']);
Route::get('/analytics/public-stats', [PublicAnalyticsController::class, 'getPublicStats']);
Route::prefix('consent')->group(function () {
    Route::post('/', [ConsentController::class, 'store']);
    Route::get('/', [ConsentController::class, 'show']);
    Route::delete('/', [ConsentController::class, 'destroy']);
});

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

    // Logo management
    Route::post('/logo/upload', [LogoController::class, 'uploadLogo']);

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

    // User Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    // CSV Import & Export
    Route::post('/csv/import', [CsvController::class, 'import']);
    Route::get('/csv/export', [CsvController::class, 'export']);

    // Payments & Licenses
    Route::post('/payments/create-intent', [PaymentController::class, 'createPaymentIntent']);
    Route::get('/payments/info', [PaymentController::class, 'getPaymentInfo']);
    Route::get('/payments/history', [PaymentController::class, 'getPaymentHistory']);
    Route::get('/payments/methods', [PaymentController::class, 'getPaymentMethods']);
    Route::post('/payments/methods', [PaymentController::class, 'addPaymentMethod']);
    Route::put('/payments/methods/{id}', [PaymentController::class, 'updatePaymentMethod']);
    Route::delete('/payments/methods/{id}', [PaymentController::class, 'deletePaymentMethod']);
    Route::post('/payments/methods/{id}/default', [PaymentController::class, 'setDefaultPaymentMethod']);
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
Route::middleware('auth:api')->prefix('saving-tracker')->group(function() {
    Route::apiResource('habits', \App\Http\Controllers\API\SavingTracker\HabitController::class);
    Route::post('tracking/toggle', \App\Http\Controllers\API\SavingTracker\HabitTrackingController::class, 'toggle');
    Route::get('stats/habits/{habit}', \App\Http\Controllers\API\SavingTracker\HabitController::class, 'getStats');
    Route::get('stats/overall', \App\Http\Controllers\API\SavingTracker\HabitController::class, 'getOverallStats');
});

// Public webhook endpoint (no auth required)
Route::post('/webhooks/payment', [PaymentController::class, 'webhook']);

// Admin routes (Super Admin only)
Route::middleware(['auth:api', App\Http\Middleware\SuperAdminMiddleware::class])->prefix('admin')->group(function () {
    // Payment Gateway Management
    Route::apiResource('payment-gateways', \App\Http\Controllers\Api\PaymentGatewayController::class);
    Route::post('/payment-gateways/{paymentGateway}/toggle', [\App\Http\Controllers\Api\PaymentGatewayController::class, 'toggleGateway']);
    Route::post('/payment-gateways/{paymentGateway}/credentials', [\App\Http\Controllers\Api\PaymentGatewayController::class, 'storeCredential']);
    Route::put('/payment-gateways/{paymentGateway}/credentials/{credential}', [\App\Http\Controllers\Api\PaymentGatewayController::class, 'updateCredential']);
    Route::delete('/payment-gateways/{paymentGateway}/credentials/{credential}', [\App\Http\Controllers\Api\PaymentGatewayController::class, 'deleteCredential']);
    Route::post('/payment-gateways/{paymentGateway}/credentials/{credential}/verify', [\App\Http\Controllers\Api\PaymentGatewayController::class, 'verifyCredential']);
    Route::get('/payment-gateways/{paymentGateway}/audit-logs', [\App\Http\Controllers\Api\PaymentGatewayController::class, 'auditLogs']);
    // Subscription Plans
    Route::post('/subscriptions', [\App\Http\Controllers\Api\SubscriptionController::class, 'store']);
    // Payments
    Route::post('/payments/process', [\App\Http\Controllers\Api\PaymentController::class, 'processPayment']);
    Route::get('/payments/history', [\App\Http\Controllers\Api\PaymentController::class, 'history']);
    Route::get('/payments/{payment}', [\App\Http\Controllers\Api\PaymentController::class, 'show']);
    Route::post('/payments/{payment}/retry', [\App\Http\Controllers\Api\PaymentController::class, 'retry']);
    // Payment Dashboard (Admin)
    Route::get('/admin/payment-dashboard/overview', [\App\Http\Controllers\Api\PaymentDashboardController::class, 'overview']);
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    Route::apiResource('accounts', AccountManagementController::class)->names('admin.accounts');
    Route::apiResource('users', UserManagementController::class);
    Route::apiResource('roles', RoleManagementController::class);
    Route::apiResource('categories', CategoryManagementController::class);
    Route::apiResource('languages', LanguageManagementController::class);
    Route::apiResource('licenses', LicenseManagementController::class);

    Route::get('/settings', [SettingsManagementController::class, 'index']);
    Route::post('/settings', [SettingsManagementController::class, 'store']);
    Route::put('/settings/{id}', [SettingsManagementController::class, 'update']);
    Route::delete('/settings/{id}', [SettingsManagementController::class, 'destroy']);

    Route::post('/cache/clear', [CacheManagementController::class, 'clearAllCaches']);
    Route::post('/cache/clear-app', [CacheManagementController::class, 'clearApplicationCache']);
    Route::post('/cache/clear-config', [CacheManagementController::class, 'clearConfigCache']);
    Route::post('/cache/clear-route', [CacheManagementController::class, 'clearRouteCache']);
    Route::post('/cache/clear-view', [CacheManagementController::class, 'clearViewCache']);

    Route::get('/translations', [TranslationManagementController::class, 'index']);
    Route::post('/translations', [TranslationManagementController::class, 'store']);
    Route::put('/translations/{id}', [TranslationManagementController::class, 'update']);
    Route::delete('/translations/{id}', [TranslationManagementController::class, 'destroy']);

    Route::get('/transactions', [TransactionManagementController::class, 'index']);
    Route::get('/transactions/{id}', [TransactionManagementController::class, 'show']);

    // Logo Management
    Route::get('/logos', [LogoManagementController::class, 'index']);
    Route::post('/logos/upload', [LogoManagementController::class, 'upload']);
    Route::delete('/logos', [LogoManagementController::class, 'delete']);

    // Sitemap Management
    Route::post('/sitemap/generate', [\App\Http\Controllers\SitemapController::class, 'generate'])->middleware('api');

    // WordPress Cache Management (Admin only)
    Route::post('/wordpress/cache/clear', [WordPressController::class, 'clearCache']);

    Route::get('/favicon', [FaviconManagementController::class, 'show']);
    Route::post('/favicon', [FaviconManagementController::class, 'update']);
});

// WordPress CMS Routes (public endpoints for frontend content)
Route::prefix('wordpress')->group(function () {
    // Status & Connection Testing
    Route::get('/status', [WordPressController::class, 'status']);
    Route::get('/test-connection', [WordPressController::class, 'testConnection']);
    Route::get('/site-info', [WordPressController::class, 'siteInfo']);

    // Posts
    Route::get('/posts', [WordPressController::class, 'posts']);
    Route::get('/posts/{id}', [WordPressController::class, 'post'])->where('id', '[0-9]+');
    Route::get('/posts/slug/{slug}', [WordPressController::class, 'postBySlug']);

    // Pages
    Route::get('/pages', [WordPressController::class, 'pages']);
    Route::get('/pages/{id}', [WordPressController::class, 'page'])->where('id', '[0-9]+');
    Route::get('/pages/slug/{slug}', [WordPressController::class, 'pageBySlug']);

    // Taxonomies
    Route::get('/categories', [WordPressController::class, 'categories']);
    Route::get('/tags', [WordPressController::class, 'tags']);

    // Media
    Route::get('/media/{id}', [WordPressController::class, 'media'])->where('id', '[0-9]+');

    // Custom Post Types
    Route::get('/custom/{postType}', [WordPressController::class, 'customPostType']);
    Route::get('/custom/{postType}/{id}', [WordPressController::class, 'customPostTypeItem'])->where('id', '[0-9]+');
    Route::get('/custom/{postType}/slug/{slug}', [WordPressController::class, 'customPostTypeBySlug']);

    // Search
    Route::get('/search', [WordPressController::class, 'search']);

    // Menus
    Route::get('/menus', [WordPressController::class, 'menus']);
    Route::get('/menus/{location}', [WordPressController::class, 'menu']);
});
