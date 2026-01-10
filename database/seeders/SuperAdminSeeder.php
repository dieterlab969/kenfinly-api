<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['description' => 'Super Administrator with full system access']
        );

        $admin = User::firstOrCreate(
            ['email' => 'admin@kenfinly.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('Admin@123'),
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $admin->assignRole($superAdminRole);

        $this->command->info('Super Admin created successfully!');
        $this->command->info('Email: admin@kenfinly.com');
        $this->command->info('Password: Admin@123');
    }
}
