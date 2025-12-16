<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ImportMysqlDataSeeder extends Seeder
{
    public function run(): void
    {

        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'super_admin', 'description' => 'Super administrator with access to system settings and translations', 'created_at' => '2025-11-10 10:34:04', 'updated_at' => '2025-11-10 10:34:04'],
            ['id' => 2, 'name' => 'owner', 'description' => 'Full access to all resources and can manage users', 'created_at' => '2025-11-10 10:34:04', 'updated_at' => '2025-11-10 10:34:04'],
            ['id' => 3, 'name' => 'editor', 'description' => 'Can create, edit, and delete own resources', 'created_at' => '2025-11-10 10:34:04', 'updated_at' => '2025-11-10 10:34:04'],
            ['id' => 4, 'name' => 'viewer', 'description' => 'Read-only access to resources', 'created_at' => '2025-11-10 10:34:04', 'updated_at' => '2025-11-10 10:34:04'],
        ]);

        DB::table('languages')->insert([
            ['id' => 1, 'code' => 'en', 'name' => 'English', 'native_name' => 'English', 'is_default' => 1, 'is_active' => 1, 'created_at' => '2025-11-10 10:34:04', 'updated_at' => '2025-11-10 10:34:04'],
            ['id' => 2, 'code' => 'vi', 'name' => 'Vietnamese', 'native_name' => 'Tiếng Việt', 'is_default' => 0, 'is_active' => 1, 'created_at' => '2025-11-10 10:34:04', 'updated_at' => '2025-11-10 10:34:04'],
        ]);

        DB::table('users')->insert([
            ['id' => 1, 'name' => 'Test Owner', 'email' => 'owner@example.com', 'status' => 'pending', 'email_verified_at' => null, 'password' => '$2y$12$NrHEb11tD3b9df5WiOr6L.RZcQOKB1bjG44i7ifToqQoxgeX6mRTS', 'remember_token' => null, 'created_at' => '2025-11-10 10:34:06', 'updated_at' => '2025-11-10 10:51:27', 'language_id' => 1],
            ['id' => 2, 'name' => 'Test Editor', 'email' => 'editor@example.com', 'status' => 'pending', 'email_verified_at' => null, 'password' => '$2y$12$/VEX6JIx1wd0M2nDvA9kSeNr2fnuXmbv2fruJrvhb2N2Ta6mbFW4.', 'remember_token' => null, 'created_at' => '2025-11-10 10:34:06', 'updated_at' => '2025-11-10 10:34:06', 'language_id' => 1],
            ['id' => 3, 'name' => 'Test Viewer', 'email' => 'viewer@example.com', 'status' => 'pending', 'email_verified_at' => null, 'password' => '$2y$12$ztIZKgEEJVRsv7cL.udfJebHqynizUxh.j3EiUtmmZhuUga2F0Jti', 'remember_token' => null, 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 10:34:07', 'language_id' => 1],
            ['id' => 12, 'name' => 'Super Admin', 'email' => 'admin@kenfinly.com', 'status' => 'active', 'email_verified_at' => '2025-11-18 10:45:17', 'password' => '$2y$12$qeYn3uRCmxMZUg7uWnRJm.DJKYCwvKBuUw7OXV22g2eeipg3bqrcm', 'remember_token' => null, 'created_at' => '2025-11-18 10:45:17', 'updated_at' => '2025-11-18 10:45:17', 'language_id' => null],
        ]);

        DB::table('categories')->insert([
            ['id' => 1, 'name' => 'Food/Drinks', 'slug' => 'food-drinks', 'icon' => '🛒', 'color' => '#60A5FA', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 2, 'name' => 'Food/Drinks', 'slug' => 'food-drinks-sub', 'icon' => '🛒', 'color' => '#60A5FA', 'type' => 'expense', 'parent_id' => 1, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 3, 'name' => 'Eating out', 'slug' => 'eating-out', 'icon' => '🍽️', 'color' => '#EF4444', 'type' => 'expense', 'parent_id' => 1, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 4, 'name' => 'Bar', 'slug' => 'bar', 'icon' => '🍺', 'color' => '#F97316', 'type' => 'expense', 'parent_id' => 1, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 5, 'name' => 'Shopping', 'slug' => 'shopping', 'icon' => '👕', 'color' => '#EC4899', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 6, 'name' => 'Transportation', 'slug' => 'transportation', 'icon' => '🚗', 'color' => '#8B5CF6', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 7, 'name' => 'Fuel', 'slug' => 'fuel', 'icon' => '⛽', 'color' => '#FBBF24', 'type' => 'expense', 'parent_id' => 6, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 8, 'name' => 'Entertainment', 'slug' => 'entertainment', 'icon' => '🎉', 'color' => '#14B8A6', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 9, 'name' => 'Home', 'slug' => 'home', 'icon' => '🏠', 'color' => '#10B981', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 10, 'name' => 'Family', 'slug' => 'family', 'icon' => '👨‍👩‍👧', 'color' => '#A855F7', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 11, 'name' => 'Health/Sport', 'slug' => 'health-sport', 'icon' => '❤️', 'color' => '#EF4444', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 12, 'name' => 'Pets', 'slug' => 'pets', 'icon' => '🐾', 'color' => '#F97316', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 13, 'name' => 'Other (Expenses)', 'slug' => 'other-expenses', 'icon' => '📄', 'color' => '#6B7280', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 14, 'name' => 'Salary', 'slug' => 'salary', 'icon' => '💰', 'color' => '#10B981', 'type' => 'income', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 15, 'name' => 'Business', 'slug' => 'business', 'icon' => '💼', 'color' => '#3B82F6', 'type' => 'income', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 16, 'name' => 'Other (Income)', 'slug' => 'other-income', 'icon' => '💵', 'color' => '#10B981', 'type' => 'income', 'parent_id' => null, 'created_at' => '2025-11-10 10:34:05', 'updated_at' => '2025-11-10 10:34:05'],
            ['id' => 17, 'name' => 'Imported Income', 'slug' => 'imported-income', 'icon' => '💰', 'color' => '#10b981', 'type' => 'income', 'parent_id' => null, 'created_at' => '2025-11-10 10:53:07', 'updated_at' => '2025-11-10 10:53:07'],
            ['id' => 18, 'name' => 'Imported Expense', 'slug' => 'imported-expense', 'icon' => '📊', 'color' => '#ef4444', 'type' => 'expense', 'parent_id' => null, 'created_at' => '2025-11-10 10:53:07', 'updated_at' => '2025-11-10 10:53:07'],
        ]);

        DB::table('accounts')->insert([
            ['id' => 1, 'user_id' => 1, 'name' => 'Cash', 'balance' => 5385000.00, 'currency' => 'USD', 'icon' => '💵', 'color' => '#10B981', 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 12:11:49'],
            ['id' => 2, 'user_id' => 1, 'name' => 'Bank Account', 'balance' => -135000.00, 'currency' => 'USD', 'icon' => '🏦', 'color' => '#3B82F6', 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 12:10:43'],
            ['id' => 3, 'user_id' => 1, 'name' => 'Credit Card', 'balance' => -2500.00, 'currency' => 'USD', 'icon' => '💳', 'color' => '#EF4444', 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 10:34:07'],
            ['id' => 4, 'user_id' => 3, 'name' => 'Cash', 'balance' => 1000.00, 'currency' => 'USD', 'icon' => '💵', 'color' => '#10B981', 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 10:34:07'],
        ]);

        DB::table('user_roles')->insert([
            ['user_id' => 1, 'role_id' => 2, 'created_at' => null, 'updated_at' => null],
            ['user_id' => 2, 'role_id' => 3, 'created_at' => null, 'updated_at' => null],
            ['user_id' => 3, 'role_id' => 4, 'created_at' => null, 'updated_at' => null],
            ['user_id' => 12, 'role_id' => 1, 'created_at' => null, 'updated_at' => null],
        ]);

        DB::table('transactions')->insert([
            ['id' => 1, 'user_id' => 1, 'account_id' => 1, 'category_id' => 14, 'type' => 'income', 'amount' => 5000000.00, 'transaction_date' => '2025-11-10', 'notes' => 'Monthly salary', 'receipt_path' => null, 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 10:34:07'],
            ['id' => 2, 'user_id' => 1, 'account_id' => 1, 'category_id' => 1, 'type' => 'expense', 'amount' => 15000.00, 'transaction_date' => '2025-11-10', 'notes' => 'Weekly groceries', 'receipt_path' => null, 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 10:34:07'],
            ['id' => 3, 'user_id' => 1, 'account_id' => 2, 'category_id' => 9, 'type' => 'expense', 'amount' => 150000.00, 'transaction_date' => '2025-11-10', 'notes' => 'Rent payment', 'receipt_path' => null, 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 10:34:07'],
            ['id' => 4, 'user_id' => 1, 'account_id' => 3, 'category_id' => 5, 'type' => 'expense', 'amount' => 2500.00, 'transaction_date' => '2025-11-10', 'notes' => 'Shopping for clothes', 'receipt_path' => null, 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 10:34:07'],
            ['id' => 5, 'user_id' => 3, 'account_id' => 4, 'category_id' => 16, 'type' => 'income', 'amount' => 1000.00, 'transaction_date' => '2025-11-10', 'notes' => 'Initial deposit', 'receipt_path' => null, 'created_at' => '2025-11-10 10:34:07', 'updated_at' => '2025-11-10 10:34:07'],
            ['id' => 6, 'user_id' => 1, 'account_id' => 1, 'category_id' => 16, 'type' => 'income', 'amount' => 500000.00, 'transaction_date' => '2025-11-10', 'notes' => 'Bonus', 'receipt_path' => null, 'created_at' => '2025-11-10 12:05:00', 'updated_at' => '2025-11-10 12:05:00'],
            ['id' => 7, 'user_id' => 1, 'account_id' => 1, 'category_id' => 1, 'type' => 'expense', 'amount' => 100000.00, 'transaction_date' => '2025-11-10', 'notes' => 'Grocery shopping', 'receipt_path' => null, 'created_at' => '2025-11-10 12:11:49', 'updated_at' => '2025-11-10 12:11:49'],
            ['id' => 8, 'user_id' => 1, 'account_id' => 2, 'category_id' => 6, 'type' => 'expense', 'amount' => 15000.00, 'transaction_date' => '2025-11-10', 'notes' => 'Taxi ride', 'receipt_path' => null, 'created_at' => '2025-11-10 12:10:43', 'updated_at' => '2025-11-10 12:10:43'],
        ]);

        foreach (['roles', 'languages', 'users', 'categories', 'accounts', 'transactions'] as $table) {
            $maxId = DB::table($table)->max('id') ?? 0;
            DB::statement("SELECT setval(pg_get_serial_sequence('{$table}', 'id'), COALESCE((SELECT MAX(id) FROM {$table}), 1))");
        }
    }
}
