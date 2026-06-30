# Change Plan: i18n POC — Setting.tsx (react-i18next)

**Date:** 2026-06-26  
**Scope:** `resources/js/template/components/Setting.tsx`  
**Strategy:** Natural Language Keys (English text = translation key)

---

## 1. Background

The project currently uses a custom `TranslationContext.jsx` for i18n. This plan
describes the targeted integration of `react-i18next` as a proof-of-concept
scoped to `Setting.tsx`, without removing or replacing the existing context.

---

## 2. Strings Extracted

All 17 user-facing English strings found in `Setting.tsx`:

| Key (English text, exact) | Location |
|---|---|
| `Loading…` | Profile name fallback |
| `Wallets & Accounts` | Menu item title |
| `Categories` | Menu item title |
| `Subscriptions` | Menu item title |
| `Personal Info` | Menu item title |
| `Security` | Menu item title |
| `Marketing Preferences` | Menu item title |
| `Notification Setting` | Menu item title |
| `Language` | Menu item title |
| `Currency` | Menu item title |
| `FAQs` | Menu item title |
| `Data & Privacy Policy` | Menu item title |
| `Contact Us` | Menu item title |
| `Dark Mode` | Dark-mode toggle label |
| `Light Mode` | Dark-mode toggle label |
| `Delete or Deactivate Account` | Menu item title |
| `Logout` | Bottom action label |

**Excluded from i18n (not user-facing text):**
- `alt` attribute values (`"setting-icon"`, `"right-icon"`, `"edit-icon"`, `"Profile"`) — assistive text, not UI copy
- Developer comments
- Dynamic values: `user?.email`, `language.name`, `currency.code`

---

## 3. Files Produced

| File | Purpose |
|---|---|
| `resources/js/locales/vi.json` | Vietnamese translation dictionary |
| `resources/js/template/components/Setting.tsx` | Refactored component using `useTranslation` |

---

## 4. Translation File — `resources/js/locales/vi.json`

Stored at `resources/js/locales/vi.json`. Pattern: Natural Language Keys.

```json
{
  "Loading…": "Đang tải…",
  "Wallets & Accounts": "Ví & Tài khoản",
  "Categories": "Danh mục",
  "Subscriptions": "Đăng ký",
  "Personal Info": "Thông tin cá nhân",
  "Security": "Bảo mật",
  "Marketing Preferences": "Tùy chọn tiếp thị",
  "Notification Setting": "Cài đặt thông báo",
  "Language": "Ngôn ngữ",
  "Currency": "Tiền tệ",
  "FAQs": "Câu hỏi thường gặp",
  "Data & Privacy Policy": "Dữ liệu & Chính sách quyền riêng tư",
  "Contact Us": "Liên hệ chúng tôi",
  "Dark Mode": "Chế độ tối",
  "Light Mode": "Chế độ sáng",
  "Delete or Deactivate Account": "Xóa hoặc vô hiệu hóa tài khoản",
  "Logout": "Đăng xuất"
}
```

---

## 5. Component Changes — `Setting.tsx`

### 5a. Imports added

```tsx
import { useTranslation } from 'react-i18next';
```

### 5b. Hook initialized — two call sites

```tsx
// Inside SettingOption (sub-component)
const { t } = useTranslation();

// Inside Setting (main component)
const { t } = useTranslation();
```

### 5c. Translation sites

The `SettingOption` sub-component translates the `title` prop internally:

```tsx
// Before
<h3>{title}</h3>

// After
<h3>{t(title)}</h3>
```

This means every menu item string is translated at the point of rendering.
The call site continues to pass the English key as a plain string — no call-site
changes are required when adding new menu items.

Inline text in the main component:

```tsx
// Before
{user?.name ?? 'Loading…'}
{isDarkMode ? 'Dark Mode' : 'Light Mode'}
<h3>Logout</h3>

// After
{user?.name ?? t('Loading…')}
{isDarkMode ? t('Dark Mode') : t('Light Mode')}
<h3>{t('Logout')}</h3>
```

### 5d. What was NOT changed

- No business logic modified
- No component structure changed
- No variables, functions, interfaces, or props renamed
- No styling or layout altered
- TypeScript types preserved
- All non-i18n imports preserved
- Dynamic values (`language.name`, `currency.code`) left untranslated — they are
  runtime data, not UI copy

---

## 6. Prerequisites Before Going Live

The following steps must be completed before `useTranslation` resolves at runtime.
The component has already been refactored — only the bootstrap work below remains.

### Step 1 — Install `react-i18next`

```bash
npm install react-i18next i18next i18next-http-backend i18next-browser-languagedetector
```

### Step 2 — Create i18n configuration

Create `resources/js/i18n.ts`:

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
    },
    lng: 'en',           // default language
    fallbackLng: 'en',   // fall back to key (English) when no translation found
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
```

> **Note:** With `fallbackLng: 'en'`, no `en.json` is required. When the key
> itself is the English string, the key is returned verbatim as the fallback.

### Step 3 — Import config in App.tsx

```tsx
// Add this import near the top of App.tsx, before any component imports
import './i18n';
```

### Step 4 — Wire language switching to i18n

When the user picks a language in `Language.tsx`, call `i18n.changeLanguage()`:

```tsx
import i18n from '../i18n';

// Inside setLanguage handler:
setLanguage(lang);
i18n.changeLanguage(lang.code); // 'vi', 'en-US', etc.
```

Map language codes to i18n namespaces as additional locale files are added.

---

## 7. Expanding to Other Pages

To extend this POC to other pages:

1. Add the `import { useTranslation } from 'react-i18next';` import
2. Initialize `const { t } = useTranslation();` inside the component
3. Wrap visible strings: `"Some text"` → `{t("Some text")}`
4. Add the new strings to `vi.json` (and any future locale files)

No configuration change needed — the same `i18n.ts` bootstrap is shared by the
whole app.

---

## 8. Risk & Rollback

| Risk | Mitigation |
|---|---|
| `react-i18next` not installed — runtime `useTranslation is not a function` | Install per Step 1 before deploying |
| Missing Vietnamese key — shows English key | Intended behavior (`fallbackLng: 'en'`); add to vi.json incrementally |
| Conflict with existing `TranslationContext.jsx` | No conflict — both can coexist; custom context serves a different purpose |
| Dynamic language name (`language.name`) shows in English | These are data values, not UI copy; translate in `LanguageContext.tsx` if needed |
