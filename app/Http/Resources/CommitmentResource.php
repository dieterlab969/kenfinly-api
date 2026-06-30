<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CommitmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $goal = (int) $this->goal_amount;
        $current = max(0, (int) $this->current_amount);
        $progress = $goal > 0 ? min(100, (int) floor(($current / $goal) * 100)) : 0;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'goal_amount_minor' => $goal,
            'current_amount_minor' => $current,
            'progress_percent' => $progress,
            'image_url' => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'deadline' => optional($this->deadline)->utc()->toIso8601String(),
            'status' => $this->status,
            'completed_at' => optional($this->completed_at)->utc()->toIso8601String(),
            'killed_at' => optional($this->killed_at)->utc()->toIso8601String(),
            'kill_reason' => $this->kill_reason,
            'created_at' => optional($this->created_at)->utc()->toIso8601String(),
        ];
    }
}
