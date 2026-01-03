<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Waitlist;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Controller to manage waitlist sign-ups.
 *
 * Handles storing new email entries with optional plan interest.
 */
class WaitlistController extends Controller
{
    /**
     * Store a new waitlist entry.
     *
     * Validates the email and optional plan interest, then creates a new waitlist record.
     *
     * @param Request $request Incoming HTTP request containing email and optional plan_interest.
     * @return JsonResponse JSON response confirming successful waitlist sign-up.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|unique:waitlists,email',
            'plan_interest' => 'nullable|string'
        ]);

        Waitlist::create($request->only(['email', 'plan_interest']));

        $translations = json_decode(file_get_contents(resource_path('lang/translations.json')), true);
        $locale = $request->header('Accept-Language', 'en');
        $locale = in_array($locale, ['en', 'vi']) ? $locale : 'en';
        $message = $translations['payment.waitlist_success'][$locale] ?? 'Successfully joined the waitlist!';

        return response()->json(['message' => $message], 201);
    }
}
