<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Account model representing a financial account.
 *
 * Represents a user's financial account with balance tracking, currency information,
 * and relationships to transactions, participants, and invitations.
 */
class Account extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'balance',
        'currency',
        'icon',
        'color',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    /**
     * Get the user that owns this account.
     *
     * @return BelongsTo Relationship to the User model.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all transactions associated with this account.
     *
     * @return HasMany Relationship to Transaction models.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get all participants associated with this account.
     *
     * @return HasMany Relationship to AccountParticipant models.
     */
    public function participants(): HasMany
    {
        return $this->hasMany(AccountParticipant::class);
    }

    /**
     * Get all invitations associated with this account.
     *
     * @return HasMany Relationship to Invitation models.
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    /**
     * Check if a user is a participant in this account.
     *
     * @param int $userId The ID of the user to check.
     * @return bool True if the user is a participant, false otherwise.
     */
    public function hasParticipant(int $userId): bool
    {
        return $this->participants()->where('user_id', $userId)->exists();
    }

    /**
     * Get the role of a participant in this account.
     *
     * @param int $userId The ID of the user whose role to retrieve.
     * @return string|null The role name if the user is a participant, null otherwise.
     */
    public function getParticipantRole(int $userId): ?string
    {
        $participant = $this->participants()
            ->where('user_id', $userId)
            ->with('role')
            ->first();

        return $participant?->role?->name;
    }
}
