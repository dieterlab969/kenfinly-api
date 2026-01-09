<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WordPressService;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class GenerateSitemap extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:generate-sitemap';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate the sitemap.xml file including WordPress posts';

    /**
     * @var WordPressService
     */
    private WordPressService $wordPressService;

    /**
     * Create a new command instance.
     *
     * @param WordPressService $wordPressService
     */
    public function __construct(WordPressService $wordPressService)
    {
        parent::__construct();
        $this->wordPressService = $wordPressService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting sitemap generation...');
        $sitemap = Sitemap::create();

        // Static Pages
        $staticPages = [
            '/' => ['priority' => 1.0, 'freq' => 'daily'],
            '/about' => ['priority' => 0.8, 'freq' => 'monthly'],
            '/contact' => ['priority' => 0.8, 'freq' => 'monthly'],
            '/pricing' => ['priority' => 0.8, 'freq' => 'monthly'],
            '/blog' => ['priority' => 0.9, 'freq' => 'daily'],
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
                ], false);

                if (!$result['success']) {
                    $this->error("Failed to fetch posts page {$page}: " . ($result['error'] ?? 'Unknown error'));
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
                $totalPages = (int) ($result['headers']['total_pages'] ?? 1);
                
                if ($page >= $totalPages) {
                    $hasMore = false;
                } else {
                    $page++;
                }
            }
        } catch (\Exception $e) {
            $this->error('Error generating dynamic routes: ' . $e->getMessage());
            return 1;
        }

        try {
            $sitemap->writeToFile(public_path('sitemap.xml'));
            $this->info("Sitemap generated successfully with {$postsFetched} blog posts.");
        } catch (\Exception $e) {
            $this->error('Failed to write sitemap file: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
