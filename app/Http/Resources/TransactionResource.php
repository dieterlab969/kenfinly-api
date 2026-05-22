<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Standard 11 — Standardized API Responses.
 *
 * Never expose raw DB structure. amount_minor is the canonical integer form,
 * formatted helpers are convenience for display only. Internal columns
 * (idempotency_key, source linkage) are intentionally hidden.
 */
class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ledger_type' => $this->ledger_type ?: 'real',
            'type' => $this->type,
            'amount_minor' => (int) ($this->amount_minor ?? round(((float) $this->amount) * 100)),
            'currency' => $this->currency ?: 'VND',
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'icon' => $this->category->icon,
                'color' => $this->category->color,
            ]),
            'account' => $this->whenLoaded('account', fn () => [
                'id' => $this->account->id,
                'name' => $this->account->name,
                'currency' => $this->account->currency,
            ]),
            'notes' => $this->notes,
            'transaction_date' => optional($this->transaction_date)->format('Y-m-d'),
            'source_type' => $this->source_type ?: 'manual',
            'is_immutable' => $this->ledger_type === 'halo' || ($this->source_type && $this->source_type !== 'manual'),
            'created_at' => optional($this->created_at)->utc()->toIso8601String(),
        ];
    }
}
