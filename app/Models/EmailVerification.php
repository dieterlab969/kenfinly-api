<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class EmailVerification extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'token',
        'email',
        'expires_at',
        'verified_at',
        'ip_address',
        'attempts',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function createForUser(User $user, int $expirationHours = 24): self
    {
        $verification = self::create([
            'user_id' => $user->id,
            'token' => self::generateToken(),
            'email' => $user->email,
            'expires_at' => now()->addHours($expirationHours),
            'ip_address' => request()->ip(),
        ]);

        return $verification;
    }

    public static function generateToken(): string
    {
        return hash('sha256', Str::random(60) . time());
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    public function incrementAttempts(): void
    {
        $this->increment('attempts');
    }

    public function markAsVerified(): void
    {
        $this->update([
            'verified_at' => now(),
            'ip_address' => request()->ip(),
        ]);
    }

    public static function findByToken(string $token): ?self
    {
        return self::where('token', $token)->first();
    }

    public static function findValidToken(string $token): ?self
    {
        return self::where('token', $token)
            ->where('expires_at', '>', now())
            ->whereNull('verified_at')
            ->first();
    }
}
