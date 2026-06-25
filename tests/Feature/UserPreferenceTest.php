<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Feature tests for the Marketing Preferences API.
 *
 * Covers the two endpoints:
 *   GET  /api/user/preferences/marketing  — retrieve preferences
 *   PUT  /api/user/preferences/marketing  — update preferences
 *
 * Each test uses {@see RefreshDatabase} to start with a clean database state,
 * and authenticates via JWT tokens issued by {@see JWTAuth::fromUser()}.
 *
 * @package Tests\Feature
 */
class UserPreferenceTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Build the Authorization header array for a given user.
     *
     * Generates a signed JWT for the user and wraps it in the `Bearer` scheme
     * expected by the `auth:api` middleware.
     *
     * @param  User          $user  The user to authenticate as.
     * @return array<string, string>
     */
    private function authHeaders(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        return ['Authorization' => "Bearer {$token}"];
    }

    // -------------------------------------------------------------------------
    // Guest (unauthenticated) access
    // -------------------------------------------------------------------------

    /**
     * An unauthenticated request to GET preferences must be rejected with 401.
     */
    public function test_guest_cannot_get_preferences(): void
    {
        $response = $this->getJson('/api/user/preferences/marketing');
        $response->assertStatus(401);
    }

    /**
     * An unauthenticated request to PUT preferences must be rejected with 401.
     */
    public function test_guest_cannot_update_preferences(): void
    {
        $response = $this->putJson('/api/user/preferences/marketing', [
            'email_news'    => true,
            'email_offers'  => false,
            'email_surveys' => false,
        ]);
        $response->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // GET /api/user/preferences/marketing
    // -------------------------------------------------------------------------

    /**
     * When a user has never set preferences, the endpoint auto-creates a row
     * with the application defaults and returns them.
     *
     * Default values: email_news=true, email_offers=false, email_surveys=false.
     */
    public function test_authenticated_user_gets_default_preferences_on_first_access(): void
    {
        $user = User::factory()->create();

        $response = $this->getJson(
            '/api/user/preferences/marketing',
            $this->authHeaders($user)
        );

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => ['email_news', 'email_offers', 'email_surveys', 'updated_at'],
                 ])
                 ->assertJson([
                     'success' => true,
                     'data'    => [
                         'email_news'    => true,
                         'email_offers'  => false,
                         'email_surveys' => false,
                     ],
                 ]);

        $this->assertDatabaseHas('user_preferences', [
            'user_id'    => $user->id,
            'email_news' => true,
        ]);
    }

    /**
     * When a user already has a preference row, its persisted values are returned
     * rather than the application defaults.
     */
    public function test_authenticated_user_gets_existing_preferences(): void
    {
        $user = User::factory()->create();
        UserPreference::create([
            'user_id'       => $user->id,
            'email_news'    => false,
            'email_offers'  => true,
            'email_surveys' => true,
        ]);

        $response = $this->getJson(
            '/api/user/preferences/marketing',
            $this->authHeaders($user)
        );

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data'    => [
                         'email_news'    => false,
                         'email_offers'  => true,
                         'email_surveys' => true,
                     ],
                 ]);
    }

    // -------------------------------------------------------------------------
    // PUT /api/user/preferences/marketing
    // -------------------------------------------------------------------------

    /**
     * A valid PUT request must persist all three fields and echo them back.
     *
     * This also verifies the upsert behaviour when no pre-existing row exists
     * (the row is created on the PUT, not only on a prior GET).
     */
    public function test_authenticated_user_can_update_preferences(): void
    {
        $user = User::factory()->create();

        $response = $this->putJson(
            '/api/user/preferences/marketing',
            [
                'email_news'    => false,
                'email_offers'  => true,
                'email_surveys' => true,
            ],
            $this->authHeaders($user)
        );

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data'    => [
                         'email_news'    => false,
                         'email_offers'  => true,
                         'email_surveys' => true,
                     ],
                 ]);

        $this->assertDatabaseHas('user_preferences', [
            'user_id'       => $user->id,
            'email_news'    => false,
            'email_offers'  => true,
            'email_surveys' => true,
        ]);
    }

    /**
     * A second PUT must overwrite the existing row — no duplicate rows are created.
     *
     * Verifies that `updateOrCreate` keeps the user_preferences table at exactly
     * one row per user regardless of how many times preferences are saved.
     */
    public function test_update_overwrites_existing_preferences(): void
    {
        $user = User::factory()->create();
        UserPreference::create([
            'user_id'       => $user->id,
            'email_news'    => true,
            'email_offers'  => false,
            'email_surveys' => false,
        ]);

        $this->putJson(
            '/api/user/preferences/marketing',
            [
                'email_news'    => false,
                'email_offers'  => true,
                'email_surveys' => false,
            ],
            $this->authHeaders($user)
        )->assertStatus(200);

        $this->assertDatabaseHas('user_preferences', [
            'user_id'      => $user->id,
            'email_news'   => false,
            'email_offers' => true,
        ]);

        $this->assertEquals(
            1,
            UserPreference::where('user_id', $user->id)->count()
        );
    }

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    /**
     * A non-boolean value for any toggle must trigger a 422 validation error.
     *
     * Ensures the API rejects strings, numbers, and other non-boolean types so
     * only `true`/`false` (or JSON equivalents `1`/`0`) are accepted.
     */
    public function test_update_validates_boolean_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->putJson(
            '/api/user/preferences/marketing',
            [
                'email_news'    => 'not-a-boolean',
                'email_offers'  => false,
                'email_surveys' => false,
            ],
            $this->authHeaders($user)
        );

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email_news']);
    }

    /**
     * Omitting any of the three required fields must trigger a 422 validation error.
     *
     * All three toggles are required on every PUT so the API always has a
     * complete, unambiguous state to persist.
     */
    public function test_update_requires_all_three_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->putJson(
            '/api/user/preferences/marketing',
            ['email_news' => true],
            $this->authHeaders($user)
        );

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email_offers', 'email_surveys']);
    }
}
