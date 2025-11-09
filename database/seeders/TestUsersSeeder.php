<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $ownerRole = Role::where('name', 'owner')->first();
        $editorRole = Role::where('name', 'editor')->first();
        $viewerRole = Role::where('name', 'viewer')->first();

        $ownerUser = User::firstOrCreate(
            ['email' => 'owner@example.com'],
            [
                'name' => 'Test Owner',
                'password' => Hash::make('password123'),
                'language_id' => 1,
            ]
        );
        $ownerUser->roles()->syncWithoutDetaching($ownerRole);

        $editorUser = User::firstOrCreate(
            ['email' => 'editor@example.com'],
            [
                'name' => 'Test Editor',
                'password' => Hash::make('password123'),
                'language_id' => 1,
            ]
        );
        $editorUser->roles()->syncWithoutDetaching($editorRole);

        $viewerUser = User::firstOrCreate(
            ['email' => 'viewer@example.com'],
            [
                'name' => 'Test Viewer',
                'password' => Hash::make('password123'),
                'language_id' => 1,
            ]
        );
        $viewerUser->roles()->syncWithoutDetaching($viewerRole);

        $this->command->info('Test users created successfully!');
        $this->command->info('Owner: owner@example.com / password123');
        $this->command->info('Editor: editor@example.com / password123');
        $this->command->info('Viewer: viewer@example.com / password123');
    }
}
