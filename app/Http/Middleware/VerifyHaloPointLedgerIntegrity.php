<?php

namespace App\Http\Middleware;

use App\Services\HaloPointLedgerService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyHaloPointLedgerIntegrity
{
    public function __construct(private HaloPointLedgerService $haloPointLedgerService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $this->haloPointLedgerService->ensureIntegrity($user);
        }

        return $next($request);
    }
}
