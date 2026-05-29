<?php

namespace App\Modules\Inspirations\Providers;

use Illuminate\Support\ServiceProvider;

class InspirationsServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
    }
}
