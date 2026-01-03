<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;

class EncryptionService
{
    private const ALGORITHM = 'AES-256-CBC';

    /**
     * Encrypts a plain text string using Laravel's encryption facilities.
     *
     * Use this method to securely encrypt sensitive data before storage or transmission.
     * It wraps Laravel's Crypt::encryptString method and throws a RuntimeException if encryption fails.
     *
     * @param string $value The plain text string to encrypt.
     * @return string The encrypted string.
     *
     * @throws \RuntimeException Throws if encryption fails.
     */
    public static function encrypt(string $value): string
    {
        try {
            return Crypt::encryptString($value);
        } catch (\Exception $e) {
            throw new \RuntimeException("Encryption failed: {$e->getMessage()}");
        }
    }

    /**
     * Decrypts an encrypted string back to plain text.
     *
     * Use this method to retrieve the original value from encrypted data.
     * It wraps Laravel's Crypt::decryptString method and throws a RuntimeException if decryption fails.
     *
     * @param string $encrypted The encrypted string to decrypt.
     * @return string The decrypted plain text string.
     *
     * @throws \RuntimeException Throws if decryption fails.
     */
    public static function decrypt(string $encrypted): string
    {
        try {
            return Crypt::decryptString($encrypted);
        } catch (\Exception $e) {
            throw new \RuntimeException("Decryption failed: {$e->getMessage()}");
        }
    }

    /**
     * Generates a SHA-256 hash of a credential value.
     *
     * Use this method to create a secure hash representation of sensitive credentials
     * for verification or comparison without exposing the original value.
     *
     * @param string $value The credential value to hash.
     * @return string The SHA-256 hash of the input value.
     */
    public static function hashCredential(string $value): string
    {
        return hash('sha256', $value);
    }

    /**
     * Verifies a credential value against a given SHA-256 hash.
     *
     * Use this method to confirm if a plain credential matches a stored hash.
     *
     * @param string $value The plain credential value to verify.
     * @param string $hash The stored SHA-256 hash to compare against.
     * @return bool Returns true if the hash of the value matches the given hash; false otherwise.
     */
    public static function verifyCredential(string $value, string $hash): bool
    {
        return hash('sha256', $value) === $hash;
    }
}
