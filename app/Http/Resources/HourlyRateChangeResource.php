<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HourlyRateChangeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'old_hourly_rate_minor' => $this->old_hourly_rate !== null ? (int) $this->old_hourly_rate : null,
            'new_hourly_rate_minor' => (int) $this->new_hourly_rate,
            'changed_at' => optional($this->changed_at)->utc()->toIso8601String(),
            'next_allowed_at' => optional($this->next_allowed_at)->utc()->toIso8601String(),
        ];
    }
}
