<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotificationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manages per-user notification toggle preferences.
 *
 * A preference row is created automatically on the first GET request, so the
 * frontend never needs a separate "initialise" call. All seven toggles are
 * required on every PUT to guarantee an unambiguous full-state update.
 *
 * Routes (both require `auth:api` + `halo.integrity` middleware):
 *   GET  /api/user/notification-settings
 *   PUT  /api/user/notification-settings
 *
 * @package App\Http\Controllers\Api
 */
class NotificationSettingController extends Controller
{
    /** @var list<string> Exhaustive list of toggle column names. */
    private const TOGGLES = [
        'notify_new_transaction',
        'notify_budget_alert',
        'notify_large_transaction',
        'notify_savings_milestone',
        'notify_account_invite',
        'notify_subscription',
        'notify_weekly_summary',
    ];

    /**
     * Return the authenticated user's notification settings.
     *
     * If no row exists yet it is created with {@see UserNotificationSetting::defaults()}
     * before the response is sent, ensuring the frontend always receives a
     * fully-populated object.
     *
     * @param  Request      $request
     * @return JsonResponse 200 with keys:
     *                        - success bool
     *                        - data    array (all seven toggle booleans + updated_at)
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $settings = UserNotificationSetting::firstOrCreate(
            ['user_id' => $user->id],
            UserNotificationSetting::defaults($user->id)
        );

        return response()->json([
            'success' => true,
            'data'    => array_merge(
                $settings->toSettings(),
                ['updated_at' => $settings->updated_at?->toIso8601String()]
            ),
        ]);
    }

    /**
     * Update the authenticated user's notification settings.
     *
     * All seven toggle fields are required in every request so the endpoint
     * always stores the complete intended state (no partial-update ambiguity).
     * The row is upserted, so this is safe even when no prior row exists.
     *
     * @param  Request      $request  Expected JSON body — all seven boolean toggles.
     * @return JsonResponse 200 with persisted values, or 422 on validation failure.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function update(Request $request): JsonResponse
    {
        $rules = array_fill_keys(self::TOGGLES, 'required|boolean');
        $validated = $request->validate($rules);

        $user = $request->user();

        $settings = UserNotificationSetting::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Notification settings saved.',
            'data'    => array_merge(
                $settings->toSettings(),
                ['updated_at' => $settings->updated_at?->toIso8601String()]
            ),
        ]);
    }
}
