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
 * User model representing an application user.
 *
 * Represents a user account with authentication, authorization, and relationships
 * to various application entities including accounts, subscriptions, payments, and more.
 * Implements JWT authentication for API access.
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
        'language_id',
        'status',
        'email_verified_at',
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
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => 'string',
        ];
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    /**
     * Get the user's accounts.
     */
    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    /**
     * Get the roles that belong to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    /**
     * Get the user's preferred language.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo Relationship to the Language model.
     */
    public function language()
    {
        return $this->belongsTo(Language::class);
    }

    /**
     * Check if the user has a specific role.
     *
     * @param string $roleName
     * @return bool
     */
    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }

    /**
     * Check if the user has any of the given roles.
     *
     * @param array $roles
     * @return bool
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->roles()->whereIn('name', $roles)->exists();
    }

    /**
     * Assign a role to the user.
     *
     * @param string|Role $role
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
     * @param string|Role $role
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

    /**
     * Get all licenses associated with this user.
     *
     * @return HasMany Relationship to License models.
     */
    public function licenses(): HasMany
    {
        return $this->hasMany(License::class);
    }

    /**
     * Get all subscriptions associated with this user.
     *
     * @return HasMany Relationship to Subscription models.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get all payments made by this user.
     *
     * @return HasMany Relationship to Payment models.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get all account participations for this user.
     *
     * @return HasMany Relationship to AccountParticipant models.
     */
    public function accountParticipations(): HasMany
    {
        return $this->hasMany(AccountParticipant::class);
    }

    /**
     * Get all invitations sent by this user.
     *
     * @return HasMany Relationship to Invitation models.
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'invited_by');
    }

    /**
     * Get the user's active license.
     *
     * Returns the first active license that is either non-expiring or not yet expired.
     *
     * @return \App\Models\License|null The active license or null if none exists.
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
     * Check if the user has an active license.
     *
     * @return bool True if the user has an active license, false otherwise.
     */
    public function hasActiveLicense(): bool
    {
        return $this->activeLicense() !== null;
    }

    /**
     * Get all email verifications associated with this user.
     *
     * @return HasMany Relationship to EmailVerification models.
     */
    public function emailVerifications(): HasMany
    {
        return $this->hasMany(EmailVerification::class);
    }

    /**
     * Check if the user's email is verified.
     *
     * @return bool True if email is verified, false otherwise.
     */
    public function isEmailVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    /**
     * Check if the user has pending status.
     *
     * @return bool True if user status is 'pending', false otherwise.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the user has active status.
     *
     * @return bool True if user status is 'active', false otherwise.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if the user has suspended status.
     *
     * @return bool True if user status is 'suspended', false otherwise.
     */
    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    /**
     * Mark the user's email as verified and set status to active.
     *
     * Updates the email_verified_at timestamp and sets user status to 'active'.
     *
     * @return void
     */
    public function markEmailAsVerified(): void
    {
        $this->update([
            'email_verified_at' => now(),
            'status' => 'active',
        ]);
    }

    /**
     * Check if the user has a verified email.
     *
     * @return bool True if email is verified, false otherwise.
     */
    public function hasVerifiedEmail(): bool
    {
        return !is_null($this->email_verified_at);
    }
}
