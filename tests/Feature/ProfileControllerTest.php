<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for ProfileController (GET /api/profile, PUT /api/profile).
 *
 * Covers:
 *  - Authentication guard on both endpoints
 *  - GET: response shape includes all profile fields
 *  - PUT: partial updates for every editable field
 *  - PUT: email uniqueness enforcement (self-exclusion)
 *  - PUT: email change resets email_verified_at / status
 *  - PUT: validation rules for all fields
 *  - PUT: partial-update isolation (untouched fields are not overwritten)
 */
class ProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'status'            => 'active',
        ], $overrides));
    }

    // ── GET /api/profile — auth guard ─────────────────────────────────────────

    /** @test */
    public function unauthenticated_user_cannot_get_profile(): void
    {
        $this->getJson('/api/profile')
            ->assertUnauthorized();
    }

    // ── GET /api/profile — happy path ─────────────────────────────────────────

    /** @test */
    public function authenticated_user_can_get_their_profile(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->getJson('/api/profile')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('profile.email', $user->email);
    }

    /** @test */
    public function profile_response_contains_all_expected_fields(): void
    {
        $user = $this->makeUser([
            'phone'         => '+1 555 000 1234',
            'address'       => '123 Main St, Springfield',
            'date_of_birth' => '1990-06-15',
            'gender'        => 'male',
        ]);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/profile')
            ->assertOk();

        $response->assertJsonStructure([
            'profile' => [
                'id', 'name', 'email', 'phone', 'address',
                'date_of_birth', 'gender', 'avatar',
                'email_verified', 'status', 'roles', 'created_at', 'updated_at',
            ],
        ]);

        $response->assertJsonPath('profile.phone',         '+1 555 000 1234')
                 ->assertJsonPath('profile.address',       '123 Main St, Springfield')
                 ->assertJsonPath('profile.date_of_birth', '1990-06-15')
                 ->assertJsonPath('profile.gender',        'male');
    }

    // ── PUT /api/profile — auth guard ─────────────────────────────────────────

    /** @test */
    public function unauthenticated_user_cannot_update_profile(): void
    {
        $this->putJson('/api/profile', ['name' => 'Hacker'])
            ->assertUnauthorized();
    }

    // ── PUT /api/profile — individual field updates ───────────────────────────

    /** @test */
    public function authenticated_user_can_update_name(): void
    {
        $user = $this->makeUser(['name' => 'Old Name']);

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['name' => 'New Name'])
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('profile.name', 'New Name');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'New Name']);
    }

    /** @test */
    public function authenticated_user_can_update_phone(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['phone' => '+84 912 345 678'])
            ->assertOk()
            ->assertJsonPath('profile.phone', '+84 912 345 678');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'phone' => '+84 912 345 678']);
    }

    /** @test */
    public function authenticated_user_can_update_address(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['address' => '456 Oak Ave, Portland, OR 97201'])
            ->assertOk()
            ->assertJsonPath('profile.address', '456 Oak Ave, Portland, OR 97201');

        $this->assertDatabaseHas('users', [
            'id'      => $user->id,
            'address' => '456 Oak Ave, Portland, OR 97201',
        ]);
    }

    /** @test */
    public function authenticated_user_can_update_date_of_birth(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['date_of_birth' => '1992-03-20'])
            ->assertOk()
            ->assertJsonPath('profile.date_of_birth', '1992-03-20');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'date_of_birth' => '1992-03-20']);
    }

    /** @test */
    public function authenticated_user_can_update_gender(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['gender' => 'female'])
            ->assertOk()
            ->assertJsonPath('profile.gender', 'female');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'gender' => 'female']);
    }

    /** @test */
    public function authenticated_user_can_clear_optional_fields_by_sending_null(): void
    {
        $user = $this->makeUser(['phone' => '+1 800 000 0000', 'address' => '1 Place']);

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['phone' => null, 'address' => null])
            ->assertOk()
            ->assertJsonPath('profile.phone',   null)
            ->assertJsonPath('profile.address', null);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'phone' => null, 'address' => null]);
    }

    // ── PUT /api/profile — email update ───────────────────────────────────────

    /** @test */
    public function user_can_update_their_email_to_a_new_unique_address(): void
    {
        $user = $this->makeUser(['email' => 'old@example.com']);

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['email' => 'new@example.com'])
            ->assertOk()
            ->assertJsonPath('profile.email',          'new@example.com')
            ->assertJsonPath('profile.email_verified', false);

        $this->assertDatabaseHas('users', [
            'id'                => $user->id,
            'email'             => 'new@example.com',
            'email_verified_at' => null,
        ]);
    }

    /** @test */
    public function user_can_submit_their_own_current_email_without_uniqueness_error(): void
    {
        $user = $this->makeUser(['email' => 'same@example.com']);

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['email' => 'same@example.com'])
            ->assertOk()
            ->assertJsonPath('profile.email', 'same@example.com');
    }

    /** @test */
    public function email_update_fails_when_address_already_belongs_to_another_user(): void
    {
        $this->makeUser(['email' => 'taken@example.com']);
        $user = $this->makeUser(['email' => 'mine@example.com']);

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['email' => 'taken@example.com'])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['email' => ['This email address is already in use.']]);
    }

    /** @test */
    public function email_change_resets_verification_and_sets_status_to_pending(): void
    {
        $user = $this->makeUser([
            'email'             => 'before@example.com',
            'email_verified_at' => now(),
            'status'            => 'active',
        ]);

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['email' => 'after@example.com'])
            ->assertOk();

        $user->refresh();
        $this->assertNull($user->email_verified_at);
        $this->assertEquals('pending', $user->status);
    }

    /** @test */
    public function email_unchanged_does_not_reset_verification(): void
    {
        $verifiedAt = now()->subDays(10);
        $user       = $this->makeUser([
            'email'             => 'same@example.com',
            'email_verified_at' => $verifiedAt,
            'status'            => 'active',
        ]);

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['email' => 'same@example.com'])
            ->assertOk();

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertEquals('active', $user->status);
    }

    // ── PUT /api/profile — validation rules ───────────────────────────────────

    /** @test */
    public function name_is_required_when_the_key_is_present(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['name' => ''])
            ->assertStatus(422)
            ->assertJsonFragment(['name' => ['Name is required.']]);
    }

    /** @test */
    public function name_must_be_at_least_two_characters(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['name' => 'A'])
            ->assertStatus(422)
            ->assertJsonFragment(['name' => ['Name must be at least 2 characters.']]);
    }

    /** @test */
    public function name_must_not_exceed_100_characters(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['name' => str_repeat('x', 101)])
            ->assertStatus(422)
            ->assertJsonFragment(['name' => ['Name must not exceed 100 characters.']]);
    }

    /** @test */
    public function email_must_be_a_valid_address(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['email' => 'not-an-email'])
            ->assertStatus(422)
            ->assertJsonFragment(['email' => ['Please provide a valid email address.']]);
    }

    /** @test */
    public function phone_is_rejected_when_it_contains_invalid_characters(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['phone' => 'CALL_ME_MAYBE'])
            ->assertStatus(422)
            ->assertJsonFragment(['phone' => ['Phone number contains invalid characters.']]);
    }

    /** @test */
    public function phone_is_rejected_when_it_exceeds_30_characters(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['phone' => '+1 ' . str_repeat('5', 29)])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /** @test */
    public function address_is_rejected_when_it_exceeds_500_characters(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['address' => str_repeat('a', 501)])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /** @test */
    public function future_date_of_birth_is_rejected(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['date_of_birth' => now()->addYear()->format('Y-m-d')])
            ->assertStatus(422)
            ->assertJsonFragment(['date_of_birth' => ['Date of birth must be in the past.']]);
    }

    /** @test */
    public function invalid_date_of_birth_string_is_rejected(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['date_of_birth' => 'not-a-date'])
            ->assertStatus(422)
            ->assertJsonFragment(['date_of_birth' => ['Date of birth must be a valid date.']]);
    }

    /** @test */
    public function gender_must_be_one_of_the_allowed_values(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['gender' => 'attack_helicopter'])
            ->assertStatus(422)
            ->assertJsonFragment(['gender' => ['Gender must be one of: male, female, other, or prefer_not_to_say.']]);
    }

    // ── PUT /api/profile — partial-update isolation ───────────────────────────

    /** @test */
    public function partial_update_does_not_overwrite_untouched_fields(): void
    {
        $user = $this->makeUser([
            'name'         => 'Alice',
            'phone'        => '+1 800 000 0001',
            'address'      => '1 Kept Ave',
            'gender'       => 'female',
        ]);

        // Only update name — everything else must survive unchanged.
        $this->actingAs($user, 'api')
            ->putJson('/api/profile', ['name' => 'Alice Updated'])
            ->assertOk()
            ->assertJsonPath('profile.name',    'Alice Updated')
            ->assertJsonPath('profile.phone',   '+1 800 000 0001')
            ->assertJsonPath('profile.address', '1 Kept Ave')
            ->assertJsonPath('profile.gender',  'female');

        $this->assertDatabaseHas('users', [
            'id'      => $user->id,
            'name'    => 'Alice Updated',
            'phone'   => '+1 800 000 0001',
            'address' => '1 Kept Ave',
            'gender'  => 'female',
        ]);
    }

    /** @test */
    public function all_editable_fields_can_be_updated_in_one_request(): void
    {
        $user = $this->makeUser(['email' => 'original@example.com']);

        $payload = [
            'name'          => 'Full Update Name',
            'phone'         => '+44 7911 123456',
            'address'       => '10 Downing St, London',
            'date_of_birth' => '1985-12-01',
            'gender'        => 'other',
        ];

        $this->actingAs($user, 'api')
            ->putJson('/api/profile', $payload)
            ->assertOk()
            ->assertJsonPath('profile.name',          'Full Update Name')
            ->assertJsonPath('profile.phone',         '+44 7911 123456')
            ->assertJsonPath('profile.address',       '10 Downing St, London')
            ->assertJsonPath('profile.date_of_birth', '1985-12-01')
            ->assertJsonPath('profile.gender',        'other');
    }
}
