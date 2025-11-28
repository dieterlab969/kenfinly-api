<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WordPressService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WordPressController extends Controller
{
    private WordPressService $wordPressService;

    public function __construct(WordPressService $wordPressService)
    {
        $this->wordPressService = $wordPressService;
    }

    public function posts(Request $request): JsonResponse
    {
        $params = $this->buildQueryParams($request, [
            'per_page' => 10,
            'page' => 1,
            'categories' => null,
            'tags' => null,
            'author' => null,
            'orderby' => 'date',
            'order' => 'desc',
            'search' => null,
            'status' => 'publish',
        ]);

        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getPosts($params, $useCache);

        return $this->formatResponse($result, 'posts');
    }

    public function post(int $id, Request $request): JsonResponse
    {
        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getPost($id, $useCache);

        return $this->formatResponse($result, 'post');
    }

    public function postBySlug(string $slug, Request $request): JsonResponse
    {
        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getPostBySlug($slug, $useCache);

        return $this->formatResponse($result, 'post');
    }

    public function pages(Request $request): JsonResponse
    {
        $params = $this->buildQueryParams($request, [
            'per_page' => 20,
            'page' => 1,
            'parent' => null,
            'orderby' => 'menu_order',
            'order' => 'asc',
            'status' => 'publish',
        ]);

        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getPages($params, $useCache);

        return $this->formatResponse($result, 'pages');
    }

    public function page(int $id, Request $request): JsonResponse
    {
        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getPage($id, $useCache);

        return $this->formatResponse($result, 'page');
    }

    public function pageBySlug(string $slug, Request $request): JsonResponse
    {
        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getPageBySlug($slug, $useCache);

        return $this->formatResponse($result, 'page');
    }

    public function categories(Request $request): JsonResponse
    {
        $params = $this->buildQueryParams($request, [
            'per_page' => 100,
            'hide_empty' => true,
            'parent' => null,
            'orderby' => 'name',
            'order' => 'asc',
        ]);

        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getCategories($params, $useCache);

        return $this->formatResponse($result, 'categories');
    }

    public function tags(Request $request): JsonResponse
    {
        $params = $this->buildQueryParams($request, [
            'per_page' => 100,
            'hide_empty' => true,
            'orderby' => 'count',
            'order' => 'desc',
        ]);

        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getTags($params, $useCache);

        return $this->formatResponse($result, 'tags');
    }

    public function media(int $id, Request $request): JsonResponse
    {
        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getMedia($id, $useCache);

        return $this->formatResponse($result, 'media');
    }

    public function customPostType(string $postType, Request $request): JsonResponse
    {
        $allowedPostTypes = config('wordpress.custom_post_types', []);
        
        if (!empty($allowedPostTypes) && !in_array($postType, $allowedPostTypes)) {
            return response()->json([
                'success' => false,
                'error' => 'Custom post type not allowed',
            ], 403);
        }

        $params = $this->buildQueryParams($request, [
            'per_page' => 10,
            'page' => 1,
            'orderby' => 'date',
            'order' => 'desc',
            'status' => 'publish',
        ]);

        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getCustomPostType($postType, $params, $useCache);

        return $this->formatResponse($result, $postType);
    }

    public function customPostTypeItem(string $postType, int $id, Request $request): JsonResponse
    {
        $allowedPostTypes = config('wordpress.custom_post_types', []);
        
        if (!empty($allowedPostTypes) && !in_array($postType, $allowedPostTypes)) {
            return response()->json([
                'success' => false,
                'error' => 'Custom post type not allowed',
            ], 403);
        }

        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getCustomPostTypeItem($postType, $id, $useCache);

        return $this->formatResponse($result, $postType);
    }

    public function customPostTypeBySlug(string $postType, string $slug, Request $request): JsonResponse
    {
        $allowedPostTypes = config('wordpress.custom_post_types', []);
        
        if (!empty($allowedPostTypes) && !in_array($postType, $allowedPostTypes)) {
            return response()->json([
                'success' => false,
                'error' => 'Custom post type not allowed',
            ], 403);
        }

        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getCustomPostTypeBySlug($postType, $slug, $useCache);

        return $this->formatResponse($result, $postType);
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $query = $request->input('q');
        $params = $this->buildQueryParams($request, [
            'per_page' => 10,
            'page' => 1,
        ]);

        $result = $this->wordPressService->searchContent($query, $params);

        return $this->formatResponse($result, 'search_results');
    }

    public function menus(Request $request): JsonResponse
    {
        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getMenus($useCache);

        return $this->formatResponse($result, 'menus');
    }

    public function menu(string $location, Request $request): JsonResponse
    {
        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getMenu($location, $useCache);

        return $this->formatResponse($result, 'menu');
    }

    public function siteInfo(Request $request): JsonResponse
    {
        $useCache = $request->boolean('cache', true);
        $result = $this->wordPressService->getSiteInfo($useCache);

        return $this->formatResponse($result, 'site_info');
    }

    public function clearCache(Request $request): JsonResponse
    {
        $type = $request->input('type');
        
        $this->wordPressService->clearCache($type);

        return response()->json([
            'success' => true,
            'message' => $type 
                ? "WordPress {$type} cache cleared successfully"
                : 'WordPress cache cleared successfully',
        ]);
    }

    public function testConnection(): JsonResponse
    {
        $result = $this->wordPressService->testConnection();

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => [
                    'site_name' => $result['site_name'],
                    'site_url' => $result['site_url'],
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => $result['error'],
        ], $result['status'] ?? 500);
    }

    public function status(): JsonResponse
    {
        $isConfigured = $this->wordPressService->isConfigured();
        
        if (!$isConfigured) {
            return response()->json([
                'success' => true,
                'configured' => false,
                'message' => 'WordPress API is not configured',
            ]);
        }

        $connectionTest = $this->wordPressService->testConnection();

        return response()->json([
            'success' => true,
            'configured' => true,
            'connected' => $connectionTest['success'],
            'message' => $connectionTest['success'] 
                ? 'WordPress API is configured and connected'
                : 'WordPress API is configured but connection failed',
            'details' => $connectionTest['success'] ? [
                'site_name' => $connectionTest['site_name'] ?? null,
                'site_url' => $connectionTest['site_url'] ?? null,
            ] : null,
        ]);
    }

    private function buildQueryParams(Request $request, array $defaults): array
    {
        $params = [];
        
        foreach ($defaults as $key => $default) {
            $value = $request->input($key, $default);
            if ($value !== null) {
                $params[$key] = $value;
            }
        }

        return $params;
    }

    private function formatResponse(array $result, string $dataKey): JsonResponse
    {
        if ($result['success']) {
            $response = [
                'success' => true,
                $dataKey => $result['data'],
            ];

            if (isset($result['headers']['total'])) {
                $response['pagination'] = [
                    'total' => (int) $result['headers']['total'],
                    'total_pages' => (int) $result['headers']['total_pages'],
                ];
            }

            return response()->json($response);
        }

        return response()->json([
            'success' => false,
            'error' => $result['error'],
        ], $result['status'] ?? 500);
    }
}
