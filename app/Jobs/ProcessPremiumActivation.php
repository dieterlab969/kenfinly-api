<?php

namespace App\Jobs;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Asynchronously upgrades a user's subscription after a confirmed WooCommerce payment.
 *
 * Why a queue job?
 * ────────────────
 * The WooCommerce webhook endpoint must return 200 OK within a few seconds or
 * WooCommerce will mark the delivery as failed and retry. Under high concurrent
 * traffic (5,000+ daily visitors) serialising the DB write inside the HTTP
 * request would create latency spikes and potentially timeout. By offloading
 * the upgrade to a queue worker the endpoint returns instantly while the
 * actual work is processed reliably in the background.
 *
 * Retry behaviour:
 * ────────────────
 * $tries = 3 with a 30-second backoff covers transient DB unavailability.
 * Idempotency is guaranteed by the processed_payments record that was already
 * inserted before this job was dispatched — even if the job runs multiple
 * times the end state is the same.
 *
 * Plan mapping:
 * ─────────────
 *   monthly_pro → plan = 'monthly', expires in 30 days
 *   yearly_pro  → plan = 'yearly',  expires in 365 days
 *   (unknown)   → falls back to monthly as a safe default
 */
class ProcessPremiumActivation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Maximum number of attempts before the job is marked failed. */
    public int $tries = 3;

    /** Seconds to wait between retry attempts. */
    public int $backoff = 30;

    public function __construct(
        public readonly int    $userId,
        public readonly string $planType,
        public readonly string $wooOrderId,
    ) {}

    public function handle(): void
    {
        $user = User::find($this->userId);

        if (!$user) {
            Log::error('ProcessPremiumActivation: user not found — subscription NOT activated', [
                'user_id'      => $this->userId,
                'plan_type'    => $this->planType,
                'woo_order_id' => $this->wooOrderId,
            ]);
            // Do not throw — no point retrying a missing user.
            return;
        }

        [$plan, $expiresAt] = $this->resolvePlan($this->planType);

        $user->update([
            'subscription_status'     => 'active',
            'subscription_plan'       => $plan,
            'subscription_expires_at' => $expiresAt,
        ]);

        Log::info('ProcessPremiumActivation: subscription activated successfully', [
            'user_id'      => $this->userId,
            'email'        => $user->email,
            'plan'         => $plan,
            'expires_at'   => $expiresAt->toDateTimeString(),
            'woo_order_id' => $this->wooOrderId,
        ]);
    }

    /**
     * Map a WooCommerce plan_type string to a [subscription_plan, Carbon expiry] pair.
     *
     * Unknown plan types fall back to 'monthly' (30 days) so a purchase is
     * never silently lost — operators are alerted via the log entry.
     */
    private function resolvePlan(string $planType): array
    {
        $map = [
            'monthly_pro' => ['monthly', Carbon::now()->addDays(30)],
            'yearly_pro'  => ['yearly',  Carbon::now()->addDays(365)],
        ];

        if (!isset($map[$planType])) {
            Log::warning('ProcessPremiumActivation: unknown plan_type, falling back to monthly', [
                'plan_type'    => $planType,
                'woo_order_id' => $this->wooOrderId,
            ]);
        }

        return $map[$planType] ?? ['monthly', Carbon::now()->addDays(30)];
    }
}
