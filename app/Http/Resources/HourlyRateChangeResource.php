<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Transform hourly rate governance logs into API-friendly payloads.
 *
 * This resource supports both the legacy hourly-rate change model and the new
 * semi-annual review-window log format so history endpoints can evolve without
 * breaking response structure.
 */
class HourlyRateChangeResource extends JsonResource
{
    /**
     * Convert the resource into an array.
     *
     * @param Request $request Current HTTP request instance.
     *
     * @return array<string, int|string|null> Normalized hourly rate change data.
     */
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
