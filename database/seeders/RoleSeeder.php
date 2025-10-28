<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'owner',
                'description' => 'Full access to all resources and can manage users',
            ],
            [
                'name' => 'editor',
                'description' => 'Can create, edit, and delete own resources',
            ],
            [
                'name' => 'viewer',
                'description' => 'Read-only access to resources',
            ],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate(
                ['name' => $roleData['name']],
                ['description' => $roleData['description']]
            );
        }

        $this->command->info('Roles seeded successfully!');
    }
}
