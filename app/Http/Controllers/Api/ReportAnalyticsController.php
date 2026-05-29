<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * ReportAnalyticsController
 *
 * Stateless analytics endpoint that reads exclusively from the
 * ledger_category_daily_summaries pre-aggregated table.
 * Target response time: < 20 ms end-to-end.
 */
class ReportAnalyticsController extends Controller
{
    public function __construct(private readonly AnalyticsService $analytics) {}

    /**
     * GET /api/reports/analytics
     *
     * Query parameters:
     *   filter_type  string  required  7_days | 31_days | custom
     *   from_date    string  Y-m-d     required when filter_type = custom
     *   to_date      string  Y-m-d     required when filter_type = custom
     *   account_id   int     optional  filter to a single account
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'filter_type' => ['required', 'string', 'in:7_days,31_days,custom'],
            'from_date'   => ['required_if:filter_type,custom', 'nullable', 'date_format:Y-m-d'],
            'to_date'     => [
                'required_if:filter_type,custom',
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:from_date',
            ],
            'account_id' => ['nullable', 'integer', 'exists:accounts,id'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $payload = $this->analytics->getAnalytics($validator->validated(), $user);

        return response()->json($payload, 200);
    }
}
