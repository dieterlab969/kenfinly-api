<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transaction extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'account_id',
        'category_id',
        'type',
        'amount',
        'notes',
        'receipt_path',
        'transaction_date',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
        'type' => 'string',
    ];

    /**
     * Defines the relationship to the user who owns this transaction.
     *
     * Use this relationship to access the user associated with this transaction.
     *
     * @return BelongsTo Returns the belongs-to relationship to the User model.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Defines the relationship to the account associated with this transaction.
     *
     * Use this relationship to access the account linked to this transaction.
     *
     * @return BelongsTo Returns the belongs-to relationship to the Account model.
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Defines the relationship to the category of this transaction.
     *
     * Use this relationship to access the category classification of this transaction.
     *
     * @return BelongsTo Returns the belongs-to relationship to the Category model.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Defines the relationship to photos attached to this transaction.
     *
     * Use this relationship to retrieve all photos associated with this transaction.
     *
     * @return HasMany Returns the has-many relationship to the TransactionPhoto model.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(TransactionPhoto::class);
    }

    /**
     * Defines the relationship to change logs for this transaction.
     *
     * Use this relationship to access the history of changes made to this transaction,
     * ordered by most recent first.
     *
     * @return HasMany Returns the has-many relationship to the TransactionChangeLog model.
     */
    public function changeLogs(): HasMany
    {
        return $this->hasMany(TransactionChangeLog::class)->orderBy('created_at', 'desc');
    }
}
