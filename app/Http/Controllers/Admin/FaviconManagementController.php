<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AppSetting;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

/**
 * Controller to manage the favicon upload and retrieval.
 *
 * Handles displaying the current favicon URL and updating the favicon image
 * with validation and resizing to ensure proper format and size.
 */
class FaviconManagementController extends Controller
{
    /**
     * Retrieve the current favicon URL.
     *
     * Fetches the favicon path from the database and returns a full URL
     * for frontend use.
     *
     * @return \Illuminate\Http\JsonResponse JSON response containing the favicon URL or null.
     */
    public function show()
    {
        $faviconPath = AppSetting::where('key', 'favicon')->value('value');

        // Return full URL for frontend convenience
        $faviconUrl = $faviconPath ? Storage::disk('public')->url($faviconPath) : null;

        return response()->json(['favicon' => $faviconUrl], 200);
    }

    /**
     * Handle the favicon image upload and update.
     *
     * Validates the uploaded image, ensures it is square and at least 8x8 pixels,
     * resizes it to 32x32 pixels, deletes the old favicon if present,
     * stores the new image, and updates the database setting.
     *
     * @param \Illuminate\Http\Request $request The HTTP request containing the image file.
     * @return \Illuminate\Http\JsonResponse JSON response indicating success or failure with messages.
     */
    public function update(Request $request)
    {
        $request->validate([
            'favicon' =>  'required|image|mimes:jpeg,png,jpg,gif,ico|max:2048',
        ]);

        if (!$request->hasFile('favicon')) {
            return response()->json(['message' => 'No favicon image provided'], 422);
        }

        $imageFile = $request->file('favicon');

        // Validate and process the image
        $validationResult = $this->validateAndProcessImage($imageFile);
        if (isset($validationResult['error'])) {
            return response()->json(['message' => $validationResult['error']], 422);
        }

        $processedImage = $validationResult['image'];

        // Delete old favicon if exists
        $oldFavicon = AppSetting::where('key', 'favicon')->value('value');
        if ($oldFavicon) {
            Storage::disk('public')->delete($oldFavicon);
        }

        // Store the processed image
        $filename = 'favicons/favicon_' . time() . '.' . $imageFile->getClientOriginalExtension();
        Storage::disk('public')->put($filename, (string) $processedImage->encode());

        // Update database setting
        AppSetting::updateOrCreate(
            ['key' => 'favicon'],
            ['value' => $filename]
        );

        $faviconUrl = Storage::disk('public')->url($filename);

        return response()->json([
            'success' => true,
            'message' => 'Favicon updated successfully',
            'favicon' => $faviconUrl,
        ], 200);
    }

    /**
     * Validate image dimensions and resize to 32x32 pixels.
     *
     * Checks that the image is square and meets minimum size requirements.
     * Resizes the image to 32x32 pixels for consistency and optimization.
     *
     * @param \Illuminate\Http\UploadedFile $image The uploaded image file.
     * @return array An array containing either 'image' with the processed Intervention Image instance or 'error' with a message.
     */
    private function validateAndProcessImage($image)
    {
        $img = Image::read($image);
        $width = $img->width();
        $height = $img->height();

        if ($width !== $height) {
            return ['error' => 'The favicon must have a 1:1 aspect ratio (square image).'];
        }

        if ($width < 8 || $height < 8) {
            return ['error' => 'The favicon must be at least 8×8 pixels.'];
        }

        // Resize to 32x32 for consistency and optimization
        $img->resize(32, 32);

        return ['image' => $img];
    }
}
