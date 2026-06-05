<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;

class PublicLogoController extends Controller
{
    public function index()
    {
        $logo1x = $this->publicLogoPath(AppSetting::get('logo_1x', ''));
        $logo2x = $this->publicLogoPath(AppSetting::get('logo_2x', ''));
        $logo4x = $this->publicLogoPath(AppSetting::get('logo_4x', ''));

        return response()->json([
            'success' => true,
            'data' => [
                'logo_1x' => $logo1x ?: 'logos/logo-1x-default.jpg',
                'logo_2x' => $logo2x,
                'logo_4x' => $logo4x,
            ]
        ]);
    }

    private function publicLogoPath(?string $path): string
    {
        if (!$path || !file_exists(public_path($path))) {
            return '';
        }

        return $path;
    }
}
