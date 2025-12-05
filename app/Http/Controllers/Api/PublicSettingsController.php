<?php

namespace App\Http\Controllers\Api;

use App\Models\AppSetting;
use Illuminate\Http\JsonResponse;

/**
 * Controller to provide public company settings via API.
 */
class PublicSettingsController
{
    /**
     * Get company information.
     *
     * @return JsonResponse
     */
    public function getCompanyInfo(): JsonResponse
    {
        return response()->json([
            'company_name' => AppSetting::get('company_name', 'Getkenka'),
            'company_tax_code' => AppSetting::get('company_tax_code', '0318304909'),
            'company_email' => AppSetting::get('company_email', 'purchasevn@getkenka.com'),
            'company_phone' => AppSetting::get('company_phone', '+84 0941069969'),
            'company_address' => AppSetting::get('company_address', '2nd Floor, 81 CMT8 Street, Ben Thanh Ward, District 1, Ho Chi Minh City'),
        ]);
    }
}
