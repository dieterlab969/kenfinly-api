<?php

namespace App\Providers;

use App\Models\Transaction;
use App\Models\User;
use App\Observers\TransactionObserver;
use App\Observers\UserObserver;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        User::observe(UserObserver::class);
        Transaction::observe(TransactionObserver::class);

        if (
            isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
            || (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'replit.dev'))
            || (isset($_SERVER['HTTP_HOST']) && str_contains($_SERVER['HTTP_HOST'], 'repl.co'))
        ) {
            URL::forceScheme('https');
        }
    }
}
