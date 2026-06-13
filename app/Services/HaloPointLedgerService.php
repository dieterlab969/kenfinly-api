<?php

namespace App\Services;

use App\Models\HaloPointLedger;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;

class HaloPointLedgerService
{
    private const WELCOME_BONUS_AMOUNT = 100;

    private const WELCOME_BONUS_TYPE = 'welcome_bonus';

    private const ZERO_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

    public function createGenesisBlock(User $user): HaloPointLedger
    {
        $existingLedger = HaloPointLedger::where('user_id', $user->id)
            ->where('transaction_type', self::WELCOME_BONUS_TYPE)
            ->orderBy('id')
            ->first();

        if ($existingLedger) {
            return $existingLedger;
        }

        $createdAt = now();
        $currentHash = $this->calculateHash(
            self::ZERO_HASH,
            (int) $user->id,
            self::WELCOME_BONUS_AMOUNT,
            self::WELCOME_BONUS_TYPE,
            $createdAt,
        );

        $ledger = HaloPointLedger::create([
            'user_id' => $user->id,
            'transaction_type' => self::WELCOME_BONUS_TYPE,
            'amount' => self::WELCOME_BONUS_AMOUNT,
            'previous_hash' => self::ZERO_HASH,
            'current_hash' => $currentHash,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        $user->increment('halo_points_balance', self::WELCOME_BONUS_AMOUNT);

        return $ledger;
    }

    public function ensureIntegrity(User $user): void
    {
        $entries = HaloPointLedger::where('user_id', $user->id)
            ->orderBy('id')
            ->get();

        if ($entries->isEmpty()) {
            return;
        }

        $expectedPreviousHash = self::ZERO_HASH;

        foreach ($entries as $entry) {
            if (!hash_equals($expectedPreviousHash, (string) $entry->previous_hash)) {
                $this->suspendAndAbort($user);
            }

            $expectedCurrentHash = $this->calculateHash(
                $expectedPreviousHash,
                (int) $entry->user_id,
                (int) $entry->amount,
                (string) $entry->transaction_type,
                $entry->created_at,
            );

            if (!hash_equals($expectedCurrentHash, (string) $entry->current_hash)) {
                $this->suspendAndAbort($user);
            }

            $expectedPreviousHash = $expectedCurrentHash;
        }
    }

    private function calculateHash(
        string $previousHash,
        int $userId,
        int $amount,
        string $transactionType,
        Carbon|string $createdAt,
    ): string {
        $timestamp = $createdAt instanceof Carbon
            ? $createdAt->format('Y-m-d H:i:s')
            : Carbon::parse($createdAt)->format('Y-m-d H:i:s');

        return hash('sha256', $previousHash.$userId.$amount.$transactionType.$timestamp);
    }

    private function suspendAndAbort(User $user): never
    {
        $user->forceFill([
            'is_suspended' => true,
            'status' => 'suspended',
        ])->save();

        throw new HttpResponseException(response()->json([
            'status' => 'suspended',
            'message' => 'Hệ thống phát hiện gian lận kỷ luật - Tài khoản bị phong tỏa',
        ], 403));
    }
}
