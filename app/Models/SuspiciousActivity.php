<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuspiciousActivity extends Model
{
    protected $fillable = [
        'ip_address',
        'email',
        'username',
        'reason',
        'user_agent',
        'request_data',
        'severity',
    ];

    protected $casts = [
        'request_data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function log(
        string $ipAddress,
        string $reason,
        ?string $email = null,
        ?string $username = null,
        ?string $userAgent = null,
        ?array $requestData = null,
        string $severity = 'medium'
    ): self {
        return self::create([
            'ip_address' => $ipAddress,
            'email' => $email,
            'username' => $username,
            'reason' => $reason,
            'user_agent' => $userAgent,
            'request_data' => $requestData,
            'severity' => $severity,
        ]);
    }

    public static function countRecentByIp(string $ipAddress, int $minutes = 60): int
    {
        return self::where('ip_address', $ipAddress)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count();
    }

    public static function hasRecentHighSeverity(string $ipAddress, int $minutes = 60): bool
    {
        return self::where('ip_address', $ipAddress)
            ->where('severity', 'high')
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->exists();
    }
}
