<?php

return [
    App\Providers\AppServiceProvider::class,

    // ── Modular architecture — one provider per domain module ─────────────
    App\Modules\Attendance\Providers\AttendanceServiceProvider::class,
    App\Modules\Payments\Providers\PaymentsServiceProvider::class,
    App\Modules\Inspirations\Providers\InspirationsServiceProvider::class,
    App\Modules\Promotions\Providers\PromotionsServiceProvider::class,
    App\Modules\Reports\Providers\ReportsServiceProvider::class,
    App\Modules\Users\Providers\UsersServiceProvider::class,
];
