<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = ['name', 'description', 'price', 'currency', 'billing_cycle', 'features', 'is_active', 'sort_order'];
    protected $casts = ['features' => 'array', 'price' => 'decimal:2'];
    
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }
}
