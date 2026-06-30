<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Language;
use App\Models\Translation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * User-facing category API.
 *
 * GET  /categories         — hierarchical tree of system + user's own categories
 * POST /categories         — create a user-owned category
 * PUT  /categories/{id}    — update (own, non-system only) — 403 otherwise
 * DELETE /categories/{id}  — delete (own, non-system only) — 403 otherwise
 *
 * @tags Categories
 */
class CategoryController extends Controller
{
    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * Return the hierarchical category tree.
     *
     * Includes:
     *  - All global system categories (user_id IS NULL)
     *  - The authenticated user's own custom categories
     *
     * Backward-compatible: existing callers that only use the GET endpoint are
     * unaffected. The optional ?type=expense|income filter still works.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = auth()->id();

        $locale   = $request->header('Accept-Language', 'en');
        $language = Language::where('code', $locale)->first()
            ?: Language::where('code', 'en')->first();

        $query = Category::query()
            ->whereNull('parent_id')
            ->where(function ($q) use ($userId) {
                $q->whereNull('user_id')->orWhere('user_id', $userId);
            })
            ->with(['children' => function ($q) use ($userId) {
                $q->where(function ($sq) use ($userId) {
                    $sq->whereNull('user_id')->orWhere('user_id', $userId);
                });
            }]);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $categories = $query->get()->map(fn ($cat) => $this->translateCategory($cat, $language));

        return response()->json([
            'success'    => true,
            'categories' => $categories,
        ]);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Create a user-owned category.
     *
     * Validation:
     *  - name: required, string ≤ 255
     *  - type: required, "expense" or "income"
     *  - icon: optional emoji string ≤ 50 chars
     *  - color: optional hex colour (#RGB, #RRGGBB, #RRGGBBAA)
     *  - parent_id: optional, must reference an existing category
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'type'      => 'required|in:expense,income',
            'icon'      => 'nullable|string|max:50',
            'color'     => ['nullable', 'string', 'max:20', 'regex:/^#[0-9A-Fa-f]{3,8}$/'],
            'parent_id' => 'nullable|integer|exists:categories,id',
        ]);

        $userId = auth()->id();

        $category = Category::create([
            'name'      => $validated['name'],
            'slug'      => $this->generateUniqueSlug($validated['name'], $userId),
            'type'      => $validated['type'],
            'icon'      => $validated['icon']  ?? '📁',
            'color'     => $validated['color'] ?? '#6B7280',
            'parent_id' => $validated['parent_id'] ?? null,
            'user_id'   => $userId,
            'is_system' => false,
        ]);

        return response()->json([
            'success'  => true,
            'message'  => 'Category created successfully.',
            'category' => $category,
        ], 201);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /**
     * Update a user-owned category.
     *
     * Returns 403 if:
     *  - The category is a system category (is_system = true)
     *  - The authenticated user does not own the category
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);

        $validated = $request->validate([
            'name'      => 'sometimes|required|string|max:255',
            'type'      => 'sometimes|required|in:expense,income',
            'icon'      => 'nullable|string|max:50',
            'color'     => ['nullable', 'string', 'max:20', 'regex:/^#[0-9A-Fa-f]{3,8}$/'],
            'parent_id' => 'nullable|integer|exists:categories,id',
        ]);

        $category->update($validated);

        return response()->json([
            'success'  => true,
            'message'  => 'Category updated successfully.',
            'category' => $category->fresh(),
        ]);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /**
     * Delete a user-owned category.
     *
     * Returns 403 if the user does not own the category or it is a system category.
     */
    public function destroy(Category $category): JsonResponse
    {
        $this->authorize('delete', $category);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.',
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Recursively translate a category and its children using the Translation table.
     */
    private function translateCategory(Category $category, ?Language $language): Category
    {
        if ($language) {
            $translation = Translation::where('language_id', $language->id)
                ->where('key', "categories.{$category->slug}")
                ->first();

            if ($translation) {
                $category->name = $translation->value;
            }
        }

        if ($category->relationLoaded('children')) {
            $category->setRelation(
                'children',
                $category->children->map(fn ($child) => $this->translateCategory($child, $language)),
            );
        }

        return $category;
    }

    /**
     * Generate a slug that is unique within the categories table.
     * For user categories we prefix with the user_id to minimise collisions with
     * system slugs while keeping the base name readable.
     */
    private function generateUniqueSlug(string $name, int $userId): string
    {
        $base    = Str::slug($name);
        $slug    = $base;
        $counter = 1;

        while (Category::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $userId . '-' . $counter++;
        }

        return $slug;
    }
}
