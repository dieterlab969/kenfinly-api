<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;

class EncryptionService
{
    private const ALGORITHM = 'AES-256-CBC';

    public static function encrypt(string $value): string
    {
        try {
            return Crypt::encryptString($value);
        } catch (\Exception $e) {
            throw new \RuntimeException("Encryption failed: {$e->getMessage()}");
        }
    }

    public static function decrypt(string $encrypted): string
    {
        try {
            return Crypt::decryptString($encrypted);
        } catch (\Exception $e) {
            throw new \RuntimeException("Decryption failed: {$e->getMessage()}");
        }
    }

    public static function hashCredential(string $value): string
    {
        return hash('sha256', $value);
    }

    public static function verifyCredential(string $value, string $hash): bool
    {
        return hash('sha256', $value) === $hash;
    }
}
