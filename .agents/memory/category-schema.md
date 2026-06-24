---
name: Category management schema
description: How categories table is structured after the user_id/is_system migration
---

## Rule
`categories.user_id IS NULL` = global system category (is_system=true).
`categories.user_id = X` = user-defined category owned by user X (is_system=false).

CategoryPolicy guards update/delete: `!is_system && user_id == auth()->id()`.
Laravel 11 auto-discovers policies by naming convention (Category → CategoryPolicy).

## Why
Added in the Category Management feature. System categories (seeded via CategorySeeder)
are retroactively marked is_system=true by migration 2026_06_17_000001.

## How to apply
- Any code querying user-visible categories must filter:
  `whereNull('user_id')->orWhere('user_id', auth()->id())`
- Slug uniqueness for user categories: `base-{userId}-{counter}` loop
- New seeder entries must include `'is_system' => true, 'user_id' => null`
