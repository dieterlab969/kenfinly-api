<?php

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;
use Dedoc\Scramble\SecurityDocumentation\MiddlewareAuthSecurityStrategy;
use Dedoc\Scramble\Support\Generator\SecurityScheme;

return [

    /*
     * Which routes to document.
     */
    'api_path' => 'api',

    'api_domain' => null,

    /*
     * The path where the OpenAPI JSON spec will be exported.
     */
    'export_path' => 'api.json',

    'cache' => [
        'key' => 'scramble.openapi',
        'store' => 'file',
    ],

    'info' => [
        'version' => env('API_VERSION', '1.0.0'),
        'description' => <<<'MD'
## Kenfinly REST API

Personal-finance and habit-tracking platform.  
All protected endpoints require a **Bearer JWT token** obtained from `POST /api/auth/login`.

### Quick start
1. Call `POST /api/auth/login` with valid credentials.
2. Copy the `access_token` value from the response.
3. Click **Authorize** (🔒) in the top-right corner and paste the token.
4. All subsequent requests will automatically include `Authorization: Bearer <token>`.

### Route groups
| Prefix | Auth required | Purpose |
|--------|--------------|---------|
| `/api/auth/*` | Public / Bearer | Authentication flow |
| `/api/*` (no prefix) | Bearer | User-facing features |
| `/api/admin/*` | Bearer + super-admin | Admin management |
| `/api/v1/*` | Bearer | Versioned endpoints |
| `/api/wordpress/*` | Public | Headless-CMS proxy |
MD,
    ],

    'ui' => [
        'title' => 'Kenfinly API Docs',
    ],

    'renderer' => 'elements',

    'renderers' => [
        'elements' => [
            'view' => 'scramble::docs',
            'theme' => 'light',
            'hideTryIt' => false,
            'hideSchemas' => false,
            'logo' => '',
            'tryItCredentialsPolicy' => 'include',
            'layout' => 'responsive',
            'router' => 'hash',
        ],
        'scalar' => [
            'view' => 'scramble::scalar',
            'cdn' => 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
            'theme' => 'laravel',
            'proxyUrl' => 'https://proxy.scalar.com',
            'darkMode' => false,
            'showDeveloperTools' => 'never',
            'agent' => ['disabled' => true],
            'credentials' => 'include',
        ],
    ],

    'servers' => null,

    'enum_cases_description_strategy' => 'description',

    'enum_cases_names_strategy' => false,

    'flatten_deep_query_parameters' => true,

    'middleware' => [
        'web',
        RestrictedDocsAccess::class,
    ],

    'extensions' => [],

    /*
     * Automatically detect auth:api (JWT) middleware and mark those routes as
     * requiring Bearer authentication in the OpenAPI spec.
     */
    'security_strategy' => [
        MiddlewareAuthSecurityStrategy::class,
        [
            'middleware' => ['auth', 'auth:*'],
            'scheme' => SecurityScheme::http('bearer'),
        ],
    ],
];
