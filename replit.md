# Overview

Kenfinly is a personal finance application built to help users understand, track, and improve their financial health. The application provides expense and income tracking with multi-account and multi-currency support, budget planning, analytics dashboards, goal-oriented savings plans, and smart notifications for spending insights.

The backend is powered by Laravel 12 (PHP 8.2+) providing a REST API, with a frontend built using Vite, Tailwind CSS 4.0, and React 19.2. The application is designed to be deployed with Docker support via Laravel Sail and includes comprehensive development tooling for code quality and testing.

# Recent Changes

## Financial Dashboard Implementation (November 6, 2025)

**Status**: Completed

Implemented a comprehensive financial dashboard with the following features:

### Backend API Endpoints
- **TransactionController**: Full CRUD operations for transactions with balance updates, receipt upload support, and dashboard data aggregation
- **AccountController**: Account management with transaction count tracking
- **CategoryController**: Category listing with hierarchical support (parent-child relationships)
- **Dashboard Endpoint**: `/api/dashboard` - Returns monthly summary, 7-day expense chart data, recent transactions, and account balances

### Frontend Components
- **Dashboard Page**: 
  - Total balance display with all accounts aggregated
  - Monthly summary cards showing income and expenses with color-coded indicators
  - Interactive 7-day expense bar chart using Recharts
  - Recent transactions list (6 most recent) with category icons and formatted amounts
  - Floating action button (FAB) for quick transaction entry
- **AddTransactionModal**: 
  - Toggle between Expense and Income types
  - Category selection with emoji icons
  - Account selection
  - Optional receipt upload with image preview
  - Date selection and notes field
  - Form validation with error handling

### Database Seeders
- **CategorySeeder**: Pre-populated categories with icons and colors for both expenses (Food/Drinks, Shopping, Transportation, Entertainment, Home, Family, Health/Sport, Pets, Other) and income (Salary, Business, Other)
- **AccountSeeder**: Default accounts for test users (Cash, Bank Account, Credit Card with realistic balances)

### UI/UX Features
- Blue gradient theme matching design reference
- Responsive layout optimized for mobile and desktop
- Real-time balance updates after transaction creation
- Category icons displayed as emojis
- Transaction type indicators (green for income, red for expenses)
- Loading states and error handling

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture

**Framework**: Laravel 12 (PHP 8.2+)
- **Rationale**: Laravel provides a robust, well-documented framework with built-in features for API development, authentication, queuing, and database management
- **Pros**: Extensive ecosystem, strong community support, built-in security features, excellent ORM (Eloquent), middleware support
- **Cons**: PHP-based (may be slower than compiled languages for high-performance scenarios)

**Authentication**: JWT (JSON Web Tokens) via tymon/jwt-auth
- **Rationale**: Stateless authentication suitable for REST APIs and mobile/SPA clients
- **Pros**: Scalable, no server-side session storage required, works well with SPAs
- **Cons**: Token revocation requires additional infrastructure

**API Design**: RESTful architecture
- **Rationale**: Standard approach for building scalable, stateless web services
- **Pros**: Well-understood patterns, cacheable, stateless
- **Cons**: May require multiple requests for complex operations

## Frontend Architecture

**Build Tool**: Vite 7.x
- **Rationale**: Modern, fast build tool with excellent HMR (Hot Module Replacement)
- **Pros**: Lightning-fast development server, optimized production builds, native ES modules support
- **Cons**: Relatively newer compared to Webpack

**Styling**: Tailwind CSS 4.0 with @tailwindcss/vite plugin
- **Rationale**: Utility-first CSS framework for rapid UI development
- **Pros**: Highly customizable, small production bundle sizes, consistent design system
- **Cons**: Initial learning curve, markup can become verbose

**JavaScript Framework**: React 19.2 with React Router
- **Rationale**: Modern component-based framework for building interactive UIs with client-side routing
- **Pros**: Component reusability, strong ecosystem, excellent developer experience, virtual DOM performance
- **Cons**: Learning curve for team members new to React
- **Implementation**: Separate Login (/login) and Registration (/register) pages with JWT authentication flow
- **State Management**: React Context API for authentication state and user session management

**Asset Pipeline**: Laravel Vite Plugin
- **Rationale**: Seamless integration between Laravel backend and Vite frontend tooling
- **Pros**: Auto-refresh on asset changes, optimized build process
- **Cons**: Requires both PHP and Node.js environments

## Data Storage

**Database**: PostgreSQL (Implemented as of 2025-10-28)
- **Rationale**: Relational database suitable for financial data with ACID compliance, chosen for superior features over MySQL
- **Pros**: Strong data integrity, transaction support, mature tooling, advanced features (JSON support, full-text search), better performance
- **Cons**: Schema migrations required for changes
- **Current State**: Deployed on Replit with native PostgreSQL database integration

**ORM**: Laravel Eloquent
- **Rationale**: Built-in Laravel ORM with Active Record pattern
- **Pros**: Intuitive syntax, relationship management, query builder
- **Cons**: Can generate inefficient queries if not used carefully

**Database Schema** (Core tables implemented):
- **users**: User account information with name, email, password
- **roles**: Role definitions (owner, editor, viewer)
- **user_roles**: Many-to-many pivot table linking users to roles
- **accounts**: Financial accounts with currency support
- **categories**: Transaction categories with hierarchical support
- **transactions**: Financial transactions with account and category references

## Development & Deployment

**Development Server**: Concurrent Laravel (port 5000) and Vite (port 5173)
- Laravel serves the backend API and routes all frontend requests to React
- Vite provides hot module replacement for React development
- Access the application through the Replit webview for proper HTTPS URL handling
- Note: The app must be accessed via the Replit webview URL (not localhost) for proper CORS handling between Laravel and Vite dev servers

**Containerization**: Docker via Laravel Sail
- **Rationale**: Consistent development environment across team members
- **Pros**: Eliminates "works on my machine" issues, includes all necessary services
- **Cons**: Resource overhead, requires Docker knowledge

**Package Management**:
- **PHP**: Composer
- **JavaScript**: npm

**Development Tooling**:
- **Code Quality**: Laravel Pint (PHP CS Fixer wrapper)
- **Testing**: PHPUnit for backend tests
- **Logging**: Laravel Pail for real-time log viewing
- **REPL**: Laravel Tinker for interactive debugging

**CI/CD**: GitHub Actions
- **Rationale**: Integrated with GitHub, free for public repositories
- **Pros**: Easy configuration, good integration with GitHub
- **Cons**: Limited to GitHub ecosystem

**Development Workflow**: Concurrent processes via npm-concurrently
- Runs Laravel server, queue workers, log monitoring, and Vite dev server simultaneously
- **Rationale**: Streamlined development experience with all services running
- **Pros**: Single command to start all services
- **Cons**: Higher resource usage during development

## External Dependencies

**HTTP Client**: Guzzle 7.x
- Purpose: Making HTTP requests to external services
- Use cases: Potential integrations with banking APIs, third-party financial data providers

**Error Handling**: Whoops (filp/whoops)
- Purpose: Beautiful error pages during development
- Use cases: Development debugging

**CORS**: Fruitcake PHP-CORS
- Purpose: Cross-Origin Resource Sharing support
- Use cases: Allowing frontend applications from different origins to access the API

**Testing & Development**:
- **Faker**: Generate fake data for testing and seeding
- **Mockery**: Mock objects in tests
- **Hamcrest**: Enhanced test assertions

**Utilities**:
- **Carbon**: DateTime manipulation library
- **Monolog**: Logging library
- **Ramsey UUID**: UUID generation for unique identifiers
- **Symfony Components**: Various Symfony components for console, error handling, HTTP foundation

**Cron Expression Parsing**: dragonmantank/cron-expression
- Purpose: Scheduled task management
- Use cases: Recurring transactions, budget resets, notification scheduling

**String Manipulation**: 
- doctrine/inflector: Pluralization and singularization
- doctrine/lexer: String parsing

**No Third-Party Integrations Currently**: The application does not yet integrate with external banking APIs, payment processors, or cloud storage services. These are planned for future releases as noted in the README (cloud synchronization planned for future).

# Authentication & Authorization System

**Implementation Date**: October 28, 2025  
**Status**: Fully Implemented and Tested

## Overview

The application uses JWT (JSON Web Token) authentication with role-based access control (RBAC) to secure API endpoints and manage user permissions.

## Authentication Flow

1. **Registration** (`POST /api/auth/register`)
   - Users register with name, email, and password
   - Passwords are hashed using bcrypt
   - New users are automatically assigned the "viewer" role
   - Returns JWT token and user information

2. **Login** (`POST /api/auth/login`)
   - Users authenticate with email and password
   - Returns JWT token (valid for 1 hour) and user information with roles

3. **Logout** (`POST /api/auth/logout`)
   - Invalidates the current JWT token
   - Requires valid authentication

4. **Token Refresh** (`POST /api/auth/refresh`)
   - Allows users to refresh their JWT token without re-logging in
   - Extends session without requiring password

5. **Get Current User** (`GET /api/auth/me`)
   - Returns authenticated user information with roles
   - Requires valid JWT token

## Authorization (Role-Based Access Control)

### Available Roles

1. **Owner** (`owner`)
   - Full access to all resources
   - Can manage users and assign roles
   - Can perform all CRUD operations
   - Assigned to primary account holders

2. **Editor** (`editor`)
   - Can create, edit, and delete own resources
   - Can view all resources
   - Limited administrative capabilities
   - Suitable for family members or collaborators

3. **Viewer** (`viewer`)
   - Read-only access to resources
   - Cannot modify any data
   - Default role for new users
   - Suitable for accountants, advisors

### Role Enforcement

**Middleware**: `EnsureUserHasRole`
- Applied to routes requiring specific role permissions
- Supports multiple roles (OR logic): user needs at least one of the specified roles
- Returns 403 Forbidden if user lacks required role
- Returns 401 Unauthorized if user is not authenticated

**Usage Example**:
```php
// Accessible by owners and editors
Route::middleware(['auth:api', 'role:owner,editor'])->group(function () {
    Route::get('/transactions', [TransactionController::class, 'index']);
});

// Accessible only by owners
Route::middleware(['auth:api', 'role:owner'])->group(function () {
    Route::delete('/account/{id}', [AccountController::class, 'destroy']);
});
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with configurable rounds (default: 12)
- **JWT Secret**: Securely stored in environment variables, never exposed in code
- **Token Expiration**: JWT tokens expire after 1 hour for security
- **Input Validation**: All endpoints validate input data before processing
- **Protected Routes**: All sensitive endpoints require valid JWT authentication
- **CORS Protection**: Configured to prevent unauthorized cross-origin requests
- **SQL Injection Prevention**: Eloquent ORM prevents SQL injection attacks

## Database Models

### User Model
- Implements `JWTSubject` interface for JWT authentication
- Has many-to-many relationship with roles
- Helper methods: `hasRole()`, `hasAnyRole()`, `assignRole()`, `removeRole()`
- Automatically hashes passwords on creation/update

### Role Model
- Defines available roles in the system
- Has many-to-many relationship with users
- Seeded with default roles: owner, editor, viewer

## API Endpoints

### Public Endpoints (No Authentication Required)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive JWT token

### Protected Endpoints (Require Authentication)
- `POST /api/auth/logout` - Logout current user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current authenticated user

### Test Users (Seeded)
- **Owner**: owner@example.com / password
- **Viewer**: viewer@example.com / password

## Configuration Files

- **Auth Guard**: `config/auth.php` - Defines JWT guard for API
- **JWT Config**: `config/jwt.php` - JWT package configuration
- **Middleware**: `bootstrap/app.php` - Registers role middleware
- **Routes**: `routes/api.php` - API route definitions

## Future Enhancements

- Password reset functionality via email
- Two-factor authentication (2FA)
- Refresh token rotation for enhanced security
- Role permissions for granular access control
- API rate limiting per role
- Audit logging for security-sensitive actions