<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class LogoController extends Controller
{
    /**
     * Get the current site logo URL.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLogo()
    {
        try {
            $logoPath = AppSetting::get('site_logo');
            $logoUrl = $logoPath ? Storage::url($logoPath) : null;

            return response()->json([
                'success' => true,
                'logo_url' => $logoUrl
            ], 200);
        } catch (Exception $e) {
            Log::error('Error fetching logo: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve logo',
                'logo_url' => null
            ], 200);
        }
    }

    /**
     * Upload a new site logo.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadLogo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$request->hasFile('logo')) {
            return response()->json([
                'success' => false, 
                'message' => 'No file uploaded'
            ], 400);
        }

        try {
            $oldLogoPath = AppSetting::get('site_logo');
            if ($oldLogoPath && Storage::disk('public')->exists($oldLogoPath)) {
                Storage::disk('public')->delete($oldLogoPath);
            }

            $path = $request->file('logo')->store('logos', 'public');
            
            AppSetting::set('site_logo', $path);

            Log::info('Logo uploaded successfully by user ID: ' . (auth()->id() ?? 'system') . '. Path: ' . $path);

            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'logo_url' => Storage::url($path)
            ], 200);

        } catch (Exception $e) {
            Log::error('Logo upload failed: ' . $e->getMessage(), [
                'user_id' => auth()->id() ?? 'system',
                'exception' => $e
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during the logo upload process'
            ], 500);
        }
    }
}
