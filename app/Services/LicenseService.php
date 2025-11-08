<?php

namespace App\Services;

use App\Models\License;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Str;
use Carbon\Carbon;

class LicenseService
{
    public function generateLicenseKey(): string
    {
        return strtoupper(Str::random(8) . '-' . Str::random(8) . '-' . Str::random(8) . '-' . Str::random(8));
    }

    public function createLicense(User $user, Subscription $subscription, int $years = 1): License
    {
        return License::create([
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
            'license_key' => $this->generateLicenseKey(),
            'status' => 'active',
            'expires_at' => Carbon::now()->addYears($years),
            'activated_at' => now(),
            'max_users' => $subscription->plan_name === 'team' ? 10 : 1,
            'metadata' => [
                'plan' => $subscription->plan_name,
                'issued_at' => now()->toDateTimeString(),
            ],
        ]);
    }

    public function validateLicense(string $licenseKey): ?License
    {
        $license = License::where('license_key', $licenseKey)->first();

        if (!$license) {
            return null;
        }

        if ($license->isExpired()) {
            $license->update(['status' => 'expired']);
            return null;
        }

        return $license;
    }

    public function revokeLicense(License $license): bool
    {
        return $license->update(['status' => 'revoked']);
    }

    public function renewLicense(License $license, int $years = 1): License
    {
        $license->update([
            'status' => 'active',
            'expires_at' => Carbon::now()->addYears($years),
        ]);

        return $license->fresh();
    }
}
