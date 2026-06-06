<?php

namespace Tests\Feature;

use App\Http\Resources\HaloSessionResource;
use App\Models\Attendance;
use App\Models\User;
use App\Services\AttendanceService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class AttendanceStatusTest extends TestCase
{
    use RefreshDatabase;

    private function asState(array $payload): string
    {
        $req = Request::create('/');
        $out = (new HaloSessionResource($payload))->toArray($req);
        return $out['state'];
    }

    public function test_scenario_a_no_attendance_returns_idle()
    {
        $user = User::factory()->create(['timezone' => 'Asia/Ho_Chi_Minh']);

        // Freeze time to Vietnam local noon
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-07 12:00:00', 'Asia/Ho_Chi_Minh')->setTimezone('UTC'));

        $svc = app(AttendanceService::class);
        $payload = $svc->status($user);

        $this->assertSame('idle', $this->asState($payload));
    }

    public function test_scenario_b_started_today_returns_in_progress()
    {
        $user = User::factory()->create(['timezone' => 'Asia/Ho_Chi_Minh']);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-07 09:00:00', 'Asia/Ho_Chi_Minh')->setTimezone('UTC'));

        $nowUtc = CarbonImmutable::now('UTC');
        $haloDate = CarbonImmutable::now('Asia/Ho_Chi_Minh')->toDateString();

        Attendance::create([
            'user_id' => $user->id,
            'halo_date' => $haloDate,
            'status' => 'initiated',
            'started_at' => $nowUtc,
            'expected_end_at' => $nowUtc->addHours(8),
        ]);

        $svc = app(AttendanceService::class);
        $payload = $svc->status($user);
        $this->assertSame('in_progress', $this->asState($payload));
    }

    public function test_scenario_c_completed_today_returns_completed()
    {
        $user = User::factory()->create(['timezone' => 'Asia/Ho_Chi_Minh']);
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-07 07:00:00', 'Asia/Ho_Chi_Minh')->setTimezone('UTC'));

        $startedUtc = CarbonImmutable::now('UTC');
        $haloDate = CarbonImmutable::now('Asia/Ho_Chi_Minh')->toDateString();

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'halo_date' => $haloDate,
            'status' => 'initiated',
            'started_at' => $startedUtc,
            'expected_end_at' => $startedUtc->addHours(8),
        ]);

        // Advance time past expected end and mark completed
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-07 20:00:00', 'Asia/Ho_Chi_Minh')->setTimezone('UTC'));
        $attendance->forceFill(['status' => 'completed', 'ended_at' => CarbonImmutable::now('UTC')])->save();

        $svc = app(AttendanceService::class);
        $payload = $svc->status($user);
        $this->assertSame('completed', $this->asState($payload));
    }

    public function test_scenario_d_completed_yesterday_then_new_day_is_idle()
    {
        $user = User::factory()->create(['timezone' => 'Asia/Ho_Chi_Minh']);

        // Simulate a completed session yesterday (local)
        $yesterdayLocal = CarbonImmutable::parse('2026-06-06 10:00:00', 'Asia/Ho_Chi_Minh');
        $haloDate = $yesterdayLocal->toDateString();

        Attendance::create([
            'user_id' => $user->id,
            'halo_date' => $haloDate,
            'status' => 'completed',
            'started_at' => $yesterdayLocal->setTimezone('UTC'),
            'expected_end_at' => $yesterdayLocal->setTimezone('UTC')->addHours(8),
            'ended_at' => $yesterdayLocal->setTimezone('UTC')->addHours(8),
        ]);

        // Now advance to next day local time
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-07 09:00:00', 'Asia/Ho_Chi_Minh')->setTimezone('UTC'));

        $svc = app(AttendanceService::class);
        $payload = $svc->status($user);
        $this->assertSame('idle', $this->asState($payload));
    }

    public function test_scenario_e_server_utc_user_vn_timezone_correct()
    {
        config(['app.timezone' => 'UTC']);

        $user = User::factory()->create(['timezone' => 'Asia/Ho_Chi_Minh']);

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-07 08:00:00', 'Asia/Ho_Chi_Minh')->setTimezone('UTC'));

        $svc = app(AttendanceService::class);
        $payload = $svc->status($user);

        $this->assertSame('idle', $this->asState($payload));
    }
}
