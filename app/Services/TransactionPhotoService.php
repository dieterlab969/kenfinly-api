<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\TransactionPhoto;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TransactionPhotoService
{
    const MAX_PHOTO_SIZE = 20480;
    const MAX_PHOTOS_PER_TRANSACTION = 10;
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    public function uploadPhoto(Transaction $transaction, UploadedFile $file, User $uploader): TransactionPhoto
    {
        $this->validatePhoto($file);
        $this->validatePhotoCount($transaction);

        $filePath = $file->store('receipts', 'public');

        return TransactionPhoto::create([
            'transaction_id' => $transaction->id,
            'uploaded_by' => $uploader->id,
            'file_path' => $filePath,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);
    }

    public function deletePhoto(TransactionPhoto $photo): bool
    {
        Storage::disk('public')->delete($photo->file_path);
        return $photo->delete();
    }

    protected function validatePhoto(UploadedFile $file): void
    {
        $fileSizeKB = $file->getSize() / 1024;
        
        if ($fileSizeKB > self::MAX_PHOTO_SIZE) {
            throw new \Exception(
                "Photo size ({$fileSizeKB}KB) exceeds the maximum allowed size of " . 
                self::MAX_PHOTO_SIZE . "KB (20MB). Please remove or resize the photo and try again."
            );
        }

        if (!in_array($file->getMimeType(), self::ALLOWED_MIME_TYPES)) {
            throw new \Exception(
                "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
            );
        }
    }

    protected function validatePhotoCount(Transaction $transaction): void
    {
        $currentCount = $transaction->photos()->count();
        
        if ($currentCount >= self::MAX_PHOTOS_PER_TRANSACTION) {
            throw new \Exception(
                "Maximum number of photos (" . self::MAX_PHOTOS_PER_TRANSACTION . 
                ") reached for this transaction."
            );
        }
    }
}
