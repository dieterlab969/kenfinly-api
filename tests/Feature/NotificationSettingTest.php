<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserNotificationSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Feature tests for the Notification Settings API.
 *
 * Covers:
 *   GET  /api/user/notification-settings  — retrieve settings
 *   PUT  /api/user/notification-settings  — update settings
 *
 * Each test starts with a clean database ({@see RefreshDatabase}) and
 * authenticates via JWT tokens issued through {@see JWTAuth::fromUser()}.
 *
 * @package Tests\Feature
 */
class NotificationSettingTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /** All seven toggle field names. */
    private const TOGGLES = [
        'notify_new_transaction',
        'notify_budget_alert',
        'notify_large_transaction',
        'notify_savings_milestone',
        'notify_account_invite',
        'notify_subscription',
        'notify_weekly_summary',
    ];

    /** Application default values for every toggle. */
    private const DEFAULTS = [
        'notify_new_transaction'   => true,
        'notify_budget_alert'      => true,
        'notify_large_transaction' => true,
        'notify_savings_milestone' => true,
        'notify_account_invite'    => true,
        'notify_subscription'      => true,
        'notify_weekly_summary'    => false,
    ];

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Build a Bearer-token Authorization header for the given user.
     *
     * @param  User                  $user
     * @return array<string, string>
     */
    private function authHeaders(User $user): array
    {
        return ['Authorization' => 'Bearer ' . JWTAuth::fromUser($user)];
    }

    /**
     * Return a complete payload where every toggle is set to the given value.
     *
     * @param  bool              $value
     * @return array<string, bool>
     */
    private function allToggles(bool $value): array
    {
        return array_fill_keys(self::TOGGLES, $value);
    }

    // -------------------------------------------------------------------------
    // Guest (unauthenticated) access
    // -------------------------------------------------------------------------

    /**
     * An unauthenticated GET request must be rejected with 401.
     */
    public function test_guest_cannot_get_settings(): void
    {
        $this->getJson('/api/user/notification-settings')
             ->assertStatus(401);
    }

    /**
     * An unauthenticated PUT request must be rejected with 401.
     */
    public function test_guest_cannot_update_settings(): void
    {
        $this->putJson('/api/user/notification-settings', $this->allToggles(true))
             ->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // GET /api/user/notification-settings
    // -------------------------------------------------------------------------

    /**
     * When no row exists yet, the endpoint auto-creates one with the application
     * defaults and returns them in a single request — no setup step required.
     */
    public function test_get_creates_defaults_on_first_access(): void
    {
        $user = User::factory()->create();

        $response = $this->getJson(
            '/api/user/notification-settings',
            $this->authHeaders($user)
        );

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [...self::TOGGLES, 'updated_at'],
                 ])
                 ->assertJson([
                     'success' => true,
                     'data'    => self::DEFAULTS,
                 ]);

        $this->assertDatabaseHas('user_notification_settings', [
            'user_id' => $user->id,
        ]);
    }

    /**
     * When a row already exists, its persisted values are returned rather than
     * the application defaults.
     */
    public function test_get_returns_existing_settings(): void
    {
        $user = User::factory()->create();

        $stored = array_merge(
            ['user_id' => $user->id],
            $this->allToggles(false),
            ['notify_budget_alert' => true]
        );
        UserNotificationSetting::create($stored);

        $response = $this->getJson(
            '/api/user/notification-settings',
            $this->authHeaders($user)
        );

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data'    => array_merge(
                         $this->allToggles(false),
                         ['notify_budget_alert' => true]
                     ),
                 ]);
    }

    // -------------------------------------------------------------------------
    // PUT /api/user/notification-settings
    // -------------------------------------------------------------------------

    /**
     * A valid PUT payload must persist all toggles and echo them back.
     *
     * Also verifies the upsert path: the row is created by the PUT when no
     * prior row exists (callers do not have to GET first).
     */
    public function test_update_persists_all_toggles(): void
    {
        $user    = User::factory()->create();
        $payload = array_merge($this->allToggles(false), [
            'notify_budget_alert'    => true,
            'notify_account_invite'  => true,
        ]);

        $response = $this->putJson(
            '/api/user/notification-settings',
            $payload,
            $this->authHeaders($user)
        );

        $response->assertStatus(200)
                 ->assertJson(['success' => true, 'data' => $payload]);

        $this->assertDatabaseHas('user_notification_settings', array_merge(
            ['user_id' => $user->id],
            $payload
        ));
    }

    /**
     * A second PUT must overwrite the existing row — no duplicate rows are
     * created (one row per user, always).
     */
    public function test_update_overwrites_existing_row_without_duplicates(): void
    {
        $user = User::factory()->create();
        UserNotificationSetting::create(array_merge(
            ['user_id' => $user->id],
            self::DEFAULTS
        ));

        $newPayload = $this->allToggles(false);
        $this->putJson(
            '/api/user/notification-settings',
            $newPayload,
            $this->authHeaders($user)
        )->assertStatus(200);

        $this->assertEquals(
            1,
            UserNotificationSetting::where('user_id', $user->id)->count()
        );

        $this->assertDatabaseHas('user_notification_settings', array_merge(
            ['user_id' => $user->id],
            $newPayload
        ));
    }

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    /**
     * A non-boolean value for any toggle must trigger a 422 with the field named
     * in the validation error bag.
     */
    public function test_update_rejects_non_boolean_toggle(): void
    {
        $user    = User::factory()->create();
        $payload = array_merge($this->allToggles(true), [
            'notify_budget_alert' => 'yes-please',
        ]);

        $this->putJson(
            '/api/user/notification-settings',
            $payload,
            $this->authHeaders($user)
        )
        ->assertStatus(422)
        ->assertJsonValidationErrors(['notify_budget_alert']);
    }

    /**
     * Omitting any of the seven required fields must produce a 422 that names
     * the missing field(s).
     */
    public function test_update_requires_all_seven_fields(): void
    {
        $user = User::factory()->create();

        $this->putJson(
            '/api/user/notification-settings',
            ['notify_new_transaction' => true],  // only one of seven sent
            $this->authHeaders($user)
        )
        ->assertStatus(422)
        ->assertJsonValidationErrors([
            'notify_budget_alert',
            'notify_large_transaction',
            'notify_savings_milestone',
            'notify_account_invite',
            'notify_subscription',
            'notify_weekly_summary',
        ]);
    }

    /**
     * Each user's settings are completely isolated — updating one user's
     * preferences must not affect any other user's row.
     */
    public function test_settings_are_isolated_per_user(): void
    {
        [$userA, $userB] = User::factory()->count(2)->create();

        // Give both users their default rows
        UserNotificationSetting::create(array_merge(['user_id' => $userA->id], self::DEFAULTS));
        UserNotificationSetting::create(array_merge(['user_id' => $userB->id], self::DEFAULTS));

        // Update userA to turn everything off
        $this->putJson(
            '/api/user/notification-settings',
            $this->allToggles(false),
            $this->authHeaders($userA)
        )->assertStatus(200);

        // UserB's row must still have the original defaults
        $this->assertDatabaseHas('user_notification_settings', array_merge(
            ['user_id' => $userB->id],
            self::DEFAULTS
        ));
    }
}
