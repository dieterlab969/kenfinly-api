<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class UserPreferenceTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_guest_cannot_get_preferences(): void
    {
        $response = $this->getJson('/api/user/preferences/marketing');
        $response->assertStatus(401);
    }

    public function test_guest_cannot_update_preferences(): void
    {
        $response = $this->putJson('/api/user/preferences/marketing', [
            'email_news'    => true,
            'email_offers'  => false,
            'email_surveys' => false,
        ]);
        $response->assertStatus(401);
    }

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
