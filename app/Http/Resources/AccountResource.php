<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Transforms an Account model into a standardised JSON shape for all
 * account-related API responses.
 *
 * BALANCE NOTE
 * ────────────
 * `balance` is exposed as a read-only decimal string (e.g. "1234.56") driven
 * by the model's `decimal:2` cast.  It is never writable through this resource
 * or any update endpoint — changes flow exclusively through the transaction
 * ledger.
 *
 * CONDITIONAL FIELDS
 * ──────────────────
 * `transactions_count` is only included when the query was built with
 * `->withCount('transactions')` (index and show endpoints).  It is absent from
 * create/update responses where the count was not requested, keeping those
 * payloads lean.
 */
class AccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'user_id'      => $this->user_id,
            'name'         => $this->name,
            /** Read-only decimal string, e.g. "1234.56" */
            'balance'      => $this->balance,
            'currency'     => $this->currency,
            'icon'         => $this->icon,
            'color'        => $this->color,
            'account_type' => $this->account_type ?? 'wallet',
            /** Present only when loaded with ->withCount('transactions') */
            'transactions_count' => $this->whenCounted('transactions'),
            'created_at'   => $this->created_at?->toIso8601String(),
            'updated_at'   => $this->updated_at?->toIso8601String(),
        ];
    }
}
