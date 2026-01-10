# Changelog

All notable changes to the Personal Finance Application (Kenfinly) are documented in this file.

## [1.4.0] - 2025-11-28

### Added - WordPress-Powered Landing Page and Blog

This release transforms the homepage from a login-only page to a WordPress-powered landing page with integrated blog functionality.

#### New Public Pages
- **Landing Page** (`/`) - Marketing homepage with:
  - Navigation menu (Home, Features, Blog, About)
  - Hero section with "Take Control of Your Financial Future" messaging
  - Features grid showcasing platform capabilities
  - Latest blog posts section (fetched from WordPress)
  - Financial tips section (from WordPress custom post type)
  - Call-to-action sections with Sign In and Get Started buttons
  
- **Blog Page** (`/blog`) - Blog listing with:
  - Search functionality
  - Category filtering
  - Pagination
  - Responsive grid layout
  - Error state handling for WordPress unavailability

- **Blog Post Page** (`/blog/:slug`) - Individual article view with:
  - Full content display
  - Reading time estimation
  - Share functionality
  - Related posts section

- **About Page** (`/about`) - Company information with:
  - Mission statement
  - Company story (can be managed via WordPress)
  - Core values section
  - Statistics showcase

#### New Components
- `Navbar.jsx` - Responsive navigation with mobile menu
- `Footer.jsx` - Site-wide footer with links and contact info
- `PublicLayout.jsx` - Layout wrapper for public pages

#### WordPress API Integration
- `wordpressApi.js` - React service for WordPress REST API
- Handles posts, pages, categories, custom post types
- Graceful error handling with "Try Again" functionality
- Loading states and empty state messages

#### Route Changes
- Homepage (`/`) now shows landing page instead of login redirect
- Login page available at `/login`
- Catch-all route redirects to homepage

## [1.3.0] - 2025-11-28

### Changed - WordPress Composer Integration

This release restructures WordPress installation to use Composer for dependency management, improving deployment workflow and version control practices.

#### Composer Integration
- WordPress core is now installed via Composer using `johnpbloch/wordpress` package
- WordPress plugins from WPackagist:
  - `wpackagist-plugin/jwt-authentication-for-wp-rest-api` - JWT authentication
  - `wpackagist-plugin/sqlite-database-integration` - SQLite database support
- Configured `wordpress-install-dir` in composer.json for proper installation path
- Added installer paths for WordPress plugins and themes

#### Installation Script (`install-wp.sh`)
- Created automated bash script for WordPress setup
- Deploys custom wp-config.php with SQLite and JWT configuration
- Installs custom must-use plugins (mu-plugins):
  - `auto-activate-plugins.php` - Automatically activates required plugins
  - `sample-data-seeder.php` - Seeds initial content for testing
- Deploys custom plugins:
  - `headless-cms-api` - Custom REST API endpoints for headless CMS
- Sets proper file permissions
- Configures SQLite database integration

#### Custom WordPress Files (`wordpress-custom/`)
- `configs/wp-config.php` - Custom WordPress configuration
- `mu-plugins/` - Must-use plugins (auto-loaded by WordPress)
- `plugins/` - Custom plugins (headless-cms-api)
- `themes/` - Custom themes (if any)

#### Git Workflow Improvements
- WordPress source code excluded from version control
- Only custom configurations, plugins, and themes are tracked
- Added `.gitkeep` to preserve directory structure
- Reduced repository size significantly

#### New Files
- `install-wp.sh` - WordPress installation script
- `wordpress-custom/` - Directory for custom WordPress files
- `docs/WORDPRESS_LARAVEL_API_TESTING.md` - API testing documentation

#### Usage
```bash
# Install all dependencies including WordPress
composer install

# Run WordPress setup script
./install-wp.sh

# Start development server
php -S 0.0.0.0:5000 server.php
```

## [1.2.0] - 2025-11-28

### Added - WordPress Headless CMS Laravel Integration

This release adds a comprehensive Laravel-based WordPress REST API integration layer that enables seamless content management from a headless WordPress CMS.

#### WordPress Service Class (`app/Services/WordPressService.php`)
- Full WordPress REST API v2 integration
- Automatic authentication support (Basic Auth, Application Passwords)
- Configurable timeout and retry mechanisms
- Built-in caching with customizable TTL per content type
- Error handling with detailed logging
- Support for standard and custom post types

#### New API Endpoints (`/api/wordpress/...`)

**Content Endpoints:**
- `GET /posts` - List posts with pagination and filtering
- `GET /posts/{id}` - Get post by ID
- `GET /posts/slug/{slug}` - Get post by slug
- `GET /pages` - List pages
- `GET /pages/{id}` - Get page by ID
- `GET /pages/slug/{slug}` - Get page by slug
- `GET /categories` - List WordPress categories
- `GET /tags` - List WordPress tags
- `GET /media/{id}` - Get media item details

**Custom Post Types:**
- `GET /custom/{postType}` - List custom post type items
- `GET /custom/{postType}/{id}` - Get custom post type item by ID
- `GET /custom/{postType}/slug/{slug}` - Get custom post type item by slug

**Utility Endpoints:**
- `GET /search?q={query}` - Search across content
- `GET /menus` - Get WordPress menus
- `GET /menus/{location}` - Get menu by location
- `GET /site-info` - Get WordPress site information
- `GET /status` - Check WordPress API configuration and connection
- `GET /test-connection` - Test WordPress API connectivity
- `POST /admin/wordpress/cache/clear` - Clear WordPress cache (Admin only)

#### Configuration (`config/wordpress.php`)
- `WORDPRESS_API_URL` - WordPress site URL
- `WORDPRESS_USERNAME` - Authentication username
- `WORDPRESS_APPLICATION_PASSWORD` - Application password (recommended)
- `WORDPRESS_TIMEOUT` - Request timeout (default: 30s)
- `WORDPRESS_RETRIES` - Retry attempts (default: 3)
- Customizable cache TTL for each content type

#### Caching Features
- Automatic content caching with configurable TTL
- Cache bypass option via `?cache=false` query parameter
- Content-type specific cache durations:
  - Posts: 5 minutes
  - Pages: 10 minutes
  - Categories/Tags: 1 hour
  - Menus: 30 minutes
- Admin cache clear functionality

#### Error Handling
- Graceful degradation when WordPress is not configured
- Detailed error logging for debugging
- User-friendly error messages
- HTTP status code mapping
- Connection retry with exponential backoff

#### Security Features
- Application Password authentication support
- Configurable allowed custom post types
- No credentials exposed in responses
- Request rate limiting awareness

## [1.1.0] - 2025-11-28

### Added - WordPress Headless CMS Integration

#### WordPress Installation
- WordPress 6.x installed in `/public/wordpress/` subdirectory
- SQLite database integration for lightweight, serverless operation
- Database stored in `/storage/wordpress/` for data persistence

#### Plugins Installed
- **JWT Authentication for WP REST API**: Secure token-based API authentication
- **SQLite Database Integration**: WordPress SQLite database support
- **Headless CMS API** (Custom): Unified content delivery endpoints

#### Custom Post Types
- **Financial Tips** (`financial_tip`): Financial advice and tips for users
- **News Articles** (`news`): News and updates related to personal finance
- **FAQs** (`faq`): Frequently asked questions with answers

#### Custom REST API Endpoints
- `GET /wordpress/wp-json/headless/v1/all-content` - Retrieves all content types in a single request
- `GET /wordpress/wp-json/headless/v1/content/{type}` - Get paginated content by type
- `GET /wordpress/wp-json/headless/v1/content/{type}/{id}` - Get single content item with full details
- `GET /wordpress/wp-json/headless/v1/menus` - Get navigation menus
- `GET /wordpress/wp-json/headless/v1/site-info` - Get site configuration
- `GET /wordpress/wp-json/headless/v1/search` - Search across all content types

#### Sample Content Seeder
- 5 Financial Tips covering budgeting, saving, and expense tracking
- 3 News Articles about personal finance updates
- 5 FAQs about Kenfinly features and usage
- Auto-seeding via admin interface or activation

#### Security Features
- JWT token authentication for protected endpoints
- CORS headers configured for cross-origin requests
- Application Passwords support (WordPress 5.6+)
- Secure database storage outside web root

#### Documentation
- Complete API documentation in `docs/WORDPRESS_HEADLESS_CMS_API.md`
- Test requests and examples for all endpoints
- Integration examples for React and Laravel

### Added - PostgreSQL Database Migration

#### Database Configuration
- Migrated from SQLite to PostgreSQL for main application
- Database seeder for importing existing data
- All tables recreated with PostgreSQL-compatible schema

#### New Files
- `database/seeders/ImportMysqlDataSeeder.php` - Data import seeder
- Sample data including users, accounts, categories, and transactions

## [1.0.0] - 2025-11-08

### Added - Payment Module

#### Database Schema
- **Licenses Table**: Stores software license keys with expiration dates, status tracking (active, expired, revoked, trial), and user associations
- **Subscriptions Table**: Manages subscription periods with plan details, pricing, and status (active, canceled, expired, pending)
- **Payments Table**: Logs payment transactions with gateway details, amounts, payment methods (credit card, PayPal), and transaction status
- **Payment Webhooks Table**: Handles asynchronous payment notifications from payment gateways with idempotency and retry logic

#### Models
- **License Model**: Manages license lifecycle with validation methods (`isActive()`, `isExpired()`)
- **Subscription Model**: Tracks subscription status and provides active subscription checking
- **Payment Model**: Records payment transactions with completion status tracking
- **PaymentWebhook Model**: Processes webhook events with status management

#### Services
- **LicenseService**: 
  - Automatic license key generation using secure random strings
  - License creation with 1-year default expiration
  - License validation and status checking
  - License revocation and renewal capabilities

#### API Endpoints - Payment & Licensing
- `POST /api/payments/create-intent` - Create payment intent for license purchase
- `POST /api/webhooks/payment` - Webhook endpoint for payment gateway callbacks (public)
- `GET /api/licenses/my-licenses` - Retrieve user's licenses

#### Features
- Secure JWT-based authentication for all payment endpoints
- Automatic license issuance upon successful payment
- Support for multiple payment methods (credit card, PayPal)
- Webhook handling with proper error tracking
- PCI DSS compliant design (no raw card data storage)

### Added - Role-Based Access Control (RBAC)

#### Database Schema
- **Account Participants Table**: Links users to accounts with specific roles
- **Invitations Table**: Manages account sharing invitations with token-based acceptance

#### Roles System
- **Owner Role**: Full access to manage accounts, invite users, and control all settings
- **Editor Role**: Can create, edit, and delete transactions and categories
- **Viewer Role**: Read-only access to view transactions and reports

#### Models
- **AccountParticipant Model**: Manages user-account-role relationships with helper methods
- **Invitation Model**: Handles invitation lifecycle with expiration and token generation

#### Policies
- **AccountPolicy**: Enforces authorization rules for account operations (view, update, delete, manageParticipants)

#### API Endpoints - Participant Management
- `POST /api/participants/invite` - Invite users to share account with specific roles
- `POST /api/invitations/{token}/accept` - Accept account invitation
- `GET /api/accounts/{accountId}/participants` - List account participants
- `DELETE /api/accounts/{accountId}/participants/{userId}` - Remove participant from account

#### Features
- Multi-user collaborative account management
- Secure invitation system with 7-day expiration tokens
- Role-based permission enforcement at model and controller levels
- Owner can manage all aspects, editors can modify data, viewers have read-only access

### Added - CSV Import & Export (Web API)

#### API Endpoints
- `POST /api/csv/import` - Upload and import CSV files with transaction data
- `GET /api/csv/export` - Export transactions to CSV with optional date range filtering

#### CSV Export Features
- Export all transaction records (not just summary data)
- Date range filtering with `start_date` and `end_date` parameters
- Optional `account_id` parameter to filter by specific account
- Exports transactions from owned accounts and shared accounts (participant access)
- CSV format includes: Date, Account, Category, Type, Amount, Currency, Description, Notes
- Automatic filename generation with timestamp (`transactions_export_YYYY-MM-DD_HHMMSS.csv`)
- Proper CSV escaping for fields containing commas, quotes, or newlines
- Downloadable file with appropriate headers for browser download

#### CSV Import Features
- Web-based CSV upload (separate from console command, optimized for web usage)
- File validation: Max 10MB, CSV/TXT MIME types only
- CSV header validation (enforces correct column structure)
- Support for multiple date formats (Y-m-d, m/d/Y, d/m/Y, Y/m/d, d-m-Y, m-d-Y)
- Automatic category creation if category doesn't exist
- Comprehensive validation for each row:
  - Valid transaction type (income/expense)
  - Positive amount validation
  - Date format validation
  - Required field validation
- Detailed import summary with:
  - Total rows processed
  - Success count
  - Failed count
  - Specific error messages for each failed row (with row numbers)
- Database transaction support with automatic rollback on critical errors
- Role-based access: Account owners and invited participants with owner/editor roles can import
- Returns JSON response with import summary and detailed error information

### Added - Financial Analytics

#### API Endpoints
- `GET /api/analytics/summary` - Financial summary with income, expenses, and balance
- `GET /api/analytics/category-breakdown` - Spending breakdown by category
- `GET /api/analytics/trends` - Monthly income and expense trends (configurable time period)

#### Features
- Account-specific or user-wide analytics
- Category-based spending analysis
- Time-series trend data for visualization
- Flexible query parameters for customization

### Enhanced - User & Account Models

#### User Model Extensions
- License relationship management
- Subscription tracking
- Payment history access
- Account participation tracking
- Helper methods: `activeLicense()`, `hasActiveLicense()`

#### Account Model Extensions
- Participant management
- Invitation tracking
- Role-based access helpers: `hasParticipant()`, `getParticipantRole()`

### Technical Infrastructure

#### Migrations
- 6 new database tables with proper foreign key constraints
- Indexed columns for optimized query performance
- Enum types for status tracking

#### Seeders
- RolesTableSeeder: Populates owner, editor, and viewer roles with descriptions

#### Security Features
- JWT authentication enforced on all sensitive endpoints
- Role-based authorization policies
- Public webhook endpoint with validation support
- Secure token generation for invitations
- Foreign key constraints for data integrity

### API Route Structure
- RESTful API design patterns
- Grouped authenticated vs public routes
- Consistent error responses
- JSON response format throughout

## Architecture Compliance

This release implements the following components from the Technical Architecture Proposal:

✅ Payment Module with license and subscription management  
✅ Role-based access control (owner, editor, viewer)  
✅ Participant management and invitation system  
✅ CSV import via web API  
✅ Financial analytics endpoints  
✅ Secure payment gateway integration structure  
✅ JWT-based authentication  
✅ RESTful API design  

## Database Schema Summary

### New Tables (6)
1. `licenses` - License key management
2. `subscriptions` - Subscription tracking
3. `payments` - Payment transaction records
4. `payment_webhooks` - Webhook event logging
5. `account_participants` - User-account-role associations
6. `invitations` - Account sharing invitations

### Updated Tables
- `users` - Extended with payment and participant relationships
- `accounts` - Extended with participant and invitation relationships

## API Endpoints Summary

Total new endpoints: 13

### Payment & Licensing (3)
- Payment intent creation
- Webhook processing
- License retrieval

### Participant Management (4)
- Invitation creation
- Invitation acceptance
- Participant listing
- Participant removal

### CSV Import (1)
- Web-based CSV upload and processing

### Analytics (3)
- Financial summary
- Category breakdown
- Trend analysis

### Existing Endpoints
- Authentication (4)
- Transactions (CRUD - 5)
- Accounts (CRUD - 5)
- Categories (1)
- Dashboard (1)
- Languages (3)

## Notes

- Payment gateway integration is designed for easy extension with Stripe, PayPal, or other providers
- All sensitive operations require authentication
- Collaborative features support team-based financial management
- System follows PCI DSS best practices for payment handling
- Database migrations are reversible for safe rollbacks

## Future Enhancements

- Payment gateway SDK integration (Stripe, PayPal)
- Email notifications for invitations
- Promo code system implementation
- Trial license automation
- Advanced financial visualization with Python/Seaborn
- Export functionality for reports
- Mobile app support
