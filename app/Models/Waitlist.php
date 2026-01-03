<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Waitlist extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * Use these attributes to capture user interest in subscription plans.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'plan_interest',
    ];
}
