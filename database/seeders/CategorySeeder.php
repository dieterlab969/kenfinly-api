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
                'name'      => 'Food & Drink',
                'slug'      => 'food-drinks',
                'icon'      => '🛒',
                'color'     => '#60A5FA',
                'type'      => 'expense',
                'is_system' => true,
                'children'  => [
                    ['name' => 'Groceries',  'slug' => 'food-drinks-sub', 'icon' => '🛒', 'color' => '#60A5FA'],
                    ['name' => 'Eating Out', 'slug' => 'eating-out',      'icon' => '🍽️', 'color' => '#EF4444'],
                    ['name' => 'Bar',        'slug' => 'bar',             'icon' => '🍺', 'color' => '#F97316'],
                ],
            ],
            [
                'name'      => 'Shopping',
                'slug'      => 'shopping',
                'icon'      => '👕',
                'color'     => '#EC4899',
                'type'      => 'expense',
                'is_system' => true,
            ],
            [
                'name'      => 'Transportation',
                'slug'      => 'transportation',
                'icon'      => '🚗',
                'color'     => '#8B5CF6',
                'type'      => 'expense',
                'is_system' => true,
                'children'  => [
                    ['name' => 'Fuel', 'slug' => 'fuel', 'icon' => '⛽', 'color' => '#FBBF24'],
                ],
            ],
            [
                'name'      => 'Entertainment',
                'slug'      => 'entertainment',
                'icon'      => '🎉',
                'color'     => '#14B8A6',
                'type'      => 'expense',
                'is_system' => true,
            ],
            [
                'name'      => 'Home',
                'slug'      => 'home',
                'icon'      => '🏠',
                'color'     => '#10B981',
                'type'      => 'expense',
                'is_system' => true,
            ],
            [
                'name'      => 'Family',
                'slug'      => 'family',
                'icon'      => '👨‍👩‍👧',
                'color'     => '#A855F7',
                'type'      => 'expense',
                'is_system' => true,
            ],
            [
                'name'      => 'Health & Sport',
                'slug'      => 'health-sport',
                'icon'      => '❤️',
                'color'     => '#EF4444',
                'type'      => 'expense',
                'is_system' => true,
            ],
            [
                'name'      => 'Pets',
                'slug'      => 'pets',
                'icon'      => '🐾',
                'color'     => '#F97316',
                'type'      => 'expense',
                'is_system' => true,
            ],
            [
                'name'      => 'Other Expenses',
                'slug'      => 'other-expenses',
                'icon'      => '📄',
                'color'     => '#6B7280',
                'type'      => 'expense',
                'is_system' => true,
            ],
            [
                'name'      => 'Salary',
                'slug'      => 'salary',
                'icon'      => '💰',
                'color'     => '#10B981',
                'type'      => 'income',
                'is_system' => true,
            ],
            [
                'name'      => 'Business',
                'slug'      => 'business',
                'icon'      => '💼',
                'color'     => '#3B82F6',
                'type'      => 'income',
                'is_system' => true,
            ],
            [
                'name'      => 'Other Income',
                'slug'      => 'other-income',
                'icon'      => '💵',
                'color'     => '#10B981',
                'type'      => 'income',
                'is_system' => true,
            ],
        ];

        foreach ($categories as $categoryData) {
            $children  = $categoryData['children'] ?? [];
            $isSystem  = $categoryData['is_system'] ?? true;
            unset($categoryData['children']);

            $category = Category::firstOrCreate(
                ['slug' => $categoryData['slug']],
                array_merge($categoryData, ['is_system' => $isSystem, 'user_id' => null]),
            );

            foreach ($children as $child) {
                Category::firstOrCreate(
                    ['slug' => $child['slug']],
                    array_merge($child, [
                        'parent_id' => $category->id,
                        'type'      => $categoryData['type'],
                        'is_system' => true,
                        'user_id'   => null,
                    ]),
                );
            }
        }

        echo "Categories seeded successfully!\n";
    }
}
