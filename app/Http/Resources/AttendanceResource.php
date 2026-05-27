<?php

namespace App\Http\Resources;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $expectedEndAt = $this->expected_end_at ? CarbonImmutable::parse($this->expected_end_at)->utc() : null;
        $now = CarbonImmutable::now('UTC');
        $secondsLeft = $expectedEndAt
            ? max(0, $now->diffInSeconds($expectedEndAt, false))
            : 0;

        return [
            'id' => $this->id,
            'halo_date' => $this->halo_date ? (is_string($this->halo_date) ? $this->halo_date : $this->halo_date->format('Y-m-d')) : null,
            'status' => $this->status,
            'started_at' => $this->started_at ? CarbonImmutable::parse($this->started_at)->utc()->toIso8601String() : null,
            'expected_end_at' => $this->expected_end_at ? CarbonImmutable::parse($this->expected_end_at)->utc()->toIso8601String() : null,
            'ended_at' => $this->ended_at ? CarbonImmutable::parse($this->ended_at)->utc()->toIso8601String() : null,
            'user_rating' => $this->user_rating,
            'quote_text' => $this->quote_text,
            'quote_vote' => $this->quote_vote,
            'earned_amount_minor' => (int) $this->earned_amount,
            'reward_transaction_id' => $this->reward_transaction_id,
            'kill_reason' => $this->kill_reason,
            'seconds_left' => (int) $secondsLeft,
            'can_complete' => $this->status === 'initiated' && $secondsLeft === 0,
        ];
    }
}
