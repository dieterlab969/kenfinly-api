<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

/**
 * User model — the central entity of the Kenfinly application.
 *
 * Represents a registered user account with:
 *  - JWT-based API authentication (implements JWTSubject)
 *  - Role-Based Access Control via a many-to-many `roles` pivot
 *  - Subscription lifecycle management (trial → active → expired)
 *  - Relationships to accounts, transactions, Halo ledger, Pomodoro state,
 *    saving habits, licenses, payments, invitations, and email verifications
 *
 * Subscription status flow:
 *  trial → active (after successful PayOS payment)
 *        → expired (trial_ends_at or subscription_expires_at elapsed)
 *
 * @property int              $id
 * @property string           $name
 * @property string           $email
 * @property string           $password               Bcrypt-hashed
 * @property int|null         $language_id
 * @property string           $status                 "pending" | "active" | "suspended"
 * @property bool             $is_suspended
 * @property int              $halo_points_balance    Running total of Halo points
 * @property \Carbon\Carbon|null $email_verified_at
 * @property string|null      $timezone
 * @property int|null         $hourly_rate            VND per hour for Halo sessions
 * @property \Carbon\Carbon|null $rate_updated_at
 * @property \Carbon\Carbon|null $hourly_rate_locked_until
 * @property int              $current_streak         Consecutive Halo days
 * @property int              $longest_streak         All-time longest streak
 * @property \Carbon\Carbon|null $last_halo_date       Date of last completed Halo session
 * @property string           $subscription_status    "trial" | "active" | "expired"
 * @property string           $subscription_plan      "free" | "monthly" | "yearly"
 * @property \Carbon\Carbon|null $trial_ends_at
 * @property \Carbon\Carbon|null $subscription_expires_at
 * @property \Carbon\Carbon   $created_at
 * @property \Carbon\Carbon   $updated_at
 */
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'facebook_id',
        'language_id',
        'status',
        'is_suspended',
        'halo_points_balance',
        'email_verified_at',
        'timezone',
        'hourly_rate',
        'rate_updated_at',
        'hourly_rate_locked_until',
        'current_streak',
        'longest_streak',
        'last_halo_date',
        'subscription_status',
        'subscription_plan',
        'trial_ends_at',
        'subscription_expires_at',
        'country_code',
        'currency',
        'phone',
        'date_of_birth',
        'gender',
        'address',
        'is_2fa_enabled',
        'is_biometric_enabled',
        'login_notifications_enabled',
        'security_alerts_enabled',
        'pin_hash',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast to native types.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'        => 'datetime',
            'password'                 => 'hashed',
            'status'                   => 'string',
            'is_suspended'             => 'boolean',
            'halo_points_balance'      => 'integer',
            'rate_updated_at'          => 'datetime',
            'hourly_rate_locked_until' => 'datetime',
            'last_halo_date'           => 'date',
            'date_of_birth'            => 'date',
            'hourly_rate'              => 'integer',
            'current_streak'           => 'integer',
            'longest_streak'           => 'integer',
            'trial_ends_at'                  => 'datetime',
            'subscription_expires_at'        => 'datetime',
            'is_2fa_enabled'                 => 'boolean',
            'is_biometric_enabled'           => 'boolean',
            'login_notifications_enabled'    => 'boolean',
            'security_alerts_enabled'        => 'boolean',
        ];
    }

    // ── JWT ───────────────────────────────────────────────────────────────

    /**
     * Get the identifier stored in the subject claim of the JWT.
     *
     * Required by the JWTSubject contract. Returns the model's primary key.
     *
     * @return mixed  The user's primary key value.
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key-value array of custom claims to add to the JWT payload.
     *
     * Currently no extra claims are added. Override to embed roles, plan,
     * or other data that should travel with the token without a DB round-trip.
     *
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    // ── Relationships ─────────────────────────────────────────────────────

    /**
     * Get the financial accounts owned by this user.
     *
     * @return HasMany<Account>
     */
    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    /**
     * Get the attendance records for this user.
     *
     * @return HasMany<Attendance>
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get the append-only hourly rate governance log entries for this user.
     *
     * Each row records a rate change event; the current rate is the latest entry.
     *
     * @return HasMany<UserRateLog>
     */
    public function hourlyRateChanges(): HasMany
    {
        return $this->hasMany(UserRateLog::class);
    }

    /**
     * Get the commitments associated with this user.
     *
     * @return HasMany<Commitment>
     */
    public function commitments(): HasMany
    {
        return $this->hasMany(Commitment::class);
    }

    /**
     * Get the completed or interrupted Pomodoro sessions for this user.
     *
     * @return HasMany<PomodoroSession>
     */
    public function pomodoroSessions(): HasMany
    {
        return $this->hasMany(PomodoroSession::class);
    }

    /**
     * Get the persisted active Pomodoro state rows for this user.
     *
     * In the current implementation a single row is maintained per user even
     * though the relation type is has-many.
     *
     * @return HasMany<PomodoroActiveState>
     */
    public function pomodoroActiveState(): HasMany
    {
        return $this->hasMany(PomodoroActiveState::class);
    }

    /**
     * Get the daily ledger summaries for this user's Halo dashboard.
     *
     * @return HasMany<LedgerDailySummary>
     */
    public function ledgerDailySummaries(): HasMany
    {
        return $this->hasMany(LedgerDailySummary::class);
    }

    /**
     * Get the append-only Halo point ledger entries for this user.
     *
     * The ledger is an immutable audit chain; the running balance is stored
     * denormalized on the user's `halo_points_balance` column.
     *
     * @return HasMany<HaloPointLedger>
     */
    public function haloPointLedgerEntries(): HasMany
    {
        return $this->hasMany(HaloPointLedger::class);
    }

    /**
     * Get the roles assigned to this user via the `user_roles` pivot table.
     *
     * @return BelongsToMany<Role>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    /**
     * Get the user's preferred UI language.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Language, User>
     */
    public function language()
    {
        return $this->belongsTo(Language::class);
    }

    /**
     * Get the licenses associated with this user.
     *
     * @return HasMany<License>
     */
    public function licenses(): HasMany
    {
        return $this->hasMany(License::class);
    }

    /**
     * Get the subscriptions associated with this user.
     *
     * @return HasMany<Subscription>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get the payments made by this user.
     *
     * @return HasMany<Payment>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get all workspace participations for this user.
     *
     * @return HasMany<AccountParticipant>
     */
    public function accountParticipations(): HasMany
    {
        return $this->hasMany(AccountParticipant::class);
    }

    /**
     * Get all invitations sent by this user.
     *
     * Uses the non-default `invited_by` foreign key column.
     *
     * @return HasMany<Invitation>
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'invited_by');
    }

    /**
     * Get the email verifications associated with this user.
     *
     * @return HasMany<EmailVerification>
     */
    public function emailVerifications(): HasMany
    {
        return $this->hasMany(EmailVerification::class);
    }

    // ── Role helpers ──────────────────────────────────────────────────────

    /**
     * Check whether the user holds a specific role.
     *
     * @param  string  $roleName  Role name to look up (e.g. "owner", "super_admin").
     * @return bool               True when the role is assigned.
     */
    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }

    /**
     * Check whether the user holds at least one of the given roles.
     *
     * @param  array<int, string>  $roles  Role names to match.
     * @return bool                        True when any role matches.
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->roles()->whereIn('name', $roles)->exists();
    }

    /**
     * Assign a role to the user (idempotent — uses syncWithoutDetaching).
     *
     * Accepts either a Role model instance or a role name string. Throws a
     * ModelNotFoundException when the role name does not exist.
     *
     * @param  string|Role  $role  Role instance or role name.
     * @return void
     */
    public function assignRole(string|Role $role): void
    {
        if (is_string($role)) {
            $role = Role::where('name', $role)->firstOrFail();
        }

        $this->roles()->syncWithoutDetaching($role);
    }

    /**
     * Remove a role from the user.
     *
     * Silently does nothing when the role name does not exist, so callers
     * can call this unconditionally without checking first.
     *
     * @param  string|Role  $role  Role instance or role name.
     * @return void
     */
    public function removeRole(string|Role $role): void
    {
        if (is_string($role)) {
            $role = Role::where('name', $role)->first();
        }

        if ($role) {
            $this->roles()->detach($role);
        }
    }

    // ── License helpers ───────────────────────────────────────────────────

    /**
     * Get the user's currently active license.
     *
     * Returns the first active license whose `expires_at` is null (perpetual)
     * or in the future. Returns null when no valid license exists.
     *
     * @return \App\Models\License|null
     */
    public function activeLicense()
    {
        return $this->licenses()
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->first();
    }

    /**
     * Check whether the user holds an active license.
     *
     * @return bool  True when activeLicense() returns a non-null value.
     */
    public function hasActiveLicense(): bool
    {
        return $this->activeLicense() !== null;
    }

    // ── Status / verification helpers ─────────────────────────────────────

    /**
     * Check whether the user's email address has been verified.
     *
     * @return bool  True when `email_verified_at` is not null.
     */
    public function isEmailVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    /**
     * Check whether the user account is in "pending" status.
     *
     * New accounts are set to "pending" until their email is verified.
     *
     * @return bool  True when `status` is "pending".
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check whether the user account is in "active" status.
     *
     * @return bool  True when `status` is "active".
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check whether the user is suspended by either status or explicit flag.
     *
     * Halo integrity enforcement sets both `status = "suspended"` and
     * `is_suspended = true`. Either signal alone is treated as authoritative.
     *
     * @return bool  True when the user is suspended.
     */
    public function isSuspended(): bool
    {
        return $this->status === 'suspended' || (bool) $this->is_suspended;
    }

    /**
     * Mark the user's email as verified and activate the account.
     *
     * Sets `email_verified_at` to the current timestamp and flips `status`
     * to "active" in a single UPDATE.
     *
     * @return void
     */
    public function markEmailAsVerified(): void
    {
        $this->update([
            'email_verified_at' => now(),
            'status'            => 'active',
        ]);
    }

    /**
     * Check whether the user has a verified email (Laravel MustVerifyEmail compat).
     *
     * Mirrors isEmailVerified() using the standard Laravel convention name.
     *
     * @return bool  True when `email_verified_at` is not null.
     */
    public function hasVerifiedEmail(): bool
    {
        return ! is_null($this->email_verified_at);
    }
}
