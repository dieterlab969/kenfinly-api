# WordPress Headless CMS API Documentation

## Overview

This document provides complete documentation for the WordPress Headless CMS API integrated with Kenfinly. WordPress runs as a headless CMS on SQLite, providing content management capabilities through REST API endpoints.

## Installation Summary

### WordPress Location
- **Path**: `/public/wordpress/`
- **Admin URL**: `{base_url}/wordpress/wp-admin/`
- **REST API Base**: `{base_url}/wordpress/wp-json/`

### Installed Plugins
1. **JWT Authentication for WP REST API** - Secure token-based authentication
2. **SQLite Database Integration** - SQLite database support
3. **Headless CMS API** (Custom) - Unified content delivery endpoints

### Custom Post Types
- `financial_tip` - Financial tips and advice
- `news` - News articles and updates
- `faq` - Frequently asked questions

## API Endpoints

### Standard WordPress REST API

#### Authentication

**Get JWT Token:**
```bash
curl -X POST "{base_url}/wordpress/wp-json/jwt-auth/v1/token" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'
```

**Response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user_email": "admin@example.com",
  "user_nicename": "admin",
  "user_display_name": "Admin"
}
```

**Validate Token:**
```bash
curl -X POST "{base_url}/wordpress/wp-json/jwt-auth/v1/token/validate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Posts
```bash
# Get all posts
curl "{base_url}/wordpress/wp-json/wp/v2/posts"

# Get single post
curl "{base_url}/wordpress/wp-json/wp/v2/posts/{id}"

# Get posts with pagination
curl "{base_url}/wordpress/wp-json/wp/v2/posts?per_page=10&page=1"
```

#### Pages
```bash
curl "{base_url}/wordpress/wp-json/wp/v2/pages"
```

#### Custom Post Types
```bash
# Financial Tips
curl "{base_url}/wordpress/wp-json/wp/v2/financial-tips"

# News Articles
curl "{base_url}/wordpress/wp-json/wp/v2/news"

# FAQs
curl "{base_url}/wordpress/wp-json/wp/v2/faqs"
```

### Custom Headless CMS Endpoints

These custom endpoints provide optimized content delivery for headless applications.

#### Get All Content (Single Request)
```bash
curl "{base_url}/wordpress/wp-json/headless/v1/all-content"
```

**Response:**
```json
{
  "site_info": {
    "name": "Kenfinly CMS",
    "description": "Content Management for Kenfinly",
    "url": "https://example.com/wordpress",
    "language": "en-US"
  },
  "content": {
    "post": [...],
    "page": [...],
    "financial_tip": [...],
    "news": [...],
    "faq": [...]
  }
}
```

#### Get Content by Type
```bash
curl "{base_url}/wordpress/wp-json/headless/v1/content/{type}?per_page=10&page=1"
```

**Example:**
```bash
curl "{base_url}/wordpress/wp-json/headless/v1/content/financial_tip"
```

**Response:**
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Start with an Emergency Fund",
      "slug": "start-with-an-emergency-fund",
      "excerpt": "Learn why an emergency fund should be your first financial priority.",
      "date": "2025-11-28 12:00:00",
      "type": "financial_tip",
      "featured_image": null,
      "author": {
        "id": 1,
        "name": "Admin"
      }
    }
  ],
  "total": 5,
  "total_pages": 1,
  "current_page": 1
}
```

#### Get Single Content Item
```bash
curl "{base_url}/wordpress/wp-json/headless/v1/content/{type}/{id}"
```

**Response includes full content:**
```json
{
  "id": 1,
  "title": "Start with an Emergency Fund",
  "slug": "start-with-an-emergency-fund",
  "excerpt": "...",
  "content": "<p>Full HTML content...</p>",
  "date": "2025-11-28 12:00:00",
  "modified": "2025-11-28 12:00:00",
  "type": "financial_tip",
  "featured_image": null,
  "author": {...},
  "meta": {...},
  "categories": [...],
  "tags": [...]
}
```

#### Get Site Information
```bash
curl "{base_url}/wordpress/wp-json/headless/v1/site-info"
```

#### Get Navigation Menus
```bash
curl "{base_url}/wordpress/wp-json/headless/v1/menus"
```

#### Search Content
```bash
curl "{base_url}/wordpress/wp-json/headless/v1/search?query=budget"
```

**Response:**
```json
{
  "query": "budget",
  "results": [...],
  "total": 3
}
```

## Authentication for Protected Endpoints

### Using JWT Token

For endpoints that require authentication (creating/updating content):

```bash
# First, get a token
TOKEN=$(curl -s -X POST "{base_url}/wordpress/wp-json/jwt-auth/v1/token" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}' | jq -r '.token')

# Use the token for authenticated requests
curl -X POST "{base_url}/wordpress/wp-json/wp/v2/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Post",
    "content": "Post content here",
    "status": "publish"
  }'
```

### Application Passwords (WordPress 5.6+)

WordPress 5.6+ includes built-in Application Passwords. Generate one in Users > Your Profile > Application Passwords.

```bash
curl "{base_url}/wordpress/wp-json/wp/v2/posts" \
  -u "username:application_password"
```

## Test Requests

### Basic API Test
```bash
# Test if API is accessible
curl -s "{base_url}/wordpress/wp-json/" | jq '.name'
```

### Content Endpoints Test
```bash
# Test all content endpoint
curl -s "{base_url}/wordpress/wp-json/headless/v1/all-content" | jq '.content | keys'

# Test individual content types
curl -s "{base_url}/wordpress/wp-json/headless/v1/content/financial_tip" | jq '.total'
curl -s "{base_url}/wordpress/wp-json/headless/v1/content/news" | jq '.total'
curl -s "{base_url}/wordpress/wp-json/headless/v1/content/faq" | jq '.total'
```

### Search Test
```bash
curl -s "{base_url}/wordpress/wp-json/headless/v1/search?query=finance" | jq '.results | length'
```

## WordPress Admin Setup

### First-Time Setup

1. Navigate to `{base_url}/wordpress/wp-admin/install.php`
2. Complete the WordPress installation wizard:
   - Site Title: Kenfinly CMS
   - Username: admin
   - Password: (choose a secure password)
   - Email: your@email.com

3. After installation, log in and:
   - Go to Plugins > Installed Plugins
   - Activate "JWT Authentication for WP REST API"
   - Activate "Headless CMS API"

4. Seed sample data:
   - Visit `{base_url}/wordpress/wp-admin/?seed_sample_data=1`
   - Or create content manually in the admin panel

### Managing Content

- **Financial Tips**: Posts > Financial Tips > Add New
- **News Articles**: Posts > News Articles > Add New
- **FAQs**: Posts > FAQs > Add New

## CORS Configuration

The Headless CMS API includes CORS headers for cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce
```

## Integration with Laravel/React Frontend

### Example React Hook

```javascript
const useWordPressContent = (contentType) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/wordpress/wp-json/headless/v1/content/${contentType}`)
      .then(res => res.json())
      .then(data => {
        setData(data.posts);
        setLoading(false);
      });
  }, [contentType]);
  
  return { data, loading };
};

// Usage
const { data: tips, loading } = useWordPressContent('financial_tip');
```

### Example Laravel Controller

```php
public function getFinancialTips()
{
    $response = Http::get(config('app.url') . '/wordpress/wp-json/headless/v1/content/financial_tip');
    return $response->json();
}
```

## Troubleshooting

### Common Issues

1. **404 on API endpoints**: Ensure WordPress permalinks are set to "Post name" or use plain permalinks.

2. **JWT Token issues**: Verify `JWT_AUTH_SECRET_KEY` is set in wp-config.php.

3. **CORS errors**: Check that CORS headers are being sent. The headless-cms-api plugin handles this automatically.

4. **Database errors**: Ensure the SQLite database file exists in `storage/wordpress/` and is writable.

### Debug Mode

Enable debug logging in wp-config.php:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Check logs at: `public/wordpress/wp-content/debug.log`
