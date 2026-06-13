<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HourlyRateChangeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $oldRate = $this->old_rate ?? $this->old_hourly_rate;
        $newRate = $this->new_rate ?? $this->new_hourly_rate;
        $changedAt = $this->created_at ?? $this->changed_at;

        return [
            'id' => $this->id,
            'old_hourly_rate_minor' => $oldRate !== null ? (int) $oldRate : null,
            'new_hourly_rate_minor' => (int) $newRate,
            'allowance_year' => isset($this->allowance_year) ? (int) $this->allowance_year : null,
            'review_window' => $this->review_window ?? null,
            'changed_at' => optional($changedAt)->utc()->toIso8601String(),
            'next_allowed_at' => optional($this->next_allowed_at)->utc()->toIso8601String(),
        ];
    }
}
