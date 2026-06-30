<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Guards user-scoped category mutations.
 *
 * Rules:
 *  - System categories (is_system = true) are immutable for all users.
 *  - A user may only modify/delete categories they themselves created (user_id match).
 */
class CategoryPolicy
{
    use HandlesAuthorization;

    public function update(User $user, Category $category): bool
    {
        return !$category->is_system && (int) $category->user_id === $user->id;
    }

    public function delete(User $user, Category $category): bool
    {
        return !$category->is_system && (int) $category->user_id === $user->id;
    }
}
