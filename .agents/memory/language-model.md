---
name: Language Model Required Fields
description: Language::create() requires native_name — NOT NULL constraint
---

## Rule
Always include all required fields when creating a Language record in tests or seeders:

```php
Language::create([
    'name'        => 'Vietnamese',
    'native_name' => 'Tiếng Việt',   // ← required, NOT NULL
    'code'        => 'vi',
    'is_active'   => true,
    'is_default'  => false,
]);
```

**Why:** The `native_name` column has a NOT NULL constraint. Omitting it throws a DB integrity error.
