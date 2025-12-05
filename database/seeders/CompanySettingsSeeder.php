<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use Illuminate\Database\Seeder;

class CompanySettingsSeeder extends Seeder
{
    public function run(): void
    {
        AppSetting::set('company_name', 'Getkenka', 'string');
        AppSetting::set('company_tax_code', '0318304909', 'string');
        AppSetting::set('company_email', 'purchasevn@getkenka.com', 'string');
        AppSetting::set('company_phone', '+84 0941069969', 'string');
        AppSetting::set('company_address', '2nd Floor, 81 CMT8 Street, Ben Thanh Ward, District 1, Ho Chi Minh City', 'string');
    }
}
