<?php

namespace App\Providers;

use App\Models\User;
use App\Observers\UserObserver;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        User::observe(UserObserver::class);

        Scramble::afterOpenApiGenerated(function (OpenApi $openApi) {
            $openApi->info->title = 'Kenfinly API';
            $openApi->info->version = config('scramble.info.version', '1.0.0');

            $openApi->info->contact = [
                'name' => 'Kenfinly Support',
                'email' => 'support@kenfinly.com',
            ];

            $openApi->info->license = [
                'name' => 'Proprietary',
            ];
        });
	User::observe(UserObserver::class);
	// Always generate secure asset URLs, fully resolving the Mixed Content issue.
	if (config('app.env') === 'staging' || config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
