<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\Category;
use App\Models\Language;

/**
 * Controller for the admin dashboard.
 *
 * Provides statistical data and overview information for the admin interface,
 * including user counts, account statistics, and transaction metrics.
 */
class AdminDashboardController extends Controller
{
    /**
     * Get dashboard statistics.
     *
     * Retrieves key metrics including user counts, account totals, transaction counts,
     * and category/language statistics for the admin dashboard.
     *
     * @return \Illuminate\Http\JsonResponse JSON response with success status and statistics data.
     */
    public function index()
    {
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'total_accounts' => Account::count(),
            'total_transactions' => Transaction::count(),
            'total_categories' => Category::count(),
            'total_languages' => Language::count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
