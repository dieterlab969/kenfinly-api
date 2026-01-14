<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserConsent extends Model
{
    protected $fillable = [
        'session_id',
        'analytics_consent',
        'marketing_consent',
        'ip_address',
        'consented_at',
        'expires_at'
    ];

    protected $casts = [
        'analytics_consent' => 'boolean',
        'marketing_consent' => 'boolean',
        'consented_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    public function isExpired()
    {
        return $this->expires_at && Carbon::now()->greaterThan($this->expires_at);
    }

    public function hasAnalyticsConsent()
    {
        return $this->analytics_consent && !$this->isExpired();
    }
}
