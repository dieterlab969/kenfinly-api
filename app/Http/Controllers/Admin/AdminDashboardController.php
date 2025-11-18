<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\Category;
use App\Models\Language;

class AdminDashboardController extends Controller
{
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
