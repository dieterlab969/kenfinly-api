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

        // Create a test user with owner role
        $testUser = User::factory()->create([
            'name' => 'Test Owner',
            'email' => 'owner@example.com',
        ]);
        $testUser->assignRole('owner');

        // Create a viewer user
        $viewerUser = User::factory()->create([
            'name' => 'Test Viewer',
            'email' => 'viewer@example.com',
        ]);
        $viewerUser->assignRole('viewer');

        // Seed accounts for test users
        $this->call(AccountSeeder::class);

        $this->command->info('Database seeded successfully!');
    }
}
