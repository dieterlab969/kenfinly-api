<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    protected $fillable = [
        'ip_address',
        'reason',
        'blocked_until',
        'block_count',
        'is_permanent',
    ];

    protected $casts = [
        'blocked_until' => 'datetime',
        'is_permanent' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function isBlocked(string $ipAddress): bool
    {
        $block = self::where('ip_address', $ipAddress)->first();

        if (!$block) {
            return false;
        }

        if ($block->is_permanent) {
            return true;
        }

        if ($block->blocked_until && $block->blocked_until->isFuture()) {
            return true;
        }

        if ($block->blocked_until && $block->blocked_until->isPast()) {
            $block->delete();
            return false;
        }

        return false;
    }

    public static function blockIp(
        string $ipAddress,
        string $reason,
        ?int $durationMinutes = null,
        bool $isPermanent = false
    ): self {
        $existing = self::where('ip_address', $ipAddress)->first();

        if ($existing) {
            $existing->update([
                'reason' => $reason,
                'blocked_until' => $durationMinutes ? now()->addMinutes($durationMinutes) : null,
                'block_count' => $existing->block_count + 1,
                'is_permanent' => $isPermanent || $existing->is_permanent,
            ]);
            return $existing;
        }

        return self::create([
            'ip_address' => $ipAddress,
            'reason' => $reason,
            'blocked_until' => $durationMinutes ? now()->addMinutes($durationMinutes) : null,
            'is_permanent' => $isPermanent,
        ]);
    }

    public static function unblockIp(string $ipAddress): bool
    {
        return self::where('ip_address', $ipAddress)->delete() > 0;
    }
}
