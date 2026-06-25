<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Stores per-user notification toggle preferences.
 *
 * There is a one-to-one relationship with {@see User}, enforced by a unique
 * index on `user_id`. A row is auto-created on first access via
 * {@see self::defaults()} so callers never need a manual setup step.
 *
 * Only notification types that correspond to features actually present in the
 * Kenfinly application are included. Wallet / P2P payment notifications (QR
 * payments, money requests, direct transfers) have been intentionally omitted.
 *
 * @property int         $id
 * @property int         $user_id
 * @property bool        $notify_new_transaction   New transaction recorded on account.
 * @property bool        $notify_budget_alert      Budget threshold approaching / exceeded.
 * @property bool        $notify_large_transaction Unusually large transaction detected.
 * @property bool        $notify_savings_milestone Saving habit milestone or streak reached.
 * @property bool        $notify_account_invite    Collaboration invite received.
 * @property bool        $notify_subscription      Subscription renewal reminder.
 * @property bool        $notify_weekly_summary    Weekly spending summary digest.
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 *
 * @package App\Models
 */
class UserNotificationSetting extends Model
{
    /**
     * The attributes that are mass-assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'notify_new_transaction',
        'notify_budget_alert',
        'notify_large_transaction',
        'notify_savings_milestone',
        'notify_account_invite',
        'notify_subscription',
        'notify_weekly_summary',
    ];

    /**
     * Attribute type casts — all toggle columns returned as native PHP booleans.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'notify_new_transaction'   => 'boolean',
        'notify_budget_alert'      => 'boolean',
        'notify_large_transaction' => 'boolean',
        'notify_savings_milestone' => 'boolean',
        'notify_account_invite'    => 'boolean',
        'notify_subscription'      => 'boolean',
        'notify_weekly_summary'    => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The user who owns these notification settings.
     *
     * @return BelongsTo<User, UserNotificationSetting>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Return the application-default attribute values for a new user row.
     *
     * Most notifications default to ON so users receive important financial
     * alerts out of the box. Weekly summaries default to OFF as they are a
     * higher-frequency digest that users should opt into explicitly.
     *
     * @param  int   $userId
     * @return array<string, int|bool>
     */
    public static function defaults(int $userId): array
    {
        return [
            'user_id'                  => $userId,
            'notify_new_transaction'   => true,
            'notify_budget_alert'      => true,
            'notify_large_transaction' => true,
            'notify_savings_milestone' => true,
            'notify_account_invite'    => true,
            'notify_subscription'      => true,
            'notify_weekly_summary'    => false,
        ];
    }

    /**
     * Return only the notification toggle fields as an associative array,
     * suitable for API responses.
     *
     * @return array<string, bool>
     */
    public function toSettings(): array
    {
        return [
            'notify_new_transaction'   => $this->notify_new_transaction,
            'notify_budget_alert'      => $this->notify_budget_alert,
            'notify_large_transaction' => $this->notify_large_transaction,
            'notify_savings_milestone' => $this->notify_savings_milestone,
            'notify_account_invite'    => $this->notify_account_invite,
            'notify_subscription'      => $this->notify_subscription,
            'notify_weekly_summary'    => $this->notify_weekly_summary,
        ];
    }
}
