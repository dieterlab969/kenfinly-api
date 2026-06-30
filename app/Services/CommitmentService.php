<?php

namespace App\Services;

use App\Models\Commitment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Standard 10 — Secure Commitment Asset Upload.
 *
 * Hashes filenames, enforces MIME allowlist (jpeg/png only), 5MB cap.
 * Stored under storage/app/public/commitments/<user_id>/<uuid>.<ext>.
 */
class CommitmentService
{
    private const MAX_BYTES = 5 * 1024 * 1024;

    /** @var string[] */
    private const ALLOWED_MIMES = ['image/jpeg', 'image/png'];

    public function create(User $user, array $data, ?UploadedFile $image = null): Commitment
    {
        $imagePath = null;
        if ($image instanceof UploadedFile) {
            $imagePath = $this->storeImage($user, $image);
        }

        try {
            return DB::transaction(function () use ($user, $data, $imagePath) {
                return Commitment::create([
                    'user_id' => $user->id,
                    'title' => trim((string) $data['title']),
                    'goal_amount' => (int) $data['goal_amount'],
                    'current_amount' => 0,
                    'image_path' => $imagePath,
                    'deadline' => CarbonImmutable::parse($data['deadline'])->utc(),
                    'status' => 'active',
                ]);
            });
        } catch (\Throwable $e) {
            if ($imagePath) {
                Storage::disk('public')->delete($imagePath);
            }
            throw $e;
        }
    }

    public function complete(User $user, Commitment $commitment): Commitment
    {
        return DB::transaction(function () use ($user, $commitment) {
            $locked = Commitment::where('user_id', $user->id)
                ->whereKey($commitment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status !== 'active') {
                throw ValidationException::withMessages([
                    'commitment' => 'Only active commitments can be completed.',
                ]);
            }

            $locked->forceFill([
                'status' => 'completed',
                'completed_at' => CarbonImmutable::now('UTC'),
            ])->save();

            return $locked->fresh();
        });
    }

    public function kill(User $user, Commitment $commitment, ?string $reason): Commitment
    {
        return DB::transaction(function () use ($user, $commitment, $reason) {
            $locked = Commitment::where('user_id', $user->id)
                ->whereKey($commitment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status !== 'active') {
                throw ValidationException::withMessages([
                    'commitment' => 'Only active commitments can be killed.',
                ]);
            }

            $locked->forceFill([
                'status' => 'killed',
                'killed_at' => CarbonImmutable::now('UTC'),
                'kill_reason' => $reason,
            ])->save();

            return $locked->fresh();
        });
    }

    private function storeImage(User $user, UploadedFile $file): string
    {
        if (!$file->isValid()) {
            throw ValidationException::withMessages(['image' => 'The uploaded file is invalid.']);
        }

        if ($file->getSize() > self::MAX_BYTES) {
            throw ValidationException::withMessages(['image' => 'Image must not exceed 5MB.']);
        }

        $mime = (string) $file->getMimeType();
        if (!in_array($mime, self::ALLOWED_MIMES, true)) {
            throw ValidationException::withMessages(['image' => 'Only JPEG and PNG images are accepted.']);
        }

        $extension = $mime === 'image/png' ? 'png' : 'jpg';
        $hashed = Str::uuid()->toString() . '.' . $extension;
        $relativePath = 'commitments/' . $user->id . '/' . $hashed;

        Storage::disk('public')->putFileAs(
            'commitments/' . $user->id,
            $file,
            $hashed
        );

        return $relativePath;
    }
}
