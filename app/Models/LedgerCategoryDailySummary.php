<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pre-aggregated summary: one row per (user, account, category, type, day).
 *
 * This model is the read-side projection for the analytics endpoint.
 * It is NEVER queried with SUM/COUNT over the transactions table at runtime.
 *
 * @property int         $id
 * @property int         $user_id
 * @property int         $account_id
 * @property int|null    $category_id
 * @property string      $category_name
 * @property string      $color_hex
 * @property string      $type            income | expense
 * @property string      $summary_date
 * @property int         $amount_minor
 * @property int         $tx_count
 */
class LedgerCategoryDailySummary extends Model
{
    protected $table = 'ledger_category_daily_summaries';

    protected $fillable = [
        'user_id',
        'account_id',
        'category_id',
        'category_name',
        'color_hex',
        'type',
        'summary_date',
        'amount_minor',
        'tx_count',
    ];

    protected $casts = [
        'summary_date' => 'date',
        'amount_minor' => 'integer',
        'tx_count'     => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
