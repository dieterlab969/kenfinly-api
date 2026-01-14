<?php

return [
    'api_url' => env('WORDPRESS_API_URL', ''),
    
    'username' => env('WORDPRESS_USERNAME'),
    'password' => env('WORDPRESS_PASSWORD'),
    'application_password' => env('WORDPRESS_APPLICATION_PASSWORD'),
    
    'timeout' => env('WORDPRESS_TIMEOUT', 30),
    'retries' => env('WORDPRESS_RETRIES', 3),
    
    'cache' => [
        'enabled' => env('WORDPRESS_CACHE_ENABLED', true),
        'posts' => env('WORDPRESS_CACHE_POSTS', 300),
        'pages' => env('WORDPRESS_CACHE_PAGES', 600),
        'categories' => env('WORDPRESS_CACHE_CATEGORIES', 3600),
        'tags' => env('WORDPRESS_CACHE_TAGS', 3600),
        'media' => env('WORDPRESS_CACHE_MEDIA', 3600),
        'menus' => env('WORDPRESS_CACHE_MENUS', 1800),
        'custom' => env('WORDPRESS_CACHE_CUSTOM', 300),
    ],
    
    'custom_post_types' => array_filter(explode(',', env('WORDPRESS_CUSTOM_POST_TYPES', '')), fn($v) => $v !== ''),

    'traffic_stats' => [
        'enabled' => env('TRAFFIC_STATS_ENABLED', false),
    ],
];
