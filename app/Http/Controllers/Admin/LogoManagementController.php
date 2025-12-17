<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class LogoManagementController extends Controller
{
    private $allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    private $maxFileSize = 5 * 1024 * 1024;

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

    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'logo' => 'required|file|max:5120',
            'version' => 'required|in:1x,2x,4x',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('logo');
        $version = $request->input('version');

        if (!in_array($file->getMimeType(), $this->allowedMimes)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid file type. Allowed: PNG, JPG, SVG, WebP'
            ], 422);
        }

        if ($file->getSize() > $this->maxFileSize) {
            return response()->json([
                'success' => false,
                'message' => 'File size exceeds 5MB limit'
            ], 422);
        }

        $oldLogo = AppSetting::get("logo_{$version}", '');
        if ($oldLogo && file_exists(public_path($oldLogo))) {
            @unlink(public_path($oldLogo));
        }

        $logoDir = public_path('logos');
        if (!is_dir($logoDir)) {
            mkdir($logoDir, 0755, true);
        }

        $extension = $file->getClientOriginalExtension();
        $filename = "logo-{$version}-" . Str::random(8) . ".{$extension}";
        $file->move($logoDir, $filename);

        $logoPath = "logos/{$filename}";
        AppSetting::set("logo_{$version}", $logoPath, 'string');

        return response()->json([
            'success' => true,
            'message' => "Logo ({$version}) uploaded successfully",
            'data' => [
                'path' => $logoPath,
                'url' => asset($logoPath)
            ]
        ]);
    }

    public function delete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'version' => 'required|in:1x,2x,4x',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $version = $request->input('version');
        $currentLogo = AppSetting::get("logo_{$version}", '');

        if ($currentLogo && file_exists(public_path($currentLogo))) {
            @unlink(public_path($currentLogo));
        }

        AppSetting::set("logo_{$version}", '', 'string');

        return response()->json([
            'success' => true,
            'message' => "Logo ({$version}) deleted successfully"
        ]);
    }
}
