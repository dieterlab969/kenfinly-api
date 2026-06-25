<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

/**
 * Handles secure avatar processing, storage, and lifecycle management.
 *
 * Responsibilities:
 *  - Magic-byte validation (defence-in-depth on top of Form Request rules).
 *  - Resize to a standard max dimension without distorting aspect ratio.
 *  - Encode all avatars as JPEG with a consistent compression quality.
 *  - Generate UUID-based, collision-resistant filenames.
 *  - Delete the previous locally-stored avatar before writing the new one
 *    to prevent orphaned files accumulating in storage.
 *  - Leave external OAuth avatar URLs (Google / Facebook) untouched during cleanup.
 */
class AvatarUploadService
{
    private const DISK          = 'public';
    private const DIRECTORY     = 'avatars';
    private const MAX_DIMENSION = 400;
    private const JPEG_QUALITY  = 82;

    /**
     * MIME types accepted for upload (magic-byte level check).
     * Must align with the mimes rule in AvatarUploadRequest.
     *
     * @var list<string>
     */
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
    ];

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Process, store, and persist a new avatar for the given user.
     *
     * Steps:
     *  1. Magic-byte MIME validation.
     *  2. Old avatar cleanup (local files only).
     *  3. UUID-based filename generation.
     *  4. Resize (scale down to MAX_DIMENSION × MAX_DIMENSION, preserve ratio).
     *  5. JPEG encoding with JPEG_QUALITY compression.
     *  6. Write to public storage disk.
     *  7. Persist the relative path to the user record.
     *
     * @param  User          $user  The authenticated user.
     * @param  UploadedFile  $file  The validated, uploaded file.
     * @return string               The full public URL of the stored avatar.
     *
     * @throws \InvalidArgumentException  When magic bytes reveal an invalid type.
     */
    public function upload(User $user, UploadedFile $file): string
    {
        $this->assertValidMimeType($file);

        $this->deleteOldAvatar($user);

        $relativePath = $this->buildPath();

        $encoded = Image::read($file)
            ->scaleDown(width: self::MAX_DIMENSION, height: self::MAX_DIMENSION)
            ->toJpeg(quality: self::JPEG_QUALITY)
            ->toString();

        Storage::disk(self::DISK)->put($relativePath, $encoded);

        $user->update(['avatar' => $relativePath]);

        return Storage::disk(self::DISK)->url($relativePath);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Build a UUID-based, collision-resistant file path inside the avatars directory.
     */
    private function buildPath(): string
    {
        return self::DIRECTORY . '/' . Str::uuid()->toString() . '.jpg';
    }

    /**
     * Validate the actual MIME type of the uploaded file by reading its magic bytes
     * (via PHP's finfo extension, not the client-supplied file extension).
     *
     * This is a second validation layer on top of the Form Request rules, guarding
     * against edge cases such as a non-image file whose extension has been renamed.
     *
     * @throws \InvalidArgumentException  When the detected MIME type is not allowed.
     */
    private function assertValidMimeType(UploadedFile $file): void
    {
        $detected = $file->getMimeType();

        if (! in_array($detected, self::ALLOWED_MIME_TYPES, strict: true)) {
            throw new \InvalidArgumentException(
                "Invalid file type. Only JPEG, PNG, and WebP images are accepted. " .
                "Detected: {$detected}."
            );
        }
    }

    /**
     * Delete the user's current avatar from local storage — but only when it is a
     * locally-stored path.  External OAuth URLs (Google, Facebook) are left untouched
     * since they are not owned by our storage layer.
     */
    private function deleteOldAvatar(User $user): void
    {
        $current = $user->avatar;

        if (blank($current)) {
            return;
        }

        // External URLs begin with "http" — skip them.
        if (str_starts_with($current, 'http')) {
            return;
        }

        if (Storage::disk(self::DISK)->exists($current)) {
            Storage::disk(self::DISK)->delete($current);
        }
    }
}
