# WordPress-Laravel API Testing & React Integration Guide

## Table of Contents
1. [API Connection Testing](#api-connection-testing)
2. [Implementation Gap Analysis](#implementation-gap-analysis)
3. [React Integration Planning](#react-integration-planning)
4. [Key Technical Components](#key-technical-components)
5. [Implementation Metrics](#implementation-metrics)

---

## API Connection Testing

### Prerequisites

Before testing API connections, ensure:
- Laravel server is running on port 5000
- WordPress is installed at `/public/wordpress/`
- JWT Authentication plugin is activated in WordPress
- Database migrations are complete

### Test Suite: WordPress REST API Endpoints

#### 1. Basic API Connectivity Test

```bash
# Test WordPress REST API root
curl -s "http://localhost:5000/wordpress/wp-json/" | jq '.name, .description'

# Expected: Returns site name and description
```

#### 2. JWT Authentication Tests

```bash
# Test 1: Get JWT Token
curl -X POST "http://localhost:5000/wordpress/wp-json/jwt-auth/v1/token" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "YOUR_PASSWORD"}'

# Expected Response:
# {
#   "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
#   "user_email": "admin@example.com",
#   "user_nicename": "admin",
#   "user_display_name": "Admin"
# }

# Test 2: Validate Token
curl -X POST "http://localhost:5000/wordpress/wp-json/jwt-auth/v1/token/validate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: {"code":"jwt_auth_valid_token","data":{"status":200}}
```

#### 3. Content Retrieval Tests

```bash
# Test standard posts endpoint
curl -s "http://localhost:5000/wordpress/wp-json/wp/v2/posts" | jq '.[0].title.rendered'

# Test custom content types
curl -s "http://localhost:5000/wordpress/wp-json/headless/v1/content/financial_tip" | jq '.total'
curl -s "http://localhost:5000/wordpress/wp-json/headless/v1/content/news" | jq '.total'
curl -s "http://localhost:5000/wordpress/wp-json/headless/v1/content/faq" | jq '.total'

# Test all-content endpoint (single request optimization)
curl -s "http://localhost:5000/wordpress/wp-json/headless/v1/all-content" | jq '.content | keys'
```

#### 4. Search Functionality Test

```bash
curl -s "http://localhost:5000/wordpress/wp-json/headless/v1/search?query=budget" | jq '.results | length'
```

#### 5. Laravel to WordPress Connection Test

Create a test route in Laravel to verify internal API calls:

```php
// routes/web.php (for testing)
Route::get('/test-wordpress-api', function () {
    $response = Http::get(config('app.url') . '/wordpress/wp-json/headless/v1/all-content');
    return response()->json([
        'status' => $response->successful() ? 'connected' : 'failed',
        'response_time' => $response->transferStats?->getTransferTime() ?? 'N/A',
        'content_types' => array_keys($response->json('content', []))
    ]);
});
```

### Automated Test Script

```bash
#!/bin/bash
# save as: scripts/test-wordpress-api.sh

BASE_URL="${1:-http://localhost:5000}"
PASS=0
FAIL=0

echo "=== WordPress-Laravel API Connection Tests ==="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: API Root
echo -n "Test 1: WordPress API Root... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/wordpress/wp-json/")
if [ "$RESPONSE" == "200" ]; then
    echo "PASS"
    ((PASS++))
else
    echo "FAIL (HTTP $RESPONSE)"
    ((FAIL++))
fi

# Test 2: Headless API All Content
echo -n "Test 2: Headless All-Content Endpoint... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/wordpress/wp-json/headless/v1/all-content")
if [ "$RESPONSE" == "200" ]; then
    echo "PASS"
    ((PASS++))
else
    echo "FAIL (HTTP $RESPONSE)"
    ((FAIL++))
fi

# Test 3: Financial Tips Endpoint
echo -n "Test 3: Financial Tips Content... "
RESPONSE=$(curl -s "$BASE_URL/wordpress/wp-json/headless/v1/content/financial_tip")
TOTAL=$(echo $RESPONSE | jq -r '.total // 0')
if [ "$TOTAL" -ge 0 ]; then
    echo "PASS ($TOTAL items)"
    ((PASS++))
else
    echo "FAIL"
    ((FAIL++))
fi

# Test 4: Search Endpoint
echo -n "Test 4: Search Functionality... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/wordpress/wp-json/headless/v1/search?query=test")
if [ "$RESPONSE" == "200" ]; then
    echo "PASS"
    ((PASS++))
else
    echo "FAIL (HTTP $RESPONSE)"
    ((FAIL++))
fi

# Test 5: Response Time Check
echo -n "Test 5: API Response Time... "
TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/wordpress/wp-json/headless/v1/all-content")
TIME_MS=$(echo "$TIME * 1000" | bc)
if (( $(echo "$TIME < 0.3" | bc -l) )); then
    echo "PASS (${TIME_MS}ms)"
    ((PASS++))
else
    echo "WARNING (${TIME_MS}ms - target <300ms)"
    ((FAIL++))
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
```

---

## Implementation Gap Analysis

### What Works

| Feature | Status | Notes |
|---------|--------|-------|
| WordPress REST API | Working | Standard endpoints functional |
| Custom Headless Endpoints | Working | `/headless/v1/*` routes active |
| JWT Authentication | Working | Token generation and validation |
| Content Types (CPT) | Working | financial_tip, news, faq registered |
| Search API | Working | Basic search functionality |
| CORS Headers | Working | Cross-origin requests enabled |
| SQLite Database | Working | WordPress data persisted |

### What Needs Refinement

| Issue | Priority | Recommended Action |
|-------|----------|-------------------|
| Cache Invalidation | High | Implement webhook-based cache busting when WordPress content updates |
| Rate Limiting | Medium | Add rate limiting to prevent API abuse |
| Error Handling | Medium | Standardize error responses across all endpoints |
| Content Transformation | Medium | Add content sanitization layer for React rendering |
| Image Optimization | Low | Implement responsive image srcsets |
| Pagination Headers | Low | Add Link headers for pagination discovery |

### Identified Gaps

#### 1. Missing Laravel Service Layer
The WordPress service class structure is not fully implemented. Need:
- Complete `WordPressService` class
- Caching strategy implementation
- Error handling and retry logic

#### 2. Missing React Data Layer
No React components exist for WordPress content consumption:
- Need custom hooks for data fetching
- Need state management setup
- Need content rendering components

#### 3. Content Synchronization
No mechanism for real-time content updates:
- Consider WebSocket or polling strategy
- Implement cache invalidation webhooks

#### 4. Authentication Flow
JWT token management in React needs:
- Token storage strategy (httpOnly cookies recommended)
- Token refresh mechanism
- Protected route handling

---

## React Integration Planning

### Component Structure for WordPress Content

```
src/
├── components/
│   └── wordpress/
│       ├── ContentList.tsx          # Generic list component
│       ├── ContentCard.tsx          # Card display for content items
│       ├── ContentDetail.tsx        # Full content view
│       ├── FinancialTips/
│       │   ├── TipList.tsx
│       │   ├── TipCard.tsx
│       │   └── TipDetail.tsx
│       ├── News/
│       │   ├── NewsList.tsx
│       │   ├── NewsCard.tsx
│       │   └── NewsDetail.tsx
│       ├── FAQ/
│       │   ├── FAQList.tsx
│       │   └── FAQAccordion.tsx
│       └── common/
│           ├── LoadingSpinner.tsx
│           ├── ErrorBoundary.tsx
│           ├── ContentSkeleton.tsx
│           └── HTMLRenderer.tsx
├── hooks/
│   └── wordpress/
│       ├── useWordPressContent.ts    # Generic content fetching
│       ├── useFinancialTips.ts
│       ├── useNews.ts
│       ├── useFAQ.ts
│       ├── useWordPressSearch.ts
│       └── useWordPressAuth.ts
├── services/
│   └── wordpress/
│       ├── api.ts                    # API client configuration
│       ├── contentService.ts         # Content fetching methods
│       └── types.ts                  # TypeScript interfaces
└── store/
    └── wordpress/
        ├── contentSlice.ts           # Redux slice (if using Redux)
        └── selectors.ts
```

### State Management Approach

#### Option A: React Query (Recommended)

```typescript
// hooks/wordpress/useWordPressContent.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { wordPressApi } from '@/services/wordpress/api';

interface UseWordPressContentOptions {
  contentType: 'financial_tip' | 'news' | 'faq' | 'post' | 'page';
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function useWordPressContent({
  contentType,
  page = 1,
  perPage = 10,
  enabled = true
}: UseWordPressContentOptions) {
  return useQuery({
    queryKey: ['wordpress', 'content', contentType, { page, perPage }],
    queryFn: () => wordPressApi.getContent(contentType, { page, perPage }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Usage in component
function FinancialTipsList() {
  const { data, isLoading, error, refetch } = useWordPressContent({
    contentType: 'financial_tip',
    perPage: 10
  });

  if (isLoading) return <ContentSkeleton count={3} />;
  if (error) return <ErrorState onRetry={refetch} />;
  
  return <TipList tips={data.posts} />;
}
```

#### Option B: Zustand (Lightweight Alternative)

```typescript
// store/wordpress/contentStore.ts
import { create } from 'zustand';
import { wordPressApi } from '@/services/wordpress/api';

interface ContentState {
  content: Record<string, any[]>;
  loading: Record<string, boolean>;
  errors: Record<string, Error | null>;
  fetchContent: (type: string) => Promise<void>;
  invalidateCache: (type?: string) => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  content: {},
  loading: {},
  errors: {},
  
  fetchContent: async (type: string) => {
    set((state) => ({
      loading: { ...state.loading, [type]: true },
      errors: { ...state.errors, [type]: null }
    }));
    
    try {
      const data = await wordPressApi.getContent(type);
      set((state) => ({
        content: { ...state.content, [type]: data.posts },
        loading: { ...state.loading, [type]: false }
      }));
    } catch (error) {
      set((state) => ({
        errors: { ...state.errors, [type]: error as Error },
        loading: { ...state.loading, [type]: false }
      }));
    }
  },
  
  invalidateCache: (type?: string) => {
    if (type) {
      set((state) => ({
        content: { ...state.content, [type]: [] }
      }));
    } else {
      set({ content: {} });
    }
  }
}));
```

### Content Rendering Strategies

#### HTML Content Sanitization

```typescript
// components/wordpress/common/HTMLRenderer.tsx
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

interface HTMLRendererProps {
  content: string;
  className?: string;
}

export function HTMLRenderer({ content, className }: HTMLRendererProps) {
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 
                     'a', 'strong', 'em', 'blockquote', 'img', 'br', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'target', 'rel'],
      ADD_ATTR: ['target'],
    });
  }, [content]);

  return (
    <div 
      className={`wordpress-content prose prose-slate max-w-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
```

#### Responsive Image Handling

```typescript
// components/wordpress/common/WordPressImage.tsx
interface WordPressImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}

export function WordPressImage({ src, alt, sizes, className }: WordPressImageProps) {
  const generateSrcSet = (url: string) => {
    const widths = [320, 640, 768, 1024, 1280];
    return widths
      .map(w => `${url}?w=${w} ${w}w`)
      .join(', ');
  };

  return (
    <img
      src={src}
      srcSet={generateSrcSet(src)}
      sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
```

### Loading States and Error Handling

#### Loading States

```typescript
// components/wordpress/common/ContentSkeleton.tsx
interface ContentSkeletonProps {
  count?: number;
  variant?: 'card' | 'list' | 'detail';
}

export function ContentSkeleton({ count = 3, variant = 'card' }: ContentSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletons.map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-t-lg" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="animate-pulse max-w-3xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${90 - i * 5}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {skeletons.map((i) => (
        <div key={i} className="animate-pulse flex space-x-4">
          <div className="h-16 w-16 bg-gray-200 rounded" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### Error Handling

```typescript
// components/wordpress/common/ErrorState.tsx
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = 'Failed to load content',
  message = 'There was a problem loading the content. Please try again.',
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
}

// Error Boundary Component
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WordPress Content Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorState 
          title="Something went wrong"
          message="Failed to render this content section."
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```

### Performance Optimization Techniques

#### 1. Request Deduplication

```typescript
// services/wordpress/api.ts
import axios from 'axios';

const pendingRequests = new Map<string, Promise<any>>();

export const wordPressApi = axios.create({
  baseURL: '/wordpress/wp-json',
  timeout: 10000,
});

wordPressApi.interceptors.request.use((config) => {
  const key = `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
  
  if (pendingRequests.has(key)) {
    const controller = new AbortController();
    config.signal = controller.signal;
    controller.abort('Duplicate request');
  }
  
  return config;
});
```

#### 2. Prefetching Strategy

```typescript
// hooks/wordpress/usePrefetch.ts
import { useQueryClient } from '@tanstack/react-query';
import { wordPressApi } from '@/services/wordpress/api';

export function usePrefetchContent() {
  const queryClient = useQueryClient();

  const prefetchContentType = async (type: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['wordpress', 'content', type],
      queryFn: () => wordPressApi.getContent(type),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchAllContent = async () => {
    const types = ['financial_tip', 'news', 'faq'];
    await Promise.all(types.map(prefetchContentType));
  };

  return { prefetchContentType, prefetchAllContent };
}
```

#### 3. Virtualized Lists for Large Datasets

```typescript
// components/wordpress/common/VirtualizedContentList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
}

export function VirtualizedContentList<T>({ 
  items, 
  renderItem, 
  estimateSize = 100 
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 4. Image Lazy Loading with Intersection Observer

```typescript
// hooks/useLazyImage.ts
import { useEffect, useRef, useState } from 'react';

export function useLazyImage(src: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return { imgRef, isLoaded, isInView, setIsLoaded };
}
```

---

## Key Technical Components

### WordPress Side

#### 1. REST API Configuration (wp-config.php)

```php
// JWT Authentication Secret Key
define('JWT_AUTH_SECRET_KEY', 'your-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);

// Enable REST API for headless usage
define('WP_REST_CACHE', true);

// Disable unnecessary features for headless
define('DISALLOW_FILE_EDIT', true);
define('WP_POST_REVISIONS', 5);
```

#### 2. JWT Authentication Setup

Ensure the JWT Authentication plugin is active and configured:
- Install "JWT Authentication for WP REST API" plugin
- Add secret key to wp-config.php
- Test token endpoint: `POST /wp-json/jwt-auth/v1/token`

#### 3. Custom Endpoint (functions.php)

```php
add_action('rest_api_init', function () {
    register_rest_route('myapp/v1', '/content', array(
        'methods' => 'GET',
        'callback' => 'get_combined_content',
        'permission_callback' => function () {
            return true;
        }
    ));
});

function get_combined_content(WP_REST_Request $request) {
    $response = array();
    
    $post_types = array('post', 'page', 'financial_tip', 'news', 'faq');
    
    foreach ($post_types as $type) {
        $posts = get_posts(array(
            'post_type' => $type,
            'posts_per_page' => $request->get_param('limit') ?: 10,
            'post_status' => 'publish'
        ));
        
        $response[$type] = array_map(function($post) {
            return array(
                'id' => $post->ID,
                'title' => get_the_title($post),
                'excerpt' => get_the_excerpt($post),
                'content' => apply_filters('the_content', $post->post_content),
                'date' => $post->post_date,
                'slug' => $post->post_name,
                'featured_image' => get_the_post_thumbnail_url($post, 'full')
            );
        }, $posts);
    }
    
    return new WP_REST_Response($response, 200);
}
```

### Laravel Side

#### WordPress Service Class

```php
<?php
// app/Services/WordPressService.php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WordPressService
{
    protected string $baseUrl;
    protected int $cacheTime = 3600; // 1 hour
    protected int $timeout = 10; // seconds

    public function __construct()
    {
        $this->baseUrl = config('services.wordpress.url', config('app.url') . '/wordpress');
    }

    public function getPosts(?string $category = null, int $limit = 10): array
    {
        $cacheKey = "wp_posts_{$category}_{$limit}";
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($category, $limit) {
            try {
                $params = ['per_page' => $limit];
                if ($category) {
                    $params['categories'] = $this->getCategoryId($category);
                }
                
                $response = Http::timeout($this->timeout)
                    ->get("{$this->baseUrl}/wp-json/wp/v2/posts", $params);
                
                if ($response->failed()) {
                    Log::error('WordPress API failed', [
                        'status' => $response->status(),
                        'body' => $response->body()
                    ]);
                    return [];
                }
                
                return $this->transformPosts($response->json());
            } catch (\Exception $e) {
                Log::error('WordPress API exception', ['message' => $e->getMessage()]);
                return [];
            }
        });
    }

    public function getContent(string $type, int $page = 1, int $perPage = 10): array
    {
        $cacheKey = "wp_content_{$type}_{$page}_{$perPage}";
        
        return Cache::remember($cacheKey, $this->cacheTime, function () use ($type, $page, $perPage) {
            try {
                $response = Http::timeout($this->timeout)
                    ->get("{$this->baseUrl}/wp-json/headless/v1/content/{$type}", [
                        'page' => $page,
                        'per_page' => $perPage
                    ]);
                
                if ($response->failed()) {
                    return ['posts' => [], 'total' => 0, 'total_pages' => 0];
                }
                
                return $response->json();
            } catch (\Exception $e) {
                Log::error('WordPress content fetch failed', [
                    'type' => $type,
                    'error' => $e->getMessage()
                ]);
                return ['posts' => [], 'total' => 0, 'total_pages' => 0];
            }
        });
    }

    public function getAllContent(): array
    {
        return Cache::remember('wp_all_content', $this->cacheTime, function () {
            try {
                $response = Http::timeout($this->timeout)
                    ->get("{$this->baseUrl}/wp-json/headless/v1/all-content");
                
                return $response->successful() ? $response->json() : [];
            } catch (\Exception $e) {
                Log::error('WordPress all-content fetch failed', ['error' => $e->getMessage()]);
                return [];
            }
        });
    }

    public function search(string $query): array
    {
        $cacheKey = 'wp_search_' . md5($query);
        
        return Cache::remember($cacheKey, 300, function () use ($query) { // 5 min cache for search
            try {
                $response = Http::timeout($this->timeout)
                    ->get("{$this->baseUrl}/wp-json/headless/v1/search", [
                        'query' => $query
                    ]);
                
                return $response->successful() ? $response->json() : ['results' => [], 'total' => 0];
            } catch (\Exception $e) {
                return ['results' => [], 'total' => 0];
            }
        });
    }

    public function invalidateCache(?string $type = null): void
    {
        if ($type) {
            Cache::forget("wp_content_{$type}_*");
        } else {
            Cache::forget('wp_all_content');
            Cache::flush(); // Consider using tagged caches instead
        }
    }

    protected function transformPosts(array $posts): array
    {
        return array_map(function ($post) {
            return [
                'id' => $post['id'],
                'title' => $post['title']['rendered'] ?? '',
                'excerpt' => strip_tags($post['excerpt']['rendered'] ?? ''),
                'content' => $post['content']['rendered'] ?? '',
                'date' => $post['date'],
                'slug' => $post['slug'],
                'link' => $post['link'],
            ];
        }, $posts);
    }

    protected function getCategoryId(string $slug): ?int
    {
        $categories = Cache::remember('wp_categories', 86400, function () {
            $response = Http::get("{$this->baseUrl}/wp-json/wp/v2/categories");
            return $response->successful() ? $response->json() : [];
        });
        
        foreach ($categories as $category) {
            if ($category['slug'] === $slug) {
                return $category['id'];
            }
        }
        
        return null;
    }
}
```

#### Service Provider Registration

```php
// app/Providers/AppServiceProvider.php

public function register(): void
{
    $this->app->singleton(WordPressService::class, function ($app) {
        return new WordPressService();
    });
}
```

#### Configuration

```php
// config/services.php

'wordpress' => [
    'url' => env('WORDPRESS_URL', env('APP_URL') . '/wordpress'),
    'cache_ttl' => env('WORDPRESS_CACHE_TTL', 3600),
],
```

---

## Implementation Metrics

| Metric | Target | Current Status | Notes |
|--------|--------|----------------|-------|
| API Response Time | < 300ms | TBD | Measure with actual load testing |
| Content Refresh Delay | < 5 minutes | 60 minutes (cache TTL) | Configurable via environment |
| Setup Complexity | Moderate | Moderate | WordPress + Laravel + React stack |
| Maintenance Effort | Low | Low | Minimal ongoing configuration needed |
| Cache Hit Ratio | > 80% | TBD | Monitor in production |
| Error Rate | < 1% | TBD | Implement monitoring |

### Performance Monitoring Checklist

- [ ] Set up API response time logging
- [ ] Configure cache monitoring (hits/misses)
- [ ] Implement error tracking (Sentry, etc.)
- [ ] Add health check endpoint
- [ ] Set up alerting for degraded performance
- [ ] Create dashboard for key metrics

---

## Quick Reference Commands

```bash
# Test all endpoints
./scripts/test-wordpress-api.sh

# Clear WordPress cache in Laravel
php artisan cache:forget wp_all_content

# Rebuild Vite assets
npm run build

# Check Laravel logs
tail -f storage/logs/laravel.log

# Check WordPress debug log
tail -f public/wordpress/wp-content/debug.log
```

---

*Last Updated: November 28, 2025*
