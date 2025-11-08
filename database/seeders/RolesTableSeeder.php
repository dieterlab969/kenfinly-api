<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'owner',
                'description' => 'Full access to manage accounts, invite users, and control all settings',
            ],
            [
                'name' => 'editor',
                'description' => 'Can create, edit, and delete transactions and categories',
            ],
            [
                'name' => 'viewer',
                'description' => 'Read-only access to view transactions and reports',
            ],
        ];

        foreach ($roles as $role) {
            \App\Models\Role::firstOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description']]
            );
        }
    }
}
