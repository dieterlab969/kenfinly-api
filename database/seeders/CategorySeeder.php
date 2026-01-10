<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Food/Drinks',
                'slug' => 'food-drinks',
                'icon' => '🛒',
                'color' => '#60A5FA',
                'type' => 'expense',
                'children' => [
                    ['name' => 'Food/Drinks', 'slug' => 'food-drinks-sub', 'icon' => '🛒', 'color' => '#60A5FA'],
                    ['name' => 'Eating out', 'slug' => 'eating-out', 'icon' => '🍽️', 'color' => '#EF4444'],
                    ['name' => 'Bar', 'slug' => 'bar', 'icon' => '🍺', 'color' => '#F97316'],
                ]
            ],
            [
                'name' => 'Shopping',
                'slug' => 'shopping',
                'icon' => '👕',
                'color' => '#EC4899',
                'type' => 'expense',
            ],
            [
                'name' => 'Transportation',
                'slug' => 'transportation',
                'icon' => '🚗',
                'color' => '#8B5CF6',
                'type' => 'expense',
                'children' => [
                    ['name' => 'Fuel', 'slug' => 'fuel', 'icon' => '⛽', 'color' => '#FBBF24'],
                ]
            ],
            [
                'name' => 'Entertainment',
                'slug' => 'entertainment',
                'icon' => '🎉',
                'color' => '#14B8A6',
                'type' => 'expense',
            ],
            [
                'name' => 'Home',
                'slug' => 'home',
                'icon' => '🏠',
                'color' => '#10B981',
                'type' => 'expense',
            ],
            [
                'name' => 'Family',
                'slug' => 'family',
                'icon' => '👨‍👩‍👧',
                'color' => '#A855F7',
                'type' => 'expense',
            ],
            [
                'name' => 'Health/Sport',
                'slug' => 'health-sport',
                'icon' => '❤️',
                'color' => '#EF4444',
                'type' => 'expense',
            ],
            [
                'name' => 'Pets',
                'slug' => 'pets',
                'icon' => '🐾',
                'color' => '#F97316',
                'type' => 'expense',
            ],
            [
                'name' => 'Other (Expenses)',
                'slug' => 'other-expenses',
                'icon' => '📄',
                'color' => '#6B7280',
                'type' => 'expense',
            ],
            [
                'name' => 'Salary',
                'slug' => 'salary',
                'icon' => '💰',
                'color' => '#10B981',
                'type' => 'income',
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'icon' => '💼',
                'color' => '#3B82F6',
                'type' => 'income',
            ],
            [
                'name' => 'Other (Income)',
                'slug' => 'other-income',
                'icon' => '💵',
                'color' => '#10B981',
                'type' => 'income',
            ],
        ];

        foreach ($categories as $categoryData) {
            $children = $categoryData['children'] ?? [];
            unset($categoryData['children']);

            $category = Category::firstOrCreate(
                ['slug' => $categoryData['slug']],
                $categoryData
            );

            foreach ($children as $child) {
                Category::firstOrCreate(
                    ['slug' => $child['slug']],
                    [
                        ...$child,
                        'parent_id' => $category->id,
                        'type' => $categoryData['type'],
                    ]
                );
            }
        }

        echo "Categories seeded successfully!\n";
    }
}
