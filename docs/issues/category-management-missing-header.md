# Issue: CategoryManagement Page Missing Standard Header

**Date:** 2026-06-24  
**Severity:** UI/UX — visual regression (header absent, layout broken)  
**Status:** Fixed

---

## Root Cause

`CategoryManagement.tsx` was created using an **incorrect set of CSS class names** that do not exist in the template's design system. The template uses a specific layout hierarchy governed by `style.css` / `swap.css`. The page was authored with class names borrowed from a different component family (`body-main-sec`, `header-nav-fixed`, `search-bar`, `form-control`), so none of the template's structural CSS rules ever applied — leaving the page with no visible header, no styled rows, and unstyled form fields.

Additionally, the `BackBtn` component was called with a `BackBtnIcon` prop it does not accept (the component imports that asset internally and accepts zero props).

---

## Comparison: Incorrect vs Correct Class Names

| Element | ❌ Used (broken) | ✅ Required (template) |
|---|---|---|
| Outer wrapper | `body-main-sec` | `site-content → verify-number-main` |
| Header bar | `header-nav-fixed` | `verify-number-top → container → verify-number-top-content` |
| Back button slot | `<BackBtn BackBtnIcon={…} />` | `<div className="back-btn"><BackBtn /></div>` (no props) |
| Title slot | `<h1 className="title">` | `<div className="header-title"><p>…</p></div>` |
| Search bar | `<div className="search-bar">` | `<div className="contact-search"><div className="input-group contact-searchbar">…</div></div>` |
| Body area | `body-main` | `verify-number-bottom → verify-number-bottom-wrap → verify-number-content` |
| List wrapper | `send-money-contact-tab` | `transfer-to-bank → transfer-first` |
| Row icon | *(inline div)* | `<div className="bank-img">` |
| Row details | `contact-details` | `<div className="bank-details">` |
| Row actions | *(inline div)* | `<div className="bank-active-sec">` |
| Form field | `<div className="mb-3">` | `<div className="personal-name mt-0 mb-3">` |
| Input styling | `className="form-control"` | `className="px-0"` |
| Select styling | `className="form-control"` | `className="px-0"` + inline border-bottom |
| Submit button | custom inline gradient | `<div className="verify-number-btn"><button>…</button></div>` |

---

## Proposed Solution

Rewrite `CategoryManagement.tsx` rendering to use the **exact same layout skeleton** as `WalletManagement.tsx` (the established gold-standard page). All business logic, TypeScript types, state, and handlers are preserved — only the JSX structure and class names change.

Specifically:
1. Wrap everything in `<div><div className="site-content"><div className="verify-number-main">…`
2. Render the purple gradient header via `verify-number-top → container → verify-number-top-content`
3. Use `<BackBtn />` (no props) for the list back button; use an inline `<img src={BackBtnIcon}>` button for sub-view back navigation
4. Use `verify-number-bottom → verify-number-bottom-wrap → verify-number-content` for the scrollable body
5. Render list rows as `transfer-to-bank → transfer-first` with `bank-img`, `bank-details`, `bank-active-sec` inside
6. Use `personal-name` divs with `px-0` inputs/selects for form fields
7. Use `verify-number-btn` for the primary action button

---

## Impacted Files

| File | Change |
|---|---|
| `resources/js/template/pages/CategoryManagement.tsx` | Full rendering rewrite — classes and layout structure corrected |
| `docs/issues/category-management-missing-header.md` | This document (created) |

**No other files are modified.** Backend, routes, policy, migration, tests, `App.tsx`, `Setting.tsx` are all untouched.

---

## Validation Steps

1. **Visual check** — navigate to `/CategoryManagement`: purple gradient header with title "Categories" and back button must be visible
2. **Regression check** — navigate to `/WalletManagement`: must be identical to before
3. **Test suite** — `php artisan test` must report all tests passing
4. **Sub-view check** — tap Add (+): header must change to "New Category"; back button returns to list
5. **Edit check** — tapping edit on a user-owned category opens "Edit Category" header
6. **Lock check** — system categories show 🔒 System badge with no edit/delete buttons
