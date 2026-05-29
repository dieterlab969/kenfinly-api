<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\LedgerCategoryDailySummary;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * AdvancedReportAnalyticsTest
 *
 * Verifies that GET /api/reports/analytics returns a perfectly-structured,
 * mathematically-correct analytics payload by seeding known data into the
 * ledger_category_daily_summaries table and asserting exact values.
 *
 * Test data layout (3 distinct days):
 *
 *   2026-05-01  Salary  income    8_000_000
 *   2026-05-01  Food    expense   2_000_000
 *   2026-05-01  Transport expense   500_000
 *   2026-05-02  Food    expense   1_000_000
 *   2026-05-03  Shopping expense  4_000_000
 *
 * Expected totals:
 *   total_income_minor  = 8_000_000
 *   total_expense_minor = 7_500_000
 *
 * Category breakdown (expense only, largest-remainder percentages):
 *   Shopping  4_000_000  53 %   (raw 53.333 → floor 53, gets 0 from remainder)
 *   Food      3_000_000  40 %   (raw 40.000 → floor 40, gets 0 from remainder)
 *   Transport   500_000   7 %   (raw  6.666 → floor  6, gets +1 from remainder)
 *   sum = 100 ✓
 *
 * Trend chart (expense per day):
 *   01/05 → 2_500_000
 *   02/05 → 1_000_000
 *   03/05 → 4_000_000
 */
class AdvancedReportAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private User    $user;
    private Account $account;

    /** @var array<string, Category> */
    private array $categories;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        // ── Create user (factory auto-creates a default wallet account)
        $this->user    = User::factory()->create();
        $this->account = $this->user->accounts()->firstOrFail();

        // ── Create categories with deterministic colors
        $this->categories = [
            'salary'    => Category::create(['name' => 'Salary',    'slug' => 'salary',    'type' => 'income',  'color' => '#4ADE80']),
            'food'      => Category::create(['name' => 'Food',      'slug' => 'food',      'type' => 'expense', 'color' => '#FF5733']),
            'transport' => Category::create(['name' => 'Transport', 'slug' => 'transport', 'type' => 'expense', 'color' => '#33A1FF']),
            'shopping'  => Category::create(['name' => 'Shopping',  'slug' => 'shopping',  'type' => 'expense', 'color' => '#FFD700']),
        ];

        // ── Seed the pre-aggregated summary table directly ────────────────
        // This mirrors what TransactionObserver writes at transaction creation
        // time, and isolates the analytics endpoint from the write path.
        $this->seedSummaries();
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    public function test_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/reports/analytics?filter_type=31_days');

        $response->assertStatus(401);
    }

    public function test_endpoint_validates_filter_type(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=bad_value');

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error')
            ->assertJsonStructure(['errors' => ['filter_type']]);
    }

    public function test_endpoint_requires_date_range_for_custom_filter(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom');

        $response->assertStatus(422)
            ->assertJsonStructure(['errors' => ['from_date', 'to_date']]);
    }

    public function test_custom_range_returns_correct_summary_totals(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.summary.total_income_minor',  8_000_000)
            ->assertJsonPath('data.summary.total_expense_minor', 7_500_000);
    }

    public function test_category_breakdown_contains_all_expense_categories(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03');

        $response->assertStatus(200);

        $breakdown = collect($response->json('data.category_breakdown'));

        $this->assertCount(3, $breakdown, 'Expected exactly 3 expense categories');

        // Income categories must NOT appear in the breakdown
        $this->assertNull(
            $breakdown->firstWhere('category_name', 'Salary'),
            'Income category should not appear in expense breakdown'
        );

        // All required categories are present
        $this->assertNotNull($breakdown->firstWhere('category_name', 'Shopping'));
        $this->assertNotNull($breakdown->firstWhere('category_name', 'Food'));
        $this->assertNotNull($breakdown->firstWhere('category_name', 'Transport'));
    }

    public function test_category_breakdown_amounts_are_correct(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03');

        $response->assertStatus(200);

        $breakdown = collect($response->json('data.category_breakdown'))
            ->keyBy('category_name');

        $this->assertEquals(3_000_000, $breakdown['Food']['amount_minor']);
        $this->assertEquals(500_000,   $breakdown['Transport']['amount_minor']);
        $this->assertEquals(4_000_000, $breakdown['Shopping']['amount_minor']);
    }

    public function test_category_breakdown_percentages_sum_to_100(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03');

        $response->assertStatus(200);

        $percentageSum = collect($response->json('data.category_breakdown'))
            ->sum('percentage');

        $this->assertEquals(100, $percentageSum, 'Percentages must sum to exactly 100');
    }

    public function test_category_breakdown_largest_remainder_percentages(): void
    {
        // Shopping  4_000_000 / 7_500_000 = 53.33 → floor 53
        // Food      3_000_000 / 7_500_000 = 40.00 → floor 40
        // Transport   500_000 / 7_500_000 =  6.66 → floor 6, +1 remainder = 7
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03');

        $response->assertStatus(200);

        $breakdown = collect($response->json('data.category_breakdown'))
            ->keyBy('category_name');

        $this->assertEquals(53, $breakdown['Shopping']['percentage'],   'Shopping should be 53%');
        $this->assertEquals(40, $breakdown['Food']['percentage'],       'Food should be 40%');
        $this->assertEquals(7,  $breakdown['Transport']['percentage'],  'Transport should be 7% (gets remainder)');
    }

    public function test_category_breakdown_preserves_color_hex(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03');

        $response->assertStatus(200);

        $breakdown = collect($response->json('data.category_breakdown'))
            ->keyBy('category_name');

        $this->assertEquals('#FFD700', $breakdown['Shopping']['color_hex']);
        $this->assertEquals('#FF5733', $breakdown['Food']['color_hex']);
        $this->assertEquals('#33A1FF', $breakdown['Transport']['color_hex']);
    }

    public function test_trend_chart_data_has_correct_daily_expense_totals(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03');

        $response->assertStatus(200);

        $trend = collect($response->json('data.trend_chart_data'))->keyBy('label');

        // Day 1: Food 2_000_000 + Transport 500_000 = 2_500_000
        $this->assertEquals(2_500_000, $trend['01/05']['value_minor'], 'Day 1 expense total mismatch');

        // Day 2: Food 1_000_000
        $this->assertEquals(1_000_000, $trend['02/05']['value_minor'], 'Day 2 expense total mismatch');

        // Day 3: Shopping 4_000_000
        $this->assertEquals(4_000_000, $trend['03/05']['value_minor'], 'Day 3 expense total mismatch');
    }

    public function test_trend_chart_labels_are_formatted_dd_mm(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03');

        $response->assertStatus(200);

        $labels = collect($response->json('data.trend_chart_data'))->pluck('label')->all();

        $this->assertContains('01/05', $labels);
        $this->assertContains('02/05', $labels);
        $this->assertContains('03/05', $labels);
    }

    public function test_7_days_filter_uses_rolling_window(): void
    {
        // Seed a row for "today" to ensure 7_days filter picks it up
        $today = now()->toDateString();
        LedgerCategoryDailySummary::create([
            'user_id'       => $this->user->id,
            'account_id'    => $this->account->id,
            'category_id'   => $this->categories['food']->id,
            'category_name' => 'Food',
            'color_hex'     => '#FF5733',
            'type'          => 'expense',
            'summary_date'  => $today,
            'amount_minor'  => 300_000,
            'tx_count'      => 1,
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=7_days');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => ['summary', 'category_breakdown', 'trend_chart_data'],
            ]);

        // Today's row must be included in the 7-day window
        $this->assertGreaterThanOrEqual(300_000, $response->json('data.summary.total_expense_minor'));
    }

    public function test_account_id_filter_scopes_results_to_single_account(): void
    {
        // Create a second account directly (no factory needed)
        $secondAccount = Account::create([
            'user_id'  => $this->user->id,
            'name'     => 'Second Account',
            'balance'  => 0,
            'currency' => 'VND',
        ]);

        LedgerCategoryDailySummary::create([
            'user_id'       => $this->user->id,
            'account_id'    => $secondAccount->id,
            'category_id'   => $this->categories['shopping']->id,
            'category_name' => 'Shopping',
            'color_hex'     => '#FFD700',
            'type'          => 'expense',
            'summary_date'  => '2026-05-01',
            'amount_minor'  => 9_000_000,   // large amount that shouldn't bleed into account 1
            'tx_count'      => 1,
        ]);

        // Query scoped to the FIRST account only
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03&account_id=' . $this->account->id);

        $response->assertStatus(200);

        // The 9_000_000 from the second account must NOT appear
        $this->assertEquals(
            7_500_000,
            $response->json('data.summary.total_expense_minor'),
            'account_id filter must isolate results to the specified account'
        );
    }

    public function test_returns_empty_data_when_no_records_in_range(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2000-01-01&to_date=2000-01-07');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.summary.total_income_minor',  0)
            ->assertJsonPath('data.summary.total_expense_minor', 0)
            ->assertJsonPath('data.category_breakdown',          [])
            ->assertJsonPath('data.trend_chart_data',            []);
    }

    public function test_payload_structure_matches_pwa_contract_exactly(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson('/api/reports/analytics?filter_type=custom&from_date=2026-05-01&to_date=2026-05-03');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'summary' => ['total_income_minor', 'total_expense_minor'],
                    'category_breakdown' => [
                        '*' => ['category_name', 'percentage', 'amount_minor', 'color_hex'],
                    ],
                    'trend_chart_data' => [
                        '*' => ['label', 'value_minor'],
                    ],
                ],
            ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function seedSummaries(): void
    {
        $uid = $this->user->id;
        $aid = $this->account->id;

        $rows = [
            // Day 1 — income + two expense categories
            [
                'user_id' => $uid, 'account_id' => $aid,
                'category_id' => $this->categories['salary']->id,
                'category_name' => 'Salary', 'color_hex' => '#4ADE80',
                'type' => 'income', 'summary_date' => '2026-05-01',
                'amount_minor' => 8_000_000, 'tx_count' => 1,
            ],
            [
                'user_id' => $uid, 'account_id' => $aid,
                'category_id' => $this->categories['food']->id,
                'category_name' => 'Food', 'color_hex' => '#FF5733',
                'type' => 'expense', 'summary_date' => '2026-05-01',
                'amount_minor' => 2_000_000, 'tx_count' => 1,
            ],
            [
                'user_id' => $uid, 'account_id' => $aid,
                'category_id' => $this->categories['transport']->id,
                'category_name' => 'Transport', 'color_hex' => '#33A1FF',
                'type' => 'expense', 'summary_date' => '2026-05-01',
                'amount_minor' => 500_000, 'tx_count' => 1,
            ],

            // Day 2 — food expense only
            [
                'user_id' => $uid, 'account_id' => $aid,
                'category_id' => $this->categories['food']->id,
                'category_name' => 'Food', 'color_hex' => '#FF5733',
                'type' => 'expense', 'summary_date' => '2026-05-02',
                'amount_minor' => 1_000_000, 'tx_count' => 1,
            ],

            // Day 3 — shopping expense only
            [
                'user_id' => $uid, 'account_id' => $aid,
                'category_id' => $this->categories['shopping']->id,
                'category_name' => 'Shopping', 'color_hex' => '#FFD700',
                'type' => 'expense', 'summary_date' => '2026-05-03',
                'amount_minor' => 4_000_000, 'tx_count' => 1,
            ],
        ];

        foreach ($rows as $row) {
            LedgerCategoryDailySummary::create($row);
        }
    }
}
