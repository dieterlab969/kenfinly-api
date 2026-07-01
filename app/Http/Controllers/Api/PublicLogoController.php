<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;

class PublicLogoController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'logo_1x' => AppSetting::get('logo_1x', ''),
                'logo_2x' => AppSetting::get('logo_2x', ''),
                'logo_4x' => AppSetting::get('logo_4x', ''),
            ]
        ]);
    }
}
