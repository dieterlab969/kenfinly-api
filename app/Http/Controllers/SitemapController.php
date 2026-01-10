<?php

namespace App\Http\Controllers;

use App\Services\WordPressService;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

use Illuminate\Http\JsonResponse;

class SitemapController extends Controller
{
    /**
     * @var WordPressService
     */
    private WordPressService $wordPressService;

    /**
     * @param WordPressService $wordPressService
     */
    public function __construct(WordPressService $wordPressService)
    {
        $this->wordPressService = $wordPressService;
    }

    /**
     * Generate the sitemap.xml
     *
     * @return JsonResponse
     */
    public function generate(): JsonResponse
    {
        $cacheKey = 'sitemap_posts_data';
        $postsData = \Illuminate\Support\Facades\Cache::get($cacheKey);

        if (!$postsData) {
            $sitemap = Sitemap::create();

            // Static Pages
            $staticPages = [
                '/' => ['priority' => 1.0, 'freq' => 'daily'],
                '/about' => ['priority' => 0.8, 'freq' => 'monthly'],
                '/contact' => ['priority' => 0.8, 'freq' => 'monthly'],
                '/pricing' => ['priority' => 0.8, 'freq' => 'monthly'],
                '/blog' => ['priority' => 0.9, 'freq' => 'daily'],
                '/login' => ['priority' => 0.6, 'freq' => 'monthly'],
                '/register' => ['priority' => 0.6, 'freq' => 'monthly'],
                '/textcase' => ['priority' => 0.7, 'freq' => 'weekly'],
            ];

            foreach ($staticPages as $path => $config) {
                $sitemap->add(
                    Url::create($path)
                        ->setLastModificationDate(Carbon::yesterday())
                        ->setChangeFrequency($config['freq'])
                        ->setPriority($config['priority'])
                );
            }

            // Dynamic Blog Posts
            $page = 1;
            $postsFetched = 0;
            $hasMore = true;

            try {
                while ($hasMore) {
                    $result = $this->wordPressService->getPosts([
                        'per_page' => 100,
                        'page' => $page,
                        'status' => 'publish',
                        '_fields' => 'slug,date_gmt,modified_gmt',
                    ], true); // Enable cache for WordPress service itself if possible

                    if (!$result['success']) {
                        Log::error("Sitemap: Failed to fetch posts page {$page}: " . ($result['error'] ?? 'Unknown error'));
                        break;
                    }

                    $posts = $result['data'];
                    if (empty($posts)) {
                        $hasMore = false;
                        continue;
                    }

                    foreach ($posts as $post) {
                        $slug = $post['slug'] ?? null;
                        if (!$slug) continue;

                        $lastModified = $post['modified_gmt'] ?? $post['date_gmt'] ?? null;
                        $lastModDate = $lastModified ? Carbon::parse($lastModified . ' UTC')->timezone('Asia/Ho_Chi_Minh') : Carbon::now('Asia/Ho_Chi_Minh');

                        $sitemap->add(
                            Url::create("/blog/{$slug}")
                                ->setLastModificationDate($lastModDate)
                                ->setChangeFrequency('weekly')
                                ->setPriority(0.9)
                        );
                    }

                    $postsFetched += count($posts);
                    
                    // Check if we have more pages based on WordPress headers
                    $totalPages = (int) ($result['headers']['total_pages'] ?? 1);
                    if ($page >= $totalPages) {
                        $hasMore = false;
                    } else {
                        $page++;
                    }
                }
            } catch (\Exception $e) {
                Log::error('Sitemap: Error generating dynamic routes: ' . $e->getMessage());
                return response()->json(['success' => false, 'message' => 'Error fetching blog content'], 500);
            }

            try {
                $sitemap->writeToFile(public_path('sitemap.xml'));
                \Illuminate\Support\Facades\Cache::put($cacheKey, ['posts_count' => $postsFetched, 'generated_at' => now()], 3600); // Cache for 1 hour
            } catch (\Exception $e) {
                Log::error('Sitemap: Failed to write file: ' . $e->getMessage());
                return response()->json(['success' => false, 'message' => 'Failed to save sitemap'], 500);
            }

            $postsData = ['posts_count' => $postsFetched, 'status' => 'generated'];
        } else {
            $postsData['status'] = 'cached';
        }

        return response()->json([
            'success' => true,
            'message' => "Sitemap processed successfully ({$postsData['status']}) with {$postsData['posts_count']} blog posts.",
            'path' => '/sitemap.xml'
        ]);
    }
}
