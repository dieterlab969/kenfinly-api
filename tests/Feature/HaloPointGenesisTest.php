<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HaloPointGenesisTest extends TestCase
{
    use RefreshDatabase;

    public function test_newly_registered_user_receives_welcome_bonus_and_genesis_block(): void
    {
        Http::fake();
        $this->seed(\Database\Seeders\RoleSeeder::class);

        $this->postJson('/api/auth/register', [
            'name' => 'Halo User',
            'email' => 'halo@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(201);

        $user = User::where('email', 'halo@example.com')->first();

        $this->assertNotNull($user);
        $this->assertSame(100, (int) $user->halo_points_balance);
        $this->assertFalse((bool) $user->is_suspended);

        $ledgerEntry = DB::table('halo_point_ledger')
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->first();

        $this->assertNotNull($ledgerEntry);
        $this->assertSame('welcome_bonus', $ledgerEntry->transaction_type);
        $this->assertSame(100, (int) $ledgerEntry->amount);
        $this->assertSame(str_repeat('0', 64), $ledgerEntry->previous_hash);

        $expectedHash = hash(
            'sha256',
            $ledgerEntry->previous_hash
            .$user->id
            .$ledgerEntry->amount
            .$ledgerEntry->transaction_type
            .Carbon::parse($ledgerEntry->created_at)->format('Y-m-d H:i:s')
        );

        $this->assertSame($expectedHash, $ledgerEntry->current_hash);
        $this->assertDatabaseCount('halo_point_ledger', 1);
    }

    public function test_tampered_ledger_suspends_user_and_returns_lockdown_payload(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $ledgerEntry = DB::table('halo_point_ledger')
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->first();

        $this->assertNotNull($ledgerEntry);

        DB::table('halo_point_ledger')
            ->where('id', $ledgerEntry->id)
            ->update(['amount' => 999]);

        $this->actingAs($user, 'api')
            ->getJson('/api/auth/me')
            ->assertStatus(403)
            ->assertExactJson([
                'status' => 'suspended',
                'message' => 'Hệ thống phát hiện gian lận kỷ luật - Tài khoản bị phong tỏa',
            ]);

        $user->refresh();

        $this->assertTrue((bool) $user->is_suspended);
        $this->assertSame('suspended', $user->status);
    }
}
