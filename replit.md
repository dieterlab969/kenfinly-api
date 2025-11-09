# Overview

Kenfinly is a personal finance application designed to help users track, understand, and improve their financial health. It offers features such as expense and income tracking with multi-account and multi-currency support, budget planning, analytical dashboards, goal-oriented savings plans, and smart spending notifications. The project aims to provide a comprehensive and intuitive tool for personal financial management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend

The backend is built with Laravel 12 (PHP 8.2+) and provides a REST API. Key architectural decisions include:
- **Authentication**: JWT (JSON Web Tokens) via `tymon/jwt-auth` for stateless API authentication.
- **API Design**: RESTful architecture for web services.
- **Database**: PostgreSQL for robust data integrity and advanced features. Eloquent ORM is used for database interaction.
- **Authorization**: Role-Based Access Control (RBAC) with 'owner', 'editor', and 'viewer' roles enforced via custom middleware.
- **Core Models**: `users`, `roles`, `user_roles`, `accounts`, `categories`, and `transactions` tables are implemented.
- **Features**: Multi-currency support (USD, VND) with conversion services, web-based CSV import/export with date filtering and detailed validation, payment module with licenses and subscriptions, role-based access control with multi-user collaboration, participant management with secure invitations, and comprehensive API endpoints for dashboard data, transactions, accounts, categories, and analytics.

## Frontend

The frontend is a Single Page Application (SPA) built using React 19.2, Vite 7.x, and Tailwind CSS 4.0.
- **Build Tool**: Vite for fast development and optimized production builds.
- **Styling**: Tailwind CSS for utility-first, rapid UI development.
- **Framework**: React with React Router for component-based UIs and client-side routing.
- **State Management**: React Context API for authentication and user session.
- **UI/UX**: Responsive design with a blue gradient theme, interactive dashboards (Recharts), and modals for transaction entry with real-time updates.
- **Multilanguage**: Complete English and Vietnamese support with shared translation manifest architecture.

## Multilanguage System

Kenfinly implements a production-ready multilanguage system supporting English and Vietnamese:

**Architecture:**
- **Shared Manifest**: `resources/lang/translations.json` serves as single source of truth for all translations (68+ keys)
- **Backend**: LanguageSeeder reads from shared manifest to populate database
- **Frontend**: TranslationContext imports manifest for comprehensive fallback translations
- **Graceful Degradation**: App continues working offline using manifest data when translation API is unavailable

**Testing Offline Mode:**
To verify the multilanguage system works correctly when the backend is unavailable:
1. Open browser developer tools (F12)
2. Go to Network tab and enable "Offline" mode
3. Refresh the application
4. Verify: App loads successfully with English/Vietnamese UI (no raw translation keys visible)
5. Verify: Yellow "Offline Mode" banner appears in top-right corner
6. Verify: All UI text displays properly in the selected language
7. Re-enable network and click "Retry" button to restore API connectivity

## CSV Import/Export System

Kenfinly provides production-ready web-based CSV import and export functionality:

**CSV Export:**
- Date range filtering (start_date, end_date) for targeted exports
- Account-specific or all-account export options
- Role-based access (owners and participants can export)
- Proper CSV formatting with field escaping for commas, quotes, and newlines
- Downloadable files with timestamp-based naming

**CSV Import:**
- File validation (10MB limit, CSV/TXT MIME types)
- CSV header validation enforcing correct column structure
- Multiple date format support (Y-m-d, m/d/Y, d/m/Y, etc.)
- Row-by-row validation with detailed error reporting
- Import summary with success/failed counts and specific error messages
- Database transaction support with automatic rollback on errors
- Role-based access (owners and editor participants can import)
- Automatic category creation for new categories

**API Endpoints:**
- `GET /api/csv/export` - Export transactions with optional filtering
- `POST /api/csv/import` - Import transactions from CSV file

**Sample Files:** `storage/app/sample_transactions_valid.csv` and `storage/app/sample_transactions_invalid.csv` for testing

## Development & Deployment

- **Development Environment**: Dockerized using Laravel Sail for consistency.
- **Concurrency**: `npm-concurrently` runs Laravel server, Vite dev server, and other services simultaneously.
- **Tooling**: Composer (PHP), npm (JS), Laravel Pint (code quality), PHPUnit (testing), Laravel Pail (logging), Laravel Tinker (REPL).
- **CI/CD**: GitHub Actions.

# External Dependencies

- **HTTP Client**: Guzzle 7.x (for external API requests).
- **Error Handling**: Whoops (development error pages).
- **CORS**: Fruitcake PHP-CORS (Cross-Origin Resource Sharing).
- **Testing & Development**: Faker, Mockery, Hamcrest.
- **Utilities**: Carbon (date/time), Monolog (logging), Ramsey UUID (UUID generation), Symfony Components.
- **Cron Expression Parsing**: `dragonmantank/cron-expression`.
- **String Manipulation**: `doctrine/inflector`, `doctrine/lexer`.
- **Note**: No third-party financial integrations (e.g., banking APIs, payment processors) are currently implemented.