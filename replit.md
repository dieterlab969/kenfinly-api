# Overview

Kenfinly is a personal finance application designed to help users track, understand, and improve their financial health. It offers features such as multi-account and multi-currency expense/income tracking, budget planning, analytical dashboards, goal-oriented savings, and smart spending notifications. The project aims to provide a comprehensive and intuitive tool for personal financial management with strong market potential for users seeking robust financial control.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Design

The frontend is a Single Page Application (SPA) built with React 19.2, Vite 7.x, and Tailwind CSS 4.0. It features a responsive design with a blue gradient theme, interactive dashboards using Recharts, and modals for transaction entry with real-time updates. A dedicated admin UI with a dark sidebar navigation and consistent layout is implemented for super administrators. The application also supports multilanguage functionality, specifically English and Vietnamese, with a shared translation manifest architecture ensuring graceful degradation in offline mode.

### Public Pages (WordPress-Powered)
- **Landing Page** (`/`) - Marketing homepage with navigation, hero section, features, blog preview, and CTAs
- **Blog Page** (`/blog`) - Blog listing with search, category filtering, and pagination
- **Blog Post Page** (`/blog/:slug`) - Individual article view with related posts
- **About Page** (`/about`) - Company information and values
- **Login Page** (`/login`) - User authentication
- **Register Page** (`/register`) - New user registration

### Public Components
- `Navbar.jsx` - Responsive navigation with mobile menu
- `Footer.jsx` - Site-wide footer with links and contact
- `PublicLayout.jsx` - Layout wrapper for public pages

### WordPress API Service
- `resources/js/services/wordpressApi.js` - React service for WordPress REST API integration
- Handles posts, pages, categories, custom post types (financial_tip, news, faq)
- Graceful error handling with "Try Again" functionality

## Technical Implementation

The backend is built with Laravel 12 (PHP 8.2+) and provides a REST API. Key architectural decisions include:
- **Authentication**: JWT via `tymon/jwt-auth` for stateless API authentication.
- **Database**: PostgreSQL with Eloquent ORM.
- **Authorization**: Role-Based Access Control (RBAC) with 'owner', 'editor', and 'viewer' roles, enforced via custom middleware. Super Admin roles have full system-wide management capabilities through a dedicated admin dashboard.
- **Core Models**: `users`, `roles`, `user_roles`, `accounts`, `categories`, and `transactions`.
- **Transaction Management**: Comprehensive detail viewing, photo management (with server-side image optimization), and detailed change history tracking (audit trail).
- **CSV Import/Export**: Web-based functionality with date filtering, detailed validation, and role-based access.
- **Email Verification**: Two-step email verification for new user registrations to enhance security.
- **Bot Protection**: Google reCAPTCHA v3 implemented on login and registration forms, configurable via command-line.
- **Development Environment**: Dockerized using Laravel Sail.
- **Concurrency**: `npm-concurrently` for running multiple development services.

## Feature Specifications

- **Multi-currency Support**: USD, VND, with conversion services.
- **Web-based CSV**: Import/export with date filtering and detailed validation.
- **Payment Module**: Licenses and subscriptions for various user plans.
- **Multi-user Collaboration**: Participant management with secure invitations.
- **Admin Dashboard**: 11 management interfaces for Super Administrators covering users, accounts, roles, categories, languages, licenses, settings, cache, translations, and transactions.
- **Transaction Photo Management**: Upload multiple receipt photos (up to 10 photos, 20MB each) with server-side optimization (resize, compress).
- **Audit Trail**: Tracks creation, updates, deletions, and photo changes on transactions, including who made changes and when.

# WordPress Headless CMS Integration

## Overview
The application includes a comprehensive WordPress headless CMS integration for content management. This allows the React frontend to fetch blog posts, pages, and custom content from an external WordPress site.

## Configuration
Set the following environment variables to enable WordPress integration:
- `WORDPRESS_API_URL`: WordPress site URL (e.g., https://your-wordpress-site.com)
- `WORDPRESS_USERNAME`: API authentication username
- `WORDPRESS_APPLICATION_PASSWORD`: WordPress Application Password (recommended)
- `WORDPRESS_TIMEOUT`: Request timeout in seconds (default: 30)
- `WORDPRESS_RETRIES`: Number of retry attempts (default: 3)

## Available Endpoints
- `GET /api/wordpress/posts` - List blog posts
- `GET /api/wordpress/pages` - List pages
- `GET /api/wordpress/categories` - List categories
- `GET /api/wordpress/search?q={query}` - Search content
- `GET /api/wordpress/status` - Check integration status

## Caching
Content is automatically cached with configurable TTL:
- Posts: 5 minutes
- Pages: 10 minutes
- Categories/Tags: 1 hour
- Clear cache via Admin: `POST /api/admin/wordpress/cache/clear`

## Files
- `app/Services/WordPressService.php` - WordPress API client with caching
- `app/Http/Controllers/Api/WordPressController.php` - API endpoints
- `config/wordpress.php` - Configuration settings

# Quick Start (Development Setup)

1. **Database Setup** (after PostgreSQL is available):
   ```bash
   php artisan migrate --seed
   ```

2. **Default Super Admin Credentials**:
   - Email: admin@kenfinly.com
   - Password: Admin@123

3. **JWT Secret** (already generated in .env):
   ```bash
   php artisan jwt:secret
   ```

4. **Frontend Build**:
   ```bash
   npm run build
   ```

5. **Start Server**:
   ```bash
   php -S 0.0.0.0:5000 server.php
   ```

## Database Seeders
All seeders are idempotent and can be run multiple times safely:
- `RoleSeeder` - Creates owner, editor, viewer roles
- `LanguageSeeder` - Creates English and Vietnamese languages with translations
- `CategorySeeder` - Creates default expense and income categories
- `SuperAdminSeeder` - Creates the super admin user

# Company Information

- **Company**: Getkenka Ltd
- **Tax Code**: 0318304909
- **Email**: purchasevn@getkenka.com
- **Phone**: +84 0941069969
- **Address**: 2nd Floor, 81 CMT8 Street, Ben Thanh Ward, Dist 1, HCMC

# External Dependencies

- **HTTP Client**: Guzzle 7.x
- **Error Handling (Dev)**: Whoops
- **CORS**: Fruitcake PHP-CORS
- **Date/Time**: Carbon
- **UUID Generation**: Ramsey UUID
- **Image Processing**: Intervention Image (for photo optimization)
- **Email Service**: SendGrid (via Replit integrations for email verification)
- **WordPress Integration**: Laravel HTTP Client for headless CMS content