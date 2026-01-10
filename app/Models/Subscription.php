<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'plan_id',
        'payment_gateway_id',
        'status',
        'gateway_subscription_id',
        'amount',
        'currency',
        'start_date',
        'end_date',
        'canceled_at',
        'cancellation_reason',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'canceled_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    /**
     * Defines the relationship to the user who owns this subscription.
     *
     * Use this relationship to access the user associated with this subscription.
     *
     * @return BelongsTo Returns the belongs-to relationship to the User model.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Defines the relationship to the subscription plan.
     *
     * Use this relationship to access the plan details for this subscription.
     *
     * @return BelongsTo Returns the belongs-to relationship to the SubscriptionPlan model.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    /**
     * Defines the relationship to the payment gateway used for this subscription.
     *
     * Use this relationship to access payment gateway information.
     *
     * @return BelongsTo Returns the belongs-to relationship to the PaymentGateway model.
     */
    public function gateway(): BelongsTo
    {
        return $this->belongsTo(PaymentGateway::class, 'payment_gateway_id');
    }

    /**
     * Defines the relationship to payments made under this subscription.
     *
     * Use this relationship to retrieve all payments associated with this subscription.
     *
     * @return HasMany Returns the has-many relationship to the Payment model.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Defines the relationship to licenses associated with this subscription.
     *
     * Use this relationship to access licenses granted by this subscription.
     *
     * @return HasMany Returns the has-many relationship to the License model.
     */
    public function licenses(): HasMany
    {
        return $this->hasMany(License::class);
    }

    /**
     * Retrieves the current active license for this subscription.
     *
     * Use this method to get the license that is currently active and valid.
     * Returns null if no active license exists.
     *
     * @return License|null The active License model instance or null if none found.
     */
    public function activeLicense()
    {
        return $this->licenses()->where('status', 'active')->first();
    }

    /**
     * Determines if the subscription is currently active.
     *
     * A subscription is active if its status is 'active' and its end date
     * is either not set or is in the future.
     *
     * Use this method to check subscription validity before granting access or services.
     *
     * @return bool Returns true if the subscription is active; false otherwise.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && (!$this->end_date || $this->end_date->isFuture());
    }
}
