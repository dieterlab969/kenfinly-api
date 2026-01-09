<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;
use Carbon\Carbon;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class SitemapController extends Controller
{
    public function generate() {
        $sitemap = Sitemap::create();

        $sitemap->add(Url::create('/')
                      ->setLastModificationDate(Carbon::yesterday())
                      ->setChangeFrequency('daily')
                      ->setPriority(1.0));
        $sitemap->add(Url::create('/about')
                       ->setLastModificationDate(Carbon::yesterday())
                       ->setChangeFrequency('monthly')
                       ->setPriority(0.8));
        $sitemap->add(Url::create('/contact')
                       ->setLastModificationDate(Carbon::yesterday())
                       ->setChangeFrequency('monthly')
                        ->setPriority(0.8));

        $client = new Client();
         $wpApiBase = config('services.wordpress.api_base_url', env('WORDPRESS_API_BASE_URL', null));
         if (!$wpApiBase) {
              Log::error('WORDPRESS_API_BASE_URL not configured');
              return response()->json(['success' => false, 'message' => 'WordPress API base URL not configured'], 500);
         }

        $perPage = 100; 
        $page = 1;
        $postsFetched = 0;
          try {
              do {
                    $response = $client->request('GET', $wpApiBase . '/wp/v2/posts', [
                                                  'query' => [
                                                   'per_page' => $perPage,
                                                  'page' => $page,
                                                   'status' => 'publish', // Only published posts
                                                  '_fields' => 'slug,date_gmt,modified_gmt',
                                                    ],
                                                  'http_errors' => false,
                                                  ]);
                    if ($response->getStatusCode() !== 200) {
                         Log::error("Failed to fetch posts from WordPress API. Status code: " . $response->getStatusCode());
                         break;
                    }

                    $posts = json_decode($response->getBody(), true);
                   foreach ($posts as $post) {
                        $slug = $post['slug'] ?? null;
                        $lastModified = $post['modified_gmt'] ?? $post['date_gmt'] ?? null;

                       if (!$slug) {
                            continue;
                       }
                        $postUrl = url("/blog/{$slug}");
                        $lastModDate = $lastModified ? Carbon::parse($lastModified . 'UTC') : Carbon::now();
                        $sitemap->add(Url::create($postUrl)
                                       ->setLastModificationDate($lastModDate)
                                      ->setChangeFrequency('weekly')
                                        ->setPriority(0.9));
                   }
                    $postsCount = count($posts);
                  $postsFetched += $postsCount;
                   $page++;
              } while ($postsCount === $perPage); 
          } catch (\Exception $e) {
                  Log::error('Error fetching WordPress posts for sitemap: ' . $e->getMessage());
                  return response()->json(['success' => false, 'message' => 'Error fetching WordPress posts'], 500);
              }
        
         
        $sitemap->writeToFile(public_path('sitemap.xml'));
        return response()->json([
            'success' => true,
            'message' => "Sitemap generated successfully with {$postsFetched} blog posts.",
        ]);
    }
}
