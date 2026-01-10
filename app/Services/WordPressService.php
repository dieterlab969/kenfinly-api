<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\Response;
use Exception;

/**
 * Class WordPressService
 */
class WordPressService
{
    /**
     * @var string
     */
    private string $baseUrl;
    /**
     * @var string|null
     */
    private ?string $username = null;
    /**
     * @var string|null
     */
    private ?string $password = null;
    /**
     * @var string|null
     */
    private ?string $applicationPassword = null;
    /**
     * @var int
     */
    private int $timeout;
    /**
     * @var int
     */
    private int $retries;
    /**
     * @var array
     */
    private array $defaultCacheTtl;

    /**
     *
     */
    public function __construct()
    {
        $this->initializeConfig();
    }

    /**
     * @return void
     */
    private function initializeConfig(): void
    {
        $this->baseUrl = rtrim(config('wordpress.api_url', env('WORDPRESS_API_URL', '')), '/');
        $this->username = config('wordpress.username', env('WORDPRESS_USERNAME'));
        $this->password = config('wordpress.password', env('WORDPRESS_PASSWORD'));
        $this->applicationPassword = config('wordpress.application_password', env('WORDPRESS_APPLICATION_PASSWORD'));
        $this->timeout = (int) config('wordpress.timeout', 60);
        $this->retries = (int) config('wordpress.retries', 3);

        $this->defaultCacheTtl = [
            'posts' => config('wordpress.cache.posts', 300),
            'pages' => config('wordpress.cache.pages', 600),
            'categories' => config('wordpress.cache.categories', 3600),
            'tags' => config('wordpress.cache.tags', 3600),
            'media' => config('wordpress.cache.media', 3600),
            'menus' => config('wordpress.cache.menus', 1800),
            'custom' => config('wordpress.cache.custom', 300),
        ];
    }

    /**
     * @return bool
     */
    public function isConfigured(): bool
    {
        return !empty($this->baseUrl);
    }

    /**
     * Laravel's HTTP client
     *
     * @return \Illuminate\Http\Client\PendingRequest
     */
    private function getHttpClient(): \Illuminate\Http\Client\PendingRequest
    {
        $client = Http::timeout($this->timeout)
            ->retry($this->retries, 100, function ($exception) {
                return $exception instanceof \Illuminate\Http\Client\ConnectionException;
            })
            ->withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->withOptions(['verify' => false]);

        if ($this->applicationPassword && $this->username) {
            $client->withBasicAuth($this->username, $this->applicationPassword);
        } elseif ($this->username && $this->password) {
            $client->withBasicAuth($this->username, $this->password);
        }

        return $client;
    }

    /**
     * @param string $endpoint
     * @return string
     */
    private function buildEndpoint(string $endpoint): string
    {
        return $this->baseUrl . '/wp-json/wp/v2/' . ltrim($endpoint, '/');
    }

    /**
     * @param string $namespace
     * @param string $endpoint
     * @return string
     */
    private function buildCustomEndpoint(string $namespace, string $endpoint): string
    {
        return $this->baseUrl . '/wp-json/' . trim($namespace, '/') . '/' . ltrim($endpoint, '/');
    }

    /**
     * @param Response $response
     * @param string $context
     * @return array
     */
    private function handleResponse(Response $response, string $context = ''): array
    {
        if ($response->successful()) {
            return [
                'success' => true,
                'data' => $response->json(),
                'headers' => [
                    'total' => $response->header('X-WP-Total'),
                    'total_pages' => $response->header('X-WP-TotalPages'),
                ],
            ];
        }

        $errorMessage = $this->parseErrorMessage($response);
        Log::error("WordPress API Error [{$context}]", [
            'status' => $response->status(),
            'error' => $errorMessage,
            'url' => $response->effectiveUri()?->__toString(),
        ]);

        return [
            'success' => false,
            'error' => $errorMessage,
            'status' => $response->status(),
        ];
    }

    /**
     * @param Response $response
     * @return string
     */
    private function parseErrorMessage(Response $response): string
    {
        $body = $response->json();

        if (isset($body['message'])) {
            return $body['message'];
        }

        if (isset($body['code'])) {
            return "WordPress Error: {$body['code']}";
        }

        return match ($response->status()) {
            401 => 'Authentication required or invalid credentials',
            403 => 'Access forbidden - insufficient permissions',
            404 => 'Content not found',
            429 => 'Rate limit exceeded - too many requests',
            500 => 'WordPress server error',
            502 => 'Bad gateway - WordPress server unavailable',
            503 => 'WordPress service temporarily unavailable',
            default => "HTTP Error: {$response->status()}",
        };
    }

    /**
     * @param string $type
     * @param string $identifier
     * @param array $params
     * @return string
     */
    private function getCacheKey(string $type, string $identifier, array $params = []): string
    {
        $paramsHash = md5(json_encode($params));
        return "wordpress:{$type}:{$identifier}:{$paramsHash}";
    }

    /**
     * @param string $type
     * @return int
     */
    private function getCacheTtl(string $type): int
    {
        return $this->defaultCacheTtl[$type] ?? $this->defaultCacheTtl['custom'];
    }

    /**
     * @param array $params
     * @param bool $useCache
     * @return array
     */
    public function getPosts(array $params = [], bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('posts', 'list', $params);

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $defaultParams = [
                'per_page' => 10,
                'page' => 1,
                '_embed' => true,
            ];
            $queryParams = array_merge($defaultParams, $params);

            $response = $this->getHttpClient()->get(
                $this->buildEndpoint('posts'),
                $queryParams
            );

            $result = $this->handleResponse($response, 'getPosts');

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('posts'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, 'getPosts');
        }
    }

    /**
     * @param int $id
     * @param bool $useCache
     * @return array
     */
    public function getPost(int $id, bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('posts', (string) $id);

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->buildEndpoint("posts/{$id}"),
                ['_embed' => true]
            );

            $result = $this->handleResponse($response, "getPost:{$id}");

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('posts'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, "getPost:{$id}");
        }
    }

    /**
     * @param string $slug
     * @param bool $useCache
     * @return array
     */
    public function getPostBySlug(string $slug, bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('posts', "slug:{$slug}");

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->buildEndpoint('posts'),
                ['slug' => $slug, '_embed' => true]
            );

            $result = $this->handleResponse($response, "getPostBySlug:{$slug}");

            if ($result['success']) {
                $data = $result['data'];
                if (empty($data)) {
                    return [
                        'success' => false,
                        'error' => 'Post not found',
                        'status' => 404,
                    ];
                }
                $result['data'] = $data[0];

                if ($useCache) {
                    Cache::put($cacheKey, $result, $this->getCacheTtl('posts'));
                }
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, "getPostBySlug:{$slug}");
        }
    }

    /**
     * @param array $params
     * @param bool $useCache
     * @return array
     */
    public function getPages(array $params = [], bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('pages', 'list', $params);

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $defaultParams = [
                'per_page' => 20,
                'page' => 1,
                '_embed' => true,
            ];
            $queryParams = array_merge($defaultParams, $params);

            $response = $this->getHttpClient()->get(
                $this->buildEndpoint('pages'),
                $queryParams
            );

            $result = $this->handleResponse($response, 'getPages');

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('pages'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, 'getPages');
        }
    }

    /**
     * @param int $id
     * @param bool $useCache
     * @return array
     */
    public function getPage(int $id, bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('pages', (string) $id);

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->buildEndpoint("pages/{$id}"),
                ['_embed' => true]
            );

            $result = $this->handleResponse($response, "getPage:{$id}");

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('pages'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, "getPage:{$id}");
        }
    }

    /**
     * @param string $slug
     * @param bool $useCache
     * @return array
     */
    public function getPageBySlug(string $slug, bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('pages', "slug:{$slug}");

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->buildEndpoint('pages'),
                ['slug' => $slug, '_embed' => true]
            );

            $result = $this->handleResponse($response, "getPageBySlug:{$slug}");

            if ($result['success']) {
                $data = $result['data'];
                if (empty($data)) {
                    return [
                        'success' => false,
                        'error' => 'Page not found',
                        'status' => 404,
                    ];
                }
                $result['data'] = $data[0];

                if ($useCache) {
                    Cache::put($cacheKey, $result, $this->getCacheTtl('pages'));
                }
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, "getPageBySlug:{$slug}");
        }
    }

    /**
     * @param array $params
     * @param bool $useCache
     * @return array
     */
    public function getCategories(array $params = [], bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('categories', 'list', $params);

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $defaultParams = [
                'per_page' => 100,
                'hide_empty' => true,
            ];
            $queryParams = array_merge($defaultParams, $params);

            $response = $this->getHttpClient()->get(
                $this->buildEndpoint('categories'),
                $queryParams
            );

            $result = $this->handleResponse($response, 'getCategories');

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('categories'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, 'getCategories');
        }
    }

    /**
     * @param array $params
     * @param bool $useCache
     * @return array
     */
    public function getTags(array $params = [], bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('tags', 'list', $params);

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $defaultParams = [
                'per_page' => 100,
                'hide_empty' => true,
            ];
            $queryParams = array_merge($defaultParams, $params);

            $response = $this->getHttpClient()->get(
                $this->buildEndpoint('tags'),
                $queryParams
            );

            $result = $this->handleResponse($response, 'getTags');

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('tags'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, 'getTags');
        }
    }

    /**
     * @param int $id
     * @param bool $useCache
     * @return array
     */
    public function getMedia(int $id, bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('media', (string) $id);

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->buildEndpoint("media/{$id}")
            );

            $result = $this->handleResponse($response, "getMedia:{$id}");

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('media'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, "getMedia:{$id}");
        }
    }

    /**
     * @param string $postType
     * @param array $params
     * @param bool $useCache
     * @return array
     */
    public function getCustomPostType(string $postType, array $params = [], bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('custom', "{$postType}:list", $params);

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $defaultParams = [
                'per_page' => 10,
                'page' => 1,
                '_embed' => true,
            ];
            $queryParams = array_merge($defaultParams, $params);

            $response = $this->getHttpClient()->get(
                $this->buildCustomEndpoint('headless/v1/content/', $postType),
                $queryParams
            );

            $result = $this->handleResponse($response, "getCustomPostType:{$postType}");

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('custom'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, "getCustomPostType:{$postType}");
        }
    }

    /**
     * @param string $postType
     * @param int $id
     * @param bool $useCache
     * @return array
     */
    public function getCustomPostTypeItem(string $postType, int $id, bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('custom', "{$postType}:{$id}");

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->buildEndpoint("{$postType}/{$id}"),
                ['_embed' => true]
            );

            $result = $this->handleResponse($response, "getCustomPostTypeItem:{$postType}:{$id}");

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('custom'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, "getCustomPostTypeItem:{$postType}:{$id}");
        }
    }

    /**
     * @param string $postType
     * @param string $slug
     * @param bool $useCache
     * @return array
     */
    public function getCustomPostTypeBySlug(string $postType, string $slug, bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('custom', "{$postType}:slug:{$slug}");

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->buildEndpoint($postType),
                ['slug' => $slug, '_embed' => true]
            );

            $result = $this->handleResponse($response, "getCustomPostTypeBySlug:{$postType}:{$slug}");

            if ($result['success']) {
                $data = $result['data'];
                if (empty($data)) {
                    return [
                        'success' => false,
                        'error' => ucfirst($postType) . ' not found',
                        'status' => 404,
                    ];
                }
                $result['data'] = $data[0];

                if ($useCache) {
                    Cache::put($cacheKey, $result, $this->getCacheTtl('custom'));
                }
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, "getCustomPostTypeBySlug:{$postType}:{$slug}");
        }
    }

    /**
     * @param string $query
     * @param array $params
     * @return array
     */
    public function searchContent(string $query, array $params = []): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        try {
            $defaultParams = [
                'search' => $query,
                'per_page' => 10,
                'page' => 1,
                '_embed' => true,
            ];
            $queryParams = array_merge($defaultParams, $params);

            $response = $this->getHttpClient()->get(
                $this->buildEndpoint('posts'),
                $queryParams
            );

            return $this->handleResponse($response, "searchContent:{$query}");

        } catch (Exception $e) {
            return $this->handleException($e, "searchContent:{$query}");
        }
    }

    /**
     * @param bool $useCache
     * @return array
     */
    public function getMenus(bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('menus', 'all');

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->buildCustomEndpoint('menus/v1', 'menus')
            );

            $result = $this->handleResponse($response, 'getMenus');

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('menus'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, 'getMenus');
        }
    }

    /**
     * @param string $location
     * @param bool $useCache
     * @return array
     */
    public function getMenu(string $location, bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('menus', $location);

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->buildCustomEndpoint('menus/v1', "locations/{$location}")
            );

            $result = $this->handleResponse($response, "getMenu:{$location}");

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, $this->getCacheTtl('menus'));
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, "getMenu:{$location}");
        }
    }

    /**
     * @param bool $useCache
     * @return array
     */
    public function getSiteInfo(bool $useCache = true): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        $cacheKey = $this->getCacheKey('site', 'info');

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $response = $this->getHttpClient()->get(
                $this->baseUrl . '/wp-json'
            );

            $result = $this->handleResponse($response, 'getSiteInfo');

            if ($result['success'] && $useCache) {
                Cache::put($cacheKey, $result, 3600);
            }

            return $result;

        } catch (Exception $e) {
            return $this->handleException($e, 'getSiteInfo');
        }
    }

    /**
     * @param string|null $type
     * @return void
     */
    public function clearCache(string $type = null): void
    {
        if ($type) {
            $pattern = "wordpress:{$type}:*";
            $this->clearCacheByPattern($pattern);
        } else {
            $this->clearCacheByPattern('wordpress:*');
        }

        Log::info('WordPress cache cleared', ['type' => $type ?? 'all']);
    }

    /**
     * @param string $pattern
     * @return void
     */
    private function clearCacheByPattern(string $pattern): void
    {
        $cacheStore = Cache::getStore();

        if (method_exists($cacheStore, 'flush')) {
            Cache::tags(['wordpress'])->flush();
        }

        Cache::forget($pattern);
    }

    /**
     * @return array
     */
    private function notConfiguredResponse(): array
    {
        return [
            'success' => false,
            'error' => 'WordPress API is not configured. Please set WORDPRESS_API_URL in your environment.',
            'status' => 503,
        ];
    }

    /**
     * @param Exception $e
     * @param string $context
     * @return array
     */
    private function handleException(Exception $e, string $context): array
    {
        Log::error("WordPress API Exception [{$context}]", [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return [
            'success' => false,
            'error' => 'Failed to connect to WordPress: ' . $e->getMessage(),
            'status' => 500,
        ];
    }

    /**
     * @return array
     */
    public function testConnection(): array
    {
        if (!$this->isConfigured()) {
            return $this->notConfiguredResponse();
        }

        try {
            $response = $this->getHttpClient()->get($this->baseUrl . '/wp-json');

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'message' => 'Successfully connected to WordPress',
                    'site_name' => $data['name'] ?? 'Unknown',
                    'site_url' => $data['url'] ?? $this->baseUrl,
                    'wordpress_version' => $data['namespaces'] ?? [],
                ];
            }

            return [
                'success' => false,
                'error' => 'Failed to connect to WordPress API',
                'status' => $response->status(),
            ];

        } catch (Exception $e) {
            return $this->handleException($e, 'testConnection');
        }
    }
}
