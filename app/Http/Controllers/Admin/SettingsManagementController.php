<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;

class SettingsManagementController extends Controller
{
    public function index()
    {
        $settings = AppSetting::orderBy('key')->get();

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    public function update(Request $request, string $id)
    {
        $setting = AppSetting::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'value' => 'required',
            'type' => 'sometimes|in:string,boolean,integer,float,json',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $type = $request->get('type', $setting->type);
        AppSetting::set($setting->key, $request->value, $type);

        Artisan::call('config:clear');

        return response()->json([
            'success' => true,
            'message' => 'Setting updated successfully and config cache cleared',
            'data' => AppSetting::find($id)
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'key' => 'required|string|unique:app_settings,key',
            'value' => 'required',
            'type' => 'required|in:string,boolean,integer,float,json',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $setting = AppSetting::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Setting created successfully',
            'data' => $setting
        ], 201);
    }

    public function destroy(string $id)
    {
        $setting = AppSetting::findOrFail($id);
        $setting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Setting deleted successfully'
        ]);
    }
}
