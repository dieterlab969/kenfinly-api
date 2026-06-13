<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verify Pomodoro timer sync behavior for guests and registered users.
 */
class PomodoroSyncEngineTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Ensure a registered user's running timer restores with the expected remaining time.
     *
     * @return void
     */
    public function test_registered_user_restores_running_timer_with_900_seconds_remaining_after_10_minutes(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'is_suspended' => false,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/pomodoro/start')
            ->assertStatus(201)
            ->assertJson([
                'status' => 'running',
                'remaining_seconds' => 1500,
                'local_storage_only' => false,
            ]);

        $this->travel(10)->minutes();

        $this->actingAs($user->fresh(), 'api')
            ->getJson('/api/v1/pomodoro/state')
            ->assertOk()
            ->assertJson([
                'status' => 'running',
                'remaining_seconds' => 900,
                'completed_trigger' => false,
                'local_storage_only' => false,
            ]);
    }

    /**
     * Confirm that guests receive a local-storage-only payload and trigger no database writes.
     *
     * @return void
     */
    public function test_guest_requests_bypass_database_writes_and_return_local_storage_flag(): void
    {
        $this->postJson('/api/v1/pomodoro/start')
            ->assertStatus(201)
            ->assertJson([
                'status' => 'guest',
                'duration_seconds' => 1500,
                'local_storage_only' => true,
            ]);

        $this->assertDatabaseCount('pomodoro_active_states', 0);
        $this->assertDatabaseCount('pomodoro_sessions', 0);
    }
}
