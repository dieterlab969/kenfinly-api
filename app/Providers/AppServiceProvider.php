<?php

namespace App\Providers;

use App\Models\User;
use App\Observers\UserObserver;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
	User::observe(UserObserver::class);
	// Always generate secure asset URLs, fully resolving the Mixed Content issue.
	if (config('app.env') === 'staging' || config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
