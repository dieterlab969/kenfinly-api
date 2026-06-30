<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Account model — a financial wallet or account belonging to a single user.
 *
 * BALANCE POLICY
 * ──────────────
 * `balance` is a denormalised running total maintained by the transaction
 * observer.  It is intentionally absent from the UpdateAccountRequest
 * validation rules and from the update controller action — it may only be
 * changed as a side-effect of creating, editing, or deleting transactions.
 *
 * For new accounts the opening balance is set once in AccountController::store();
 * from that point onward every credit/debit flows through the Transaction model.
 *
 * DELETION GUARD (two layers)
 * ───────────────────────────
 * 1. Application layer — AccountController::destroy() checks hasTransactions()
 *    and returns HTTP 400 before any SQL runs.
 * 2. Database layer — the FK on transactions.account_id is RESTRICT, meaning
 *    even a raw DB-level DELETE on an account with transactions is rejected by
 *    the database engine.  This prevents admin scripts or migrations from
 *    silently orphaning financial history.
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
        'account_type',   // added: wallet | bank | savings | credit_card | investment
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    // ── Relationships ─────────────────────────────────────────────────────

    /** The user who owns this account. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * All financial transactions posted against this account.
     *
     * The database FK is RESTRICT — a transaction row can never be orphaned
     * and the parent account cannot be deleted while any row references it.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /** Users granted shared access to this account. */
    public function participants(): HasMany
    {
        return $this->hasMany(AccountParticipant::class);
    }

    /** Pending share invitations for this account. */
    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    // ── Business-logic helpers ────────────────────────────────────────────

    /**
     * Return true if this account has at least one transaction.
     *
     * Uses EXISTS rather than COUNT(*) for a single fast query.
     * Called by AccountController::destroy() before attempting deletion.
     */
    public function hasTransactions(): bool
    {
        return $this->transactions()->exists();
    }

    /**
     * Compute the authoritative balance directly from the transaction ledger.
     *
     * This differs from `$this->balance` only when the denormalised column is
     * stale (e.g. after a manual DB edit or a failed observer).  Use for
     * reconciliation, not for routine display.
     *
     * @return float  income − expenses, rounded to 2 decimal places.
     */
    public function calculateBalance(): float
    {
        $income  = (float) $this->transactions()->where('type', 'income')->sum('amount');
        $expense = (float) $this->transactions()->where('type', 'expense')->sum('amount');

        return round($income - $expense, 2);
    }

    // ── Participant helpers ───────────────────────────────────────────────

    /**
     * Return true if the given user is a registered participant on this account.
     *
     * @param int $userId
     */
    public function hasParticipant(int $userId): bool
    {
        return $this->participants()->where('user_id', $userId)->exists();
    }

    /**
     * Return the role name for a given participant, or null if not found.
     *
     * @param  int  $userId
     * @return string|null  e.g. 'owner', 'editor', 'viewer'
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
