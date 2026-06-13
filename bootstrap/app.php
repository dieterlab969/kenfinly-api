<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register alias
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'beta.access' => \App\Http\Middleware\CheckBetaAccess::class,
            'halo.integrity' => \App\Http\Middleware\VerifyHaloPointLedgerIntegrity::class,
            'pomodoro.acl' => \App\Http\Middleware\ResolvePomodoroAcl::class,
        ]);
        // Apply middleware to ALL web routes
        $middleware->web(append: [
            \App\Http\Middleware\CheckBetaAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
