<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\ProfileUpdateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for ProfileUpdateService.
 *
 * Focuses on the pure business-logic behaviours:
 *  - Only provided fields are written (partial-update contract)
 *  - Email change resets email_verified_at and status to "pending"
 *  - Email unchanged leaves verification intact
 *  - Unknown/disallowed keys are silently ignored
 *  - The updated User model is returned
 */
class ProfileUpdateServiceTest extends TestCase
{
    use RefreshDatabase;

    private ProfileUpdateService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ProfileUpdateService();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'status'            => 'active',
        ], $overrides));
    }

    // ── Return value ──────────────────────────────────────────────────────────

    /** @test */
    public function update_returns_the_updated_user_model(): void
    {
        $user   = $this->makeUser(['name' => 'Before']);
        $result = $this->service->update($user, ['name' => 'After']);

        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals('After', $result->name);
    }

    // ── Partial-update contract ───────────────────────────────────────────────

    /** @test */
    public function only_provided_fields_are_persisted(): void
    {
        $user = $this->makeUser([
            'name'    => 'Alice',
            'phone'   => '+1 555 000 0000',
            'address' => '1 Unchanged St',
        ]);

        $this->service->update($user, ['name' => 'Alice Updated']);

        $user->refresh();
        $this->assertEquals('Alice Updated', $user->name);
        $this->assertEquals('+1 555 000 0000', $user->phone);
        $this->assertEquals('1 Unchanged St', $user->address);
    }

    /** @test */
    public function empty_data_array_leaves_user_unchanged(): void
    {
        $user      = $this->makeUser(['name' => 'Unchanged']);
        $updatedAt = $user->updated_at;

        $this->service->update($user, []);

        $user->refresh();
        $this->assertEquals('Unchanged', $user->name);
    }

    /** @test */
    public function disallowed_keys_are_silently_ignored(): void
    {
        $user = $this->makeUser(['name' => 'Safe']);

        $this->service->update($user, [
            'name'     => 'Safe Updated',
            'password' => 'h4ck3d',
            'is_admin' => true,
        ]);

        $user->refresh();
        $this->assertEquals('Safe Updated', $user->name);
        $this->assertFalse(password_verify('h4ck3d', $user->password));
    }

    // ── Email change logic ────────────────────────────────────────────────────

    /** @test */
    public function email_change_resets_email_verified_at_to_null(): void
    {
        $user = $this->makeUser(['email' => 'old@example.com', 'email_verified_at' => now()]);

        $this->service->update($user, ['email' => 'new@example.com']);

        $user->refresh();
        $this->assertNull($user->email_verified_at);
    }

    /** @test */
    public function email_change_sets_user_status_to_pending(): void
    {
        $user = $this->makeUser(['email' => 'before@example.com', 'status' => 'active']);

        $this->service->update($user, ['email' => 'after@example.com']);

        $user->refresh();
        $this->assertEquals('pending', $user->status);
    }

    /** @test */
    public function submitting_the_same_email_does_not_reset_verification(): void
    {
        $verifiedAt = now()->subDays(5);
        $user       = $this->makeUser([
            'email'             => 'same@example.com',
            'email_verified_at' => $verifiedAt,
            'status'            => 'active',
        ]);

        $this->service->update($user, ['email' => 'same@example.com']);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertEquals('active', $user->status);
    }

    /** @test */
    public function email_key_absent_from_data_leaves_verification_unchanged(): void
    {
        $user = $this->makeUser(['email_verified_at' => now(), 'status' => 'active']);

        $this->service->update($user, ['name' => 'Just a name change']);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertEquals('active', $user->status);
    }

    // ── All allowed fields persisted correctly ────────────────────────────────

    /** @test */
    public function all_allowed_fields_are_written_when_provided(): void
    {
        $user = $this->makeUser();

        $this->service->update($user, [
            'name'          => 'Full Update',
            'phone'         => '+44 7700 900000',
            'address'       => '221B Baker St, London',
            'date_of_birth' => '1980-01-15',
            'gender'        => 'prefer_not_to_say',
        ]);

        $user->refresh();
        $this->assertEquals('Full Update',           $user->name);
        $this->assertEquals('+44 7700 900000',       $user->phone);
        $this->assertEquals('221B Baker St, London', $user->address);
        $this->assertEquals('1980-01-15',            $user->date_of_birth->format('Y-m-d'));
        $this->assertEquals('prefer_not_to_say',     $user->gender);
    }
}
