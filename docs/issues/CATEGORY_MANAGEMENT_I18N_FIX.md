# CategoryManagement i18n Fix

**Date:** 2026-06-26  
**Severity:** Medium — all UI text in CategoryManagement shows English regardless of selected language  
**Status:** Fixed

---

## Phase 1 — Root Cause Analysis

### Symptom
`/CategoryManagement` page displays all labels, buttons, placeholders, badges, and messages in English even when the app language is set to Vietnamese. The UI is functional, but it is not localised.

### Translation System Architecture
`TranslationContext.jsx` exposes a `t(key)` function that:
1. Looks up `key` in the flat map loaded from `/languages/{code}/translations` (API).
2. Falls back to `FALLBACK_TRANSLATIONS[lang][key]` built from `resources/lang/translations.json`.
3. If neither lookup finds a match, **returns the raw `key` string**.

`translations.json` uses **semantic dot-notation keys** throughout (e.g. `"common.cancel"`, `"account.title"`).

### Root Cause
`CategoryManagement.tsx` was calling `t()` with **raw English display text as keys** — e.g.:

```tsx
t('Categories')        // key not in translations.json
t('Cancel')            // key not in translations.json
t('↑ Income')          // key not in translations.json
t('System first')      // via SORT_OPTIONS label — not in translations.json
```

Because `t()` falls back to returning the key itself, English users never noticed the bug: the English text is both the key and the correct display value. However, **Vietnamese users always see English** because there are no Vietnamese translations for bare-string keys like `"Categories"` or `"Cancel"`.

### Additional Hardcoded Strings (no `t()` at all)
Several strings bypassed `t()` entirely:
- Preview chip fallback text: `'Category Name'`
- Preview chip badge: `'↑ Income'` / `'↓ Expense'`
- Color picker placeholder: `'#RRGGBB  — custom hex'`
- Color picker validation: `'Must be a valid hex colour (e.g. #FF6B35)'`
- All CRUD success/error messages in async handlers

### SORT_OPTIONS Type Issue
```ts
// Before — label was a raw English string
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'system_first', label: 'System first' },
  ...
];
// t(opt.label) looked up 'System first' — not in translations.json
```

---

## Phase 2 — Fix

### Step 1 — Add `category_mgmt.*` keys to `translations.json`
Added **52 new entries** under the `category_mgmt.*` namespace covering all strings in the component. Each entry has both `"en"` and `"vi"` values. Examples:

```json
"category_mgmt.title":            { "en": "Categories",              "vi": "Danh mục" },
"category_mgmt.btn.cancel":        { "en": "Cancel",                  "vi": "Hủy" },
"category_mgmt.badge.income":      { "en": "↑ Income",                "vi": "↑ Thu nhập" },
"category_mgmt.sort.system_first": { "en": "System first",            "vi": "Hệ thống trước" },
"category_mgmt.delete_confirm":    { "en": "Delete \"{{name}}\"?",    "vi": "Xóa \"{{name}}\"?" },
"category_mgmt.error.load":        { "en": "Unable to load categories. Please try again.", "vi": "Không thể tải danh mục. Vui lòng thử lại." }
```

### Step 2 — Update `CategoryManagement.tsx`

**SORT_OPTIONS** — changed `label` to `labelKey` (semantic key string):
```ts
// After
const SORT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'system_first', labelKey: 'category_mgmt.sort.system_first' },
  ...
];
// Template: {t(opt.labelKey)}
```

**All `t()` call-sites** — replaced bare-text keys with semantic keys:

| Before | After |
|---|---|
| `t('Categories')` | `t('category_mgmt.title')` |
| `t('New Category')` | `t('category_mgmt.new_category')` |
| `t('Edit Category')` | `t('category_mgmt.edit_category')` |
| `t('↑ Income')` | `t('category_mgmt.badge.income')` |
| `t('↓ Expense')` | `t('category_mgmt.badge.expense')` |
| `t('🔒 System')` | `t('category_mgmt.badge.system')` |
| `t('Cancel')` | `t('category_mgmt.btn.cancel')` |
| `t('Delete')` | `t('category_mgmt.btn.delete')` |
| `t('Sort')` | `t('category_mgmt.sort')` |
| `t('Icon')` | `t('category_mgmt.form.icon_label')` |
| `t('Color')` | `t('category_mgmt.form.color_label')` |
| `t('Category Name')` | `t('category_mgmt.form.name_label')` |
| `t('Type')` | `t('category_mgmt.form.type_label')` |
| `t('Parent Category')` | `t('category_mgmt.form.parent_label')` |
| `t('Save Changes')` | `t('category_mgmt.form.btn_save')` |
| `t('Create Category')` | `t('category_mgmt.form.btn_create')` |
| `t('⚠️ Also removes 1 sub-category.')` | `t('category_mgmt.delete_warn_one')` |
| `t('⚠️ Also removes {{count}} sub-categories.')` | `t('category_mgmt.delete_warn_many')` |
| `t('This cannot be undone.')` | `t('category_mgmt.delete_undone')` |
| `t('Loading categories…')` | `t('category_mgmt.loading')` |
| `t('Try Again')` | `t('category_mgmt.try_again')` |
| `t('No categories yet.')` | `t('category_mgmt.empty.no_categories')` |
| `t('No categories match your filter.')` | `t('category_mgmt.empty.no_match')` |
| `t('Add Custom Category')` | `t('category_mgmt.add_custom')` |
| *(hardcoded)* `'Category Name'` | `t('category_mgmt.form.name_label')` |
| *(hardcoded)* `'↑ Income'` / `'↓ Expense'` in preview | `t('category_mgmt.badge.income')` / `…expense` |
| *(hardcoded)* `'#RRGGBB — custom hex'` | `t('category_mgmt.form.color_placeholder')` |
| *(hardcoded)* `'Must be a valid hex colour'` | `t('category_mgmt.form.color_error')` |
| *(hardcoded)* `"${name}" created successfully.` | `t('category_mgmt.success.created').replace(…)` |
| *(hardcoded)* `"${name}" updated successfully.` | `t('category_mgmt.success.updated').replace(…)` |
| *(hardcoded)* `'Category deleted successfully.'` | `t('category_mgmt.success.deleted')` |
| *(hardcoded)* `'You cannot edit a system category.'` | `t('category_mgmt.error.system_edit')` |
| *(hardcoded)* `'Something went wrong…'` | `t('category_mgmt.error.generic')` |
| *(hardcoded)* `'Could not delete this category.'` | `t('category_mgmt.error.delete')` |
| *(hardcoded)* `'Unable to load categories…'` | `t('category_mgmt.error.load')` |

**Interpolation** — keys with `{{name}}` and `{{count}}` placeholders use `.replace()`:
```tsx
t('category_mgmt.delete_confirm').replace('{{name}}', cat.name)
t('category_mgmt.delete_warn_many').replace('{{count}}', String(cat.children.length))
t('category_mgmt.success.created').replace('{{name}}', form.name)
```

---

## Phase 3 — Verification

- TypeScript build passes with zero new errors.
- All strings in the component now resolve through the `t()` system.
- Grep for bare English `t(` calls in the file returns no matches:
  ```
  grep: t\('[A-Z↑↓🔒⚠]  → No matches
  grep: t\('(Icon|Cancel|Delete|Sort|…) → No matches
  ```
- Vietnamese values cover 100% of new keys in `translations.json`.

---

## Phase 4 — Follow-up Recommendations

1. **Re-seed translations DB** — run `php artisan db:seed --class=LanguageSeeder` on any environment where the database-backed translation API is used. The new `category_mgmt.*` keys must be present in the `language_translations` table for the API path to serve Vietnamese text.

2. **Audit pattern** — the same bare-string-as-key anti-pattern may exist in other `resources/js/template/pages/` components (e.g. `WalletManagement.tsx`, `SavingHabitTracker.tsx`). A quick grep can surface them:
   ```bash
   grep -n "t('" resources/js/template/pages/*.tsx | grep -v "category_mgmt\|common\.\|account\.\|payment\.\|habit\.\|auth\.\|verification\."
   ```

3. **Lint rule** — consider adding an ESLint custom rule (or a CI grep check) that warns when `t()` is called with a string that does not match the dot-notation key pattern `^[a-z][a-z0-9_]+(\.[a-z][a-z0-9_.]+)+$`.

---

## Files Changed

| File | Change |
|---|---|
| `resources/lang/translations.json` | +52 `category_mgmt.*` key/value pairs (EN + VI) |
| `resources/js/template/pages/CategoryManagement.tsx` | All `t()` calls converted to semantic keys; SORT_OPTIONS `label→labelKey`; hardcoded strings now use `t()` |
