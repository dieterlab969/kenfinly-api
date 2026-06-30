<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Feature tests for the Security Settings API.
 *
 * Covers:
 *  GET  /api/v1/user/security-settings  — fetch, auth guard, response shape
 *  PUT  /api/v1/user/security-settings  — toggle update, validation, partial update
 *  PUT  /api/v1/user/change-password    — happy path, wrong password, validation
 *  POST /api/v1/user/change-pin         — create, update, wrong current PIN, validation
 */
class SecuritySettingsTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at'           => now(),
            'status'                      => 'active',
            'is_2fa_enabled'              => false,
            'is_biometric_enabled'        => false,
            'login_notifications_enabled' => true,
            'security_alerts_enabled'     => true,
            'pin_hash'                    => null,
        ], $overrides));
    }

    // ── GET /api/v1/user/security-settings ────────────────────────────────────

    #[Test]
    public function unauthenticated_user_cannot_fetch_security_settings(): void
    {
        $this->getJson('/api/v1/user/security-settings')
            ->assertUnauthorized();
    }

    #[Test]
    public function authenticated_user_can_fetch_security_settings(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->getJson('/api/v1/user/security-settings')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'settings' => [
                    'is_2fa_enabled',
                    'is_biometric_enabled',
                    'login_notifications_enabled',
                    'security_alerts_enabled',
                    'has_pin',
                ],
            ]);
    }

    #[Test]
    public function get_returns_correct_default_values(): void
    {
        $user = $this->makeUser();

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/v1/user/security-settings')
            ->assertOk();

        $this->assertFalse($response->json('settings.is_2fa_enabled'));
        $this->assertFalse($response->json('settings.is_biometric_enabled'));
        $this->assertTrue($response->json('settings.login_notifications_enabled'));
        $this->assertTrue($response->json('settings.security_alerts_enabled'));
        $this->assertFalse($response->json('settings.has_pin'));
    }

    #[Test]
    public function get_returns_has_pin_true_when_user_has_a_pin(): void
    {
        $user = $this->makeUser(['pin_hash' => Hash::make('123456')]);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/v1/user/security-settings')
            ->assertOk();

        $this->assertTrue($response->json('settings.has_pin'));
    }

    // ── PUT /api/v1/user/security-settings ───────────────────────────────────

    #[Test]
    public function unauthenticated_user_cannot_update_security_settings(): void
    {
        $this->putJson('/api/v1/user/security-settings', ['is_2fa_enabled' => true])
            ->assertUnauthorized();
    }

    #[Test]
    public function can_enable_two_factor_authentication(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/security-settings', ['is_2fa_enabled' => true])
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('settings.is_2fa_enabled', true);

        $this->assertTrue($user->fresh()->is_2fa_enabled);
    }

    #[Test]
    public function can_disable_login_notifications(): void
    {
        $user = $this->makeUser(['login_notifications_enabled' => true]);

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/security-settings', ['login_notifications_enabled' => false])
            ->assertOk()
            ->assertJsonPath('settings.login_notifications_enabled', false);

        $this->assertFalse($user->fresh()->login_notifications_enabled);
    }

    #[Test]
    public function partial_update_does_not_overwrite_untouched_toggles(): void
    {
        $user = $this->makeUser([
            'is_2fa_enabled'   => true,
            'is_biometric_enabled' => false,
        ]);

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/security-settings', ['security_alerts_enabled' => false])
            ->assertOk();

        $user->refresh();
        $this->assertTrue($user->is_2fa_enabled, '2FA was unexpectedly changed');
        $this->assertFalse($user->is_biometric_enabled, 'Biometric was unexpectedly changed');
        $this->assertFalse($user->security_alerts_enabled);
    }

    #[Test]
    public function can_update_all_four_toggles_in_one_request(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/security-settings', [
                'is_2fa_enabled'              => true,
                'is_biometric_enabled'        => true,
                'login_notifications_enabled' => false,
                'security_alerts_enabled'     => false,
            ])
            ->assertOk();

        $user->refresh();
        $this->assertTrue($user->is_2fa_enabled);
        $this->assertTrue($user->is_biometric_enabled);
        $this->assertFalse($user->login_notifications_enabled);
        $this->assertFalse($user->security_alerts_enabled);
    }

    #[Test]
    public function update_rejects_non_boolean_value(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/security-settings', ['is_2fa_enabled' => 'yes'])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['is_2fa_enabled' => ['Two-Factor Authentication must be true or false.']]);
    }

    #[Test]
    public function update_ignores_unknown_fields(): void
    {
        $user = $this->makeUser();

        // Should succeed without error despite unknown field
        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/security-settings', [
                'is_2fa_enabled'  => true,
                'unknown_field'   => 'whatever',
            ])
            ->assertOk();
    }

    // ── PUT /api/v1/user/change-password ──────────────────────────────────────

    #[Test]
    public function unauthenticated_user_cannot_change_password(): void
    {
        $this->putJson('/api/v1/user/change-password', [
            'current_password' => 'password',
            'new_password'     => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ])->assertUnauthorized();
    }

    #[Test]
    public function user_can_change_password_with_correct_current_password(): void
    {
        $user = $this->makeUser(['password' => Hash::make('oldpassword')]);

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/change-password', [
                'current_password'          => 'oldpassword',
                'new_password'              => 'newpassword123',
                'new_password_confirmation' => 'newpassword123',
            ])
            ->assertOk()
            ->assertJson(['success' => true]);

        // Verify the password was actually updated
        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    }

    #[Test]
    public function change_password_fails_with_wrong_current_password(): void
    {
        $user = $this->makeUser(['password' => Hash::make('correct_password')]);

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/change-password', [
                'current_password'          => 'wrong_password',
                'new_password'              => 'newpassword123',
                'new_password_confirmation' => 'newpassword123',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['current_password' => ['Current password is incorrect.']]);
    }

    #[Test]
    public function change_password_rejects_new_password_under_8_chars(): void
    {
        $user = $this->makeUser(['password' => Hash::make('oldpassword')]);

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/change-password', [
                'current_password'          => 'oldpassword',
                'new_password'              => 'short',
                'new_password_confirmation' => 'short',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    #[Test]
    public function change_password_rejects_mismatched_confirmation(): void
    {
        $user = $this->makeUser(['password' => Hash::make('oldpassword')]);

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/change-password', [
                'current_password'          => 'oldpassword',
                'new_password'              => 'newpassword123',
                'new_password_confirmation' => 'different123',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    #[Test]
    public function change_password_rejects_same_as_current(): void
    {
        $user = $this->makeUser(['password' => Hash::make('samepassword123')]);

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/change-password', [
                'current_password'          => 'samepassword123',
                'new_password'              => 'samepassword123',
                'new_password_confirmation' => 'samepassword123',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    // ── POST /api/v1/user/change-pin ──────────────────────────────────────────

    #[Test]
    public function unauthenticated_user_cannot_change_pin(): void
    {
        $this->postJson('/api/v1/user/change-pin', [
            'new_pin'              => '123456',
            'new_pin_confirmation' => '123456',
        ])->assertUnauthorized();
    }

    #[Test]
    public function user_can_set_a_pin_when_none_exists(): void
    {
        $user = $this->makeUser(['pin_hash' => null]);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/user/change-pin', [
                'new_pin'              => '123456',
                'new_pin_confirmation' => '123456',
            ])
            ->assertOk()
            ->assertJson(['success' => true, 'has_pin' => true]);

        $user->refresh();
        $this->assertNotNull($user->pin_hash);
        $this->assertTrue(Hash::check('123456', $user->pin_hash));
    }

    #[Test]
    public function user_can_change_pin_with_correct_current_pin(): void
    {
        $user = $this->makeUser(['pin_hash' => Hash::make('111111')]);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/user/change-pin', [
                'current_pin'          => '111111',
                'new_pin'              => '999999',
                'new_pin_confirmation' => '999999',
            ])
            ->assertOk()
            ->assertJson(['success' => true]);

        $user->refresh();
        $this->assertTrue(Hash::check('999999', $user->pin_hash));
    }

    #[Test]
    public function change_pin_fails_when_existing_pin_is_missing_from_request(): void
    {
        $user = $this->makeUser(['pin_hash' => Hash::make('111111')]);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/user/change-pin', [
                'new_pin'              => '999999',
                'new_pin_confirmation' => '999999',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['current_pin' => ['Your current PIN is required to set a new one.']]);
    }

    #[Test]
    public function change_pin_fails_with_wrong_current_pin(): void
    {
        $user = $this->makeUser(['pin_hash' => Hash::make('111111')]);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/user/change-pin', [
                'current_pin'          => '000000',
                'new_pin'              => '999999',
                'new_pin_confirmation' => '999999',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['current_pin' => ['Current PIN is incorrect.']]);
    }

    #[Test]
    public function change_pin_rejects_non_numeric_pin(): void
    {
        $user = $this->makeUser(['pin_hash' => null]);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/user/change-pin', [
                'new_pin'              => 'abcdef',
                'new_pin_confirmation' => 'abcdef',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    #[Test]
    public function change_pin_rejects_pin_shorter_than_6_digits(): void
    {
        $user = $this->makeUser(['pin_hash' => null]);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/user/change-pin', [
                'new_pin'              => '1234',
                'new_pin_confirmation' => '1234',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    #[Test]
    public function change_pin_rejects_mismatched_confirmation(): void
    {
        $user = $this->makeUser(['pin_hash' => null]);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/user/change-pin', [
                'new_pin'              => '123456',
                'new_pin_confirmation' => '654321',
            ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    #[Test]
    public function pin_is_never_returned_in_any_response(): void
    {
        $user = $this->makeUser(['pin_hash' => null]);

        $pinResponse = $this->actingAs($user, 'api')
            ->postJson('/api/v1/user/change-pin', [
                'new_pin'              => '123456',
                'new_pin_confirmation' => '123456',
            ])
            ->assertOk();

        $body = json_encode($pinResponse->json());
        $this->assertStringNotContainsString('123456', $body);
        $this->assertStringNotContainsString('pin_hash', $body);
    }

    #[Test]
    public function settings_response_does_not_expose_pin_hash(): void
    {
        $user = $this->makeUser(['pin_hash' => Hash::make('123456')]);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/v1/user/security-settings')
            ->assertOk();

        $this->assertArrayNotHasKey('pin_hash', $response->json('settings'));
        $this->assertTrue($response->json('settings.has_pin'));
    }
}
