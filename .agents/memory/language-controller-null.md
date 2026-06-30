---
name: LanguageController null-guard
description: getTranslations() crashes if no languages are seeded; must guard before id access
---

## Rule
`LanguageController::getTranslations($code)` must check for null AFTER both `Language::where()` and `Language::getDefault()` calls. If the DB has no language rows, both return null and accessing `->id` throws.

**Fix applied:** Added null check that returns `{ success: true, language: null, translations: {} }` when both queries return null.

**Why:** Fresh Replit env has PostgreSQL with migrations but no seeds. LanguageSeeder must be run (`php artisan db:seed --class=LanguageSeeder`) before the translation API works. The guard prevents a 500 crash when seeding hasn't happened yet.

**How to apply:** Any query result that could be null before ->id access — add explicit null guard.
