<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

/**
 * Small response factory used by migrated API controllers.
 *
 * Legacy keys can be supplied through $legacy so callers keep receiving the
 * response fields they already depend on while the canonical envelope is
 * introduced incrementally.
 */
final class ApiResponse
{
    public static function success(
        array $data = [],
        ?string $message = null,
        array $legacy = [],
        array $meta = [],
        int $status = 200
    ): JsonResponse {
        return response()->json(array_filter([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'meta' => $meta ?: null,
            ...$legacy,
        ], static fn ($value) => $value !== null), $status);
    }

    public static function error(
        string $message,
        int $status = 400,
        array $errors = [],
        array $meta = []
    ): JsonResponse {
        return response()->json(array_filter([
            'success' => false,
            'message' => $message,
            'errors' => $errors ?: null,
            'meta' => $meta ?: null,
        ], static fn ($value) => $value !== null), $status);
    }
}