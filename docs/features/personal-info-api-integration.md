# Personal Info – API Integration Change Plan

## Overview

Refactored `resources/js/template/pages/PersonalInfo.tsx` from a fully static mockup into a live, API-backed profile management screen.

---

## Backend Changes

### 1. New Migration — `2026_06_24_000001_add_profile_fields_to_users_table.php`

Added three nullable columns to the `users` table:

| Column          | Type         | Notes                         |
|-----------------|--------------|-------------------------------|
| `phone`         | VARCHAR(30)  | E.164-compatible phone number |
| `date_of_birth` | DATE         | Past dates only               |
| `gender`        | VARCHAR(20)  | Enum-style: see allowed values |

### 2. User Model — `app/Models/User.php`

- Added `phone`, `date_of_birth`, `gender` to `$fillable`.
- Added `'date_of_birth' => 'date'` to `casts()` so Carbon handles formatting.

### 3. ProfileController — `app/Http/Controllers/Api/ProfileController.php`

**`GET /api/profile`** — `show()`  
Now returns `phone`, `date_of_birth` (formatted as `Y-m-d`), `gender`, and `avatar` in the `profile` payload.

**`PUT /api/profile`** — `update()`  
Accepts and validates any subset of the four editable fields:

| Field           | Rules                                                           |
|-----------------|-----------------------------------------------------------------|
| `name`          | `sometimes|required|string|min:2|max:100`                       |
| `phone`         | `sometimes|nullable|string|max:30|regex:/^[+\d\s\-().]{0,30}$/`|
| `date_of_birth` | `sometimes|nullable|date|before:today`                          |
| `gender`        | `sometimes|nullable|in:male,female,other,prefer_not_to_say`     |

- Only the fields present in the request body are updated (partial update pattern via `ARRAY_FILTER_USE_BOTH`).
- Returns HTTP 422 with a structured `errors` object on validation failure.
- Extracted a private `formatProfile()` helper to avoid duplication between `show()` and `update()`.

---

## Frontend Changes

### `resources/js/template/pages/PersonalInfo.tsx` (full rewrite)

#### State Management

| State          | Purpose                                              |
|----------------|------------------------------------------------------|
| `profile`      | Raw profile data loaded from API                     |
| `form`         | Live draft values for all editable fields            |
| `editingFields`| `Set<EditableField>` — tracks which fields are open  |
| `fieldErrors`  | Per-field validation error strings                   |
| `loading`      | True while the initial GET is in flight              |
| `saving`       | True while the PUT is in flight                      |
| `fetchError`   | Holds a fetch-level error string                     |
| `successMsg`   | Auto-clearing success banner (4 s timeout)           |
| `saveError`    | Non-field-level save error                           |

#### UX Flow

1. **Mount** → `GET /api/profile` via the shared `api` axios instance (JWT token attached automatically).
2. **Loading skeleton** — five shimmer rows while the request is in flight.
3. **Fetch error** — friendly error message with a "Try Again" button.
4. **Per-field inline editing** — clicking the ✏️ icon on any field switches it to an input element; the icon changes to ✕ (cancel). Multiple fields can be edited simultaneously.
5. **"Update Changes" button** — only enabled when at least one field is in edit mode; submits only the dirty fields as a partial PUT payload.
6. **"Cancel All Changes" button** — appears below the submit button when any field is being edited; reverts all drafts and closes all inputs.
7. **Frontend validation** runs before the API call; per-field errors render inline below the input.
8. **API 422 errors** are mapped back to their respective field inputs.
9. **Success banner** auto-dismisses after 4 seconds.

#### Field Rules

| Field           | Input type | Editable | Notes                              |
|-----------------|------------|----------|------------------------------------|
| Name            | text       | ✅       | Required, 2–100 chars              |
| Email Address   | —          | ❌       | Read-only; shows Verified badge    |
| Phone Number    | tel        | ✅       | Optional; E.164-style validation   |
| Date of Birth   | date       | ✅       | Optional; capped at today          |
| Gender          | select     | ✅       | 4 options + prefer not to say      |

#### Preserved from Original

- Existing CSS class structure: `verify-number-main`, `personal-info-main`, `personal-name`, `verify-number-btn`, etc.
- Profile avatar display (upload is visually present but disabled, labelled "coming soon").
- `BackBtn` component.
- Mobile-first layout.

#### New Inline Styles (scoped via `<style>` tag)

| Class/selector          | Purpose                              |
|-------------------------|--------------------------------------|
| `.personal-field-value` | Renders saved value in view mode     |
| `.personal-edit-btn`    | Ghost icon button for edit/cancel    |
| `.personal-field-input` | Consistent text/date input styling   |
| `.personal-field-select`| Select element matching input style  |
| `.pi-alert-success`     | Green success banner                 |
| `.pi-alert-error`       | Red error banner                     |
| `@keyframes pi-spin`    | CSS spinner animation                |

---

## API Endpoints Used

| Method | Path          | Purpose              |
|--------|---------------|----------------------|
| GET    | `/api/profile`| Fetch current profile|
| PUT    | `/api/profile`| Save updated fields  |

Both routes are protected by the `auth:api` middleware (JWT required).

---

## Testing Checklist

- [ ] Load page: profile data appears within the fields.
- [ ] Click ✏️ on Name → field becomes editable; ✕ cancels it.
- [ ] Edit Name + Phone simultaneously → both appear in the PUT payload.
- [ ] Submit with blank Name → inline "Name is required." error shown.
- [ ] Submit with invalid phone characters → inline error shown.
- [ ] Submit with future DOB → inline error shown.
- [ ] Successful save → "Profile updated successfully." banner appears, inputs close.
- [ ] Network error during save → red error banner.
- [ ] "Cancel All Changes" reverts all fields and closes all inputs.
- [ ] Email row always shows the lock icon and cannot be edited.
