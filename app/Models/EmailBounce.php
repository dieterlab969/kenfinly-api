<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailBounce extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'bounce_type',
        'bounce_reason',
        'bounce_details',
        'email_type',
        'user_id',
        'bounce_count',
        'first_bounced_at',
        'last_bounced_at',
    ];

    protected $casts = [
        'first_bounced_at' => 'datetime',
        'last_bounced_at' => 'datetime',
    ];

    /**
     * Get the user associated with this bounce
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record a new bounce or update existing record
     */
    public static function recordBounce(
        string $email,
        string $bounceType,
        ?string $bounceReason = null,
        ?array $details = null,
        ?string $emailType = null,
        ?int $userId = null
    ): self {
        $bounce = self::where('email', $email)->first();

        if ($bounce) {
            // Update existing bounce record
            $bounce->update([
                'bounce_type' => $bounceType,
                'bounce_reason' => $bounceReason,
                'bounce_details' => $details ? json_encode($details) : null,
                'bounce_count' => $bounce->bounce_count + 1,
                'last_bounced_at' => now(),
            ]);
        } else {
            // Create new bounce record
            $bounce = self::create([
                'email' => $email,
                'bounce_type' => $bounceType,
                'bounce_reason' => $bounceReason,
                'bounce_details' => $details ? json_encode($details) : null,
                'email_type' => $emailType,
                'user_id' => $userId,
                'bounce_count' => 1,
                'first_bounced_at' => now(),
                'last_bounced_at' => now(),
            ]);
        }

        return $bounce;
    }

    /**
     * Check if an email should be blocked from receiving emails
     */
    public static function shouldBlockEmail(string $email): bool
    {
        $bounce = self::where('email', $email)->first();

        if (!$bounce) {
            return false;
        }

        // Block if hard bounce or multiple soft bounces
        if ($bounce->bounce_type === 'hard') {
            return true;
        }

        if ($bounce->bounce_type === 'soft' && $bounce->bounce_count >= 3) {
            return true;
        }

        return false;
    }

    /**
     * Get bounce statistics
     */
    public static function getStatistics(int $hours = 24): array
    {
        $since = now()->subHours($hours);

        return [
            'total_bounces' => self::where('last_bounced_at', '>=', $since)->count(),
            'hard_bounces' => self::where('last_bounced_at', '>=', $since)
                ->where('bounce_type', 'hard')
                ->count(),
            'soft_bounces' => self::where('last_bounced_at', '>=', $since)
                ->where('bounce_type', 'soft')
                ->count(),
            'unique_emails' => self::where('last_bounced_at', '>=', $since)
                ->distinct()
                ->count('email'),
            'blocked_emails' => self::where(function ($query) {
                $query->where('bounce_type', 'hard')
                    ->orWhere(function ($q) {
                        $q->where('bounce_type', 'soft')
                            ->where('bounce_count', '>=', 3);
                    });
            })->count(),
        ];
    }
}
