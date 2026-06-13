<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Verify semi-annual hourly rate governance behavior.
 */
class HourlyRateGovernanceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Confirm that a user may update the hourly rate once in H1 and once in H2.
     *
     * @return void
     */
    public function test_user_can_update_hourly_rate_once_in_each_review_window(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'email_verified_at' => now(),
            'timezone' => 'Asia/Ho_Chi_Minh',
            'hourly_rate' => 100000,
        ]);

        $this->travelTo(CarbonImmutable::create(2026, 3, 15, 9, 0, 0, 'Asia/Ho_Chi_Minh'));

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/hourly-rate', [
                'hourly_rate' => 120000,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.hourly_rate', 120000);

        $this->travelTo(CarbonImmutable::create(2026, 8, 15, 9, 0, 0, 'Asia/Ho_Chi_Minh'));

        $this->actingAs($user->fresh(), 'api')
            ->putJson('/api/v1/user/hourly-rate', [
                'hourly_rate' => 150000,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.hourly_rate', 150000);

        $user->refresh();

        $this->assertSame(150000, (int) $user->hourly_rate);
        $this->assertDatabaseCount('user_rate_logs', 2);
        $this->assertDatabaseHas('user_rate_logs', [
            'user_id' => $user->id,
            'old_rate' => 100000,
            'new_rate' => 120000,
            'allowance_year' => 2026,
            'review_window' => 'H1',
        ]);
        $this->assertDatabaseHas('user_rate_logs', [
            'user_id' => $user->id,
            'old_rate' => 120000,
            'new_rate' => 150000,
            'allowance_year' => 2026,
            'review_window' => 'H2',
        ]);
    }

    /**
     * Ensure that the second update attempt inside the same review window is rejected.
     *
     * @return void
     */
    public function test_second_update_in_same_review_window_is_blocked_with_correct_error(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'email_verified_at' => now(),
            'timezone' => 'Asia/Ho_Chi_Minh',
            'hourly_rate' => 100000,
        ]);

        $this->travelTo(CarbonImmutable::create(2026, 5, 20, 10, 0, 0, 'Asia/Ho_Chi_Minh'));

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/hourly-rate', [
                'hourly_rate' => 130000,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.hourly_rate', 130000);

        $this->actingAs($user->fresh(), 'api')
            ->putJson('/api/v1/user/hourly-rate', [
                'hourly_rate' => 140000,
            ])
            ->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'code' => 'RATE_UPDATE_WINDOW_LOCKED',
                'message' => 'Bạn đã cập nhật Mức định giá bản thân trong kỳ review này. Lần cập nhật tiếp theo sẽ được mở vào kỳ review tiếp theo.',
            ]);

        $user->refresh();

        $this->assertSame(130000, (int) $user->hourly_rate);
        $this->assertSame(1, DB::table('user_rate_logs')->where('user_id', $user->id)->count());
    }

    /**
     * Verify that the review window boundary is computed using the user's timezone.
     *
     * @return void
     */
    public function test_review_window_is_determined_from_user_timezone(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'email_verified_at' => now(),
            'timezone' => 'Asia/Ho_Chi_Minh',
            'hourly_rate' => 100000,
        ]);

        $this->travelTo(CarbonImmutable::create(2026, 6, 30, 18, 30, 0, 'UTC'));

        $this->actingAs($user, 'api')
            ->putJson('/api/v1/user/hourly-rate', [
                'hourly_rate' => 160000,
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('user.hourly_rate', 160000);

        $this->assertDatabaseHas('user_rate_logs', [
            'user_id' => $user->id,
            'allowance_year' => 2026,
            'review_window' => 'H2',
        ]);
    }
}
