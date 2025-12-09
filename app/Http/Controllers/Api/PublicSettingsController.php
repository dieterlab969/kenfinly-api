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
            'company_name' => AppSetting::get('company_name', config('company.name')),
            'company_tax_code' => AppSetting::get('company_tax_code', config('company.phone')),
            'company_email' => AppSetting::get('company_email', config('company.email')),
            'company_phone' => AppSetting::get('company_phone', config('company.phone')),
            'company_address' => AppSetting::get('company_address', config('company.address')),
        ]);
    }
}
