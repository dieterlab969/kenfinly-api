<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles first
        $this->call(RoleSeeder::class);

        // Seed languages and translations
        $this->call(LanguageSeeder::class);

        // Seed categories
        $this->call(CategorySeeder::class);

        // Create super admin user
        $this->call(SuperAdminSeeder::class);

        // Create test users with proper credentials
        $this->call(TestUsersSeeder::class);

        // Seed accounts for test users
        $this->call(AccountSeeder::class);

        $this->command->info('Database seeded successfully!');
    }
}
