<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Handles self-service account lifecycle: deactivation and scheduled deletion.
 *
 * Both endpoints require password confirmation before any status change,
 * and both immediately invalidate the user's JWT after modifying the account.
 *
 * ─── Status flow ─────────────────────────────────────────────────────────────
 *
 *  Deactivation:
 *   active → deactivated  (hidden from public, data retained)
 *   deactivated → active  (restored automatically on next successful login)
 *
 *  Deletion:
 *   active → pending_deletion  (sets deletion_scheduled_at = now + 30 days)
 *   pending_deletion → active  (cancelled by logging in within the grace period)
 *   pending_deletion → [hard deleted] (by the scheduled:run Artisan command)
 *
 * ─── API contract ────────────────────────────────────────────────────────────
 *
 *  POST   /api/v1/user/deactivate   { password }
 *  DELETE /api/v1/user/account      { password, confirmation: "DELETE MY ACCOUNT" }
 */
class UserAccountController extends Controller
{
    // ── Deactivation ──────────────────────────────────────────────────────────

    /**
     * Deactivate the authenticated user's account (reversible).
     *
     * Sets status → 'deactivated' and invalidates the JWT.
     * The account is automatically restored to 'active' on the next login.
     *
     * Successful response (200):
     * {
     *   "success": true,
     *   "message": "Your account has been deactivated. Log in anytime to reactivate it."
     * }
     *
     * Error response (422 — wrong password):
     * {
     *   "success": false,
     *   "message": "Incorrect password. Please try again.",
     *   "errors": { "password": ["The password you entered is incorrect."] }
     * }
     */
    public function deactivate(Request $request): JsonResponse
    {
        $request->validate(['password' => 'required|string']);

        /** @var \App\Models\User $user */
        $user = auth('api')->user();

        if (!Hash::check($request->string('password')->toString(), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Incorrect password. Please try again.',
                'errors'  => ['password' => ['The password you entered is incorrect.']],
            ], 422);
        }

        $user->update(['status' => 'deactivated']);

        $this->revokeToken($user->id, 'deactivation');

        Log::info('User self-deactivated account', [
            'user_id' => $user->id,
            'email'   => $user->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your account has been deactivated. Log in anytime to reactivate it.',
        ]);
    }

    // ── Scheduled Deletion ────────────────────────────────────────────────────

    /**
     * Schedule the authenticated user's account for permanent deletion (irreversible after grace period).
     *
     * Marks the account with status → 'pending_deletion' and sets
     * deletion_scheduled_at to 30 days from now. The actual hard-delete is
     * performed by an Artisan scheduled command after the grace period.
     * Logging in during the grace period cancels the deletion.
     *
     * Requires BOTH a correct password AND the exact phrase "DELETE MY ACCOUNT".
     *
     * Successful response (200):
     * {
     *   "success": true,
     *   "message": "Your account has been scheduled for deletion.",
     *   "deletion_scheduled_at": "2026-07-26T00:00:00.000000Z",
     *   "grace_period_days": 30
     * }
     *
     * Error response (422 — wrong password):
     * {
     *   "success": false,
     *   "message": "Incorrect password. Please try again.",
     *   "errors": { "password": ["The password you entered is incorrect."] }
     * }
     *
     * Error response (422 — wrong phrase):
     * {
     *   "success": false,
     *   "message": "Please type \"DELETE MY ACCOUNT\" exactly to confirm.",
     *   "errors": { "confirmation": ["The confirmation phrase does not match."] }
     * }
     */
    public function scheduleDelete(Request $request): JsonResponse
    {
        $request->validate([
            'password'     => 'required|string',
            'confirmation' => 'required|string',
        ]);

        // Phrase check is case-sensitive (OWASP: prevent accidental confirmations)
        if ($request->string('confirmation')->toString() !== 'DELETE MY ACCOUNT') {
            return response()->json([
                'success' => false,
                'message' => 'Please type "DELETE MY ACCOUNT" exactly to confirm.',
                'errors'  => ['confirmation' => ['The confirmation phrase does not match.']],
            ], 422);
        }

        /** @var \App\Models\User $user */
        $user = auth('api')->user();

        if (!Hash::check($request->string('password')->toString(), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Incorrect password. Please try again.',
                'errors'  => ['password' => ['The password you entered is incorrect.']],
            ], 422);
        }

        $scheduledAt = Carbon::now()->addDays(30);

        $user->update([
            'status'                => 'pending_deletion',
            'deletion_scheduled_at' => $scheduledAt,
        ]);

        $this->revokeToken($user->id, 'deletion scheduling');

        Log::info('User scheduled account for permanent deletion', [
            'user_id'               => $user->id,
            'email'                 => $user->email,
            'deletion_scheduled_at' => $scheduledAt->toISOString(),
        ]);

        return response()->json([
            'success'               => true,
            'message'               => 'Your account has been scheduled for deletion.',
            'deletion_scheduled_at' => $scheduledAt->toISOString(),
            'grace_period_days'     => 30,
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Revoke the current JWT token. Logs a warning on failure but never throws,
     * because the primary concern (status update) has already succeeded.
     */
    private function revokeToken(int $userId, string $context): void
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception $e) {
            Log::warning("Could not invalidate JWT during {$context}", [
                'user_id' => $userId,
                'error'   => $e->getMessage(),
            ]);
        }
    }
}
