<?php

namespace App\Providers;

use App\Models\User;
use App\Observers\UserObserver;
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

        if (class_exists(\Dedoc\Scramble\Scramble::class)) {
            \Dedoc\Scramble\Scramble::afterOpenApiGenerated(function (
                \Dedoc\Scramble\Support\Generator\OpenApi $openApi
            ) {
                $openApi->info->title = 'Kenfinly API';
                $openApi->info->version = config('scramble.info.version', '1.0.0');

                $openApi->info->contact = [
                    'name'  => 'Kenfinly Support',
                    'email' => 'support@kenfinly.com',
                ];

                $openApi->info->license = [
                    'name' => 'Proprietary',
                ];

                $openApi->secure(
                    \Dedoc\Scramble\Support\Generator\SecurityScheme::http('bearer')
                );
            });
        }

        if (config('app.env') === 'staging' || config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
