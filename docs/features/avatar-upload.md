# Avatar Upload — Technical Summary

## Overview

Secure, optimised avatar upload for authenticated users. Uploads are processed through a dedicated service layer, resized to a standard dimension, compressed to JPEG, stored with collision-resistant filenames, and the previous avatar is automatically cleaned up before the new one is written.

---

## Architecture

```
POST /api/profile/avatar
        │
        ▼
AvatarUploadRequest  ← Form Request validation (required, image, mimes, max:2048)
        │
        ▼
ProfileController@uploadAvatar
        │
        ▼
AvatarUploadService  ← magic-byte check, old-avatar delete, resize, compress, store
        │
        ▼
Storage::disk('public')  ←  storage/app/public/avatars/{uuid}.jpg
        │
        ▼
users.avatar = 'avatars/{uuid}.jpg'
```

---

## API Contract

### `POST /api/profile/avatar`

| | |
|---|---|
| **Auth** | `Bearer <jwt-token>` (required) |
| **Content-Type** | `multipart/form-data` |
| **Body field** | `avatar` — image file (JPEG / PNG / WebP, max 2 MB) |

#### Success — `200 OK`
```json
{
  "success":    true,
  "message":    "Avatar uploaded successfully.",
  "avatar_url": "http://example.com/storage/avatars/550e8400-e29b-41d4-a716-446655440000.jpg",
  "profile": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com",
    "phone": null,
    "address": null,
    "date_of_birth": null,
    "gender": null,
    "avatar": "http://example.com/storage/avatars/550e8400-…",
    "email_verified": true,
    "status": "active",
    "roles": ["owner"],
    "created_at": "2026-06-25T00:00:00.000000Z",
    "updated_at": "2026-06-25T12:00:00.000000Z"
  }
}
```

#### Validation failure — `422 Unprocessable Entity`
```json
{
  "success": false,
  "errors": {
    "avatar": ["Avatar file size must not exceed 2 MB."]
  }
}
```

#### Auth failure — `401 Unauthorized`
```json
{ "message": "Unauthenticated." }
```

---

## Validation Rules

| Layer | Rule | Detail |
|---|---|---|
| Form Request | `required` | Field must be present |
| Form Request | `image` | PHP's `getimagesize()` — rejects non-images |
| Form Request | `mimes:jpeg,jpg,png,webp` | finfo magic-byte MIME check (not extension) |
| Form Request | `max:2048` | File size ≤ 2 048 KB (2 MB) |
| Service | Magic-byte cross-check | `getMimeType()` vs allowed list — defence in depth |

---

## Image Processing

| Step | Detail |
|---|---|
| **Read** | `Intervention\Image\Laravel\Facades\Image::read($file)` |
| **Resize** | `scaleDown(width: 400, height: 400)` — never upscales, preserves aspect ratio |
| **Encode** | `toJpeg(quality: 82)` — always outputs JPEG regardless of input format |
| **Driver** | GD (PHP built-in; Imagick not available in this environment) |

All uploaded avatars are normalised to JPEG. This means:
- Transparent PNG backgrounds become white.
- Animated GIF/WebP animation is rejected by the `mimes` rule before processing.

---

## Storage

| Property | Value |
|---|---|
| **Disk** | `public` (`storage/app/public`) |
| **Directory** | `avatars/` |
| **Filename** | `{uuid-v4}.jpg` (e.g. `550e8400-e29b-41d4-a716-446655440000.jpg`) |
| **Public URL** | `/storage/avatars/{uuid}.jpg` |
| **Symlink** | `public/storage → storage/app/public` (created via `artisan storage:link`) |

---

## Old Avatar Cleanup

Before writing a new avatar the service calls `deleteOldAvatar()`:

- **`null` / empty** → skipped.
- **Starts with `http`** → skipped (external OAuth URL from Google / Facebook — not our file).
- **Relative path** (e.g. `avatars/old.jpg`) → `Storage::disk('public')->delete($path)` called only if the file exists.

This prevents orphaned files accumulating without risking accidental deletion of third-party URLs.

---

## Database

Column `avatar` (`VARCHAR`, nullable) on the `users` table was already present (migration `2026_06_21_000001`). **No new migration required.**

The column stores:

| Source | Stored value | Example |
|---|---|---|
| OAuth (Google/FB) | Full external URL | `https://lh3.googleusercontent.com/photo.jpg` |
| Uploaded file | Relative storage path | `avatars/550e8400-….jpg` |

`ProfileController::resolveAvatarUrl()` normalises both formats into a full public URL before returning them in API responses. The frontend always receives a fully qualified URL (or `null`).

---

## Frontend Integration

### `Setting.tsx`

- Fetches `GET /api/profile` on mount via `api.js`.
- Displays real `name`, `email`, and `avatar` in the profile header.
- Shows a loading skeleton while the request is in flight.
- Falls back to `localStorage` cache for instant paint, then updates after the API responds.
- On success, refreshes the `localStorage` `user` key so other components stay in sync.

### `PersonalInfo.tsx`

- Avatar section wired to `POST /api/profile/avatar` via `FormData`.
- **Client-side pre-validation** before any network request: MIME type and 2 MB cap.
- **Optimistic preview**: `URL.createObjectURL()` applied immediately for instant visual feedback.
- **Upload indicator**: spinner replaces camera icon while the request is in flight.
- **Error handling**: optimistic preview reverted on failure; server error message surfaced.
- **Hover overlay**: "Change" label appears on hover, indicating the avatar is clickable.
- On success, updates `profile.avatar` in component state and syncs `localStorage`.

---

## Files Changed

| File | Action |
|---|---|
| `app/Http/Requests/AvatarUploadRequest.php` | Created |
| `app/Services/AvatarUploadService.php` | Created |
| `app/Http/Controllers/Api/ProfileController.php` | `uploadAvatar` added; `resolveAvatarUrl` helper added; `AvatarUploadService` injected |
| `routes/api.php` | `POST /api/profile/avatar` route added |
| `resources/js/template/components/Setting.tsx` | Real user data (name, email, avatar) fetched from API on mount |
| `resources/js/template/pages/PersonalInfo.tsx` | Avatar upload wired up (file input, FormData, optimistic preview, error states) |
| `tests/Feature/AvatarUploadTest.php` | Created — 16 test cases |
| `docs/features/avatar-upload.md` | This document |

---

## Test Coverage

`tests/Feature/AvatarUploadTest.php` — **16 test cases**

| # | Test | Asserts |
|---|---|---|
| 1 | `unauthenticated_user_cannot_upload_avatar` | 401 |
| 2 | `authenticated_user_can_upload_a_valid_avatar` | 200, JSON shape |
| 3 | `upload_stores_file_in_the_avatars_directory` | File on disk, correct path prefix |
| 4 | `uploaded_filename_is_uuid_based_and_has_jpg_extension` | Regex match |
| 5 | `avatar_url_in_response_points_to_the_stored_file` | URL contains `avatars/` |
| 6 | `upload_accepts_png_images` | 200 |
| 7 | `upload_accepts_webp_images` | 200 |
| 8 | `old_local_avatar_is_deleted_before_new_one_is_stored` | `assertMissing` old, `assertExists` new |
| 9 | `oauth_avatar_url_is_not_deleted_during_upload` | No exception; new file stored |
| 10 | `user_without_existing_avatar_can_upload_without_errors` | 200 |
| 11 | `get_profile_returns_updated_avatar_url_after_upload` | GET /api/profile reflects new avatar |
| 12 | `upload_fails_when_no_file_is_provided` | 422, correct error message |
| 13 | `upload_fails_when_file_exceeds_2mb` | 422, correct error message |
| 14 | `upload_fails_when_file_mime_type_is_not_an_image` | 422 |
| 15 | `upload_fails_for_a_non_image_file_with_a_renamed_jpg_extension` | 422 |
| 16 | `upload_fails_when_file_type_is_gif` | 422 |
| 17 | `avatar_relative_path_is_persisted_to_the_database` | `assertDatabaseHas` |
| 18 | `second_upload_replaces_first_and_leaves_only_one_file_in_storage` | Old missing, new exists, UUIDs differ |
