# Overview

Kenfinly is a personal finance application built to help users understand, track, and improve their financial health. The application provides expense and income tracking with multi-account and multi-currency support, budget planning, analytics dashboards, goal-oriented savings plans, and smart notifications for spending insights.

The backend is powered by Laravel 12 (PHP 8.2+) providing a REST API, with a frontend built using Vite, Tailwind CSS 4.0, and basic JavaScript. The application is designed to be deployed with Docker support via Laravel Sail and includes comprehensive development tooling for code quality and testing.

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

**JavaScript**: Vanilla JavaScript with Axios for HTTP requests
- **Rationale**: Lightweight approach suitable for current requirements
- **Pros**: No framework overhead, simple to maintain
- **Cons**: May need migration to React/Vue for complex UI requirements (as noted in README)

**Asset Pipeline**: Laravel Vite Plugin
- **Rationale**: Seamless integration between Laravel backend and Vite frontend tooling
- **Pros**: Auto-refresh on asset changes, optimized build process
- **Cons**: Requires both PHP and Node.js environments

## Data Storage

**Database**: MySQL or PostgreSQL (not yet finalized)
- **Rationale**: Relational database suitable for financial data with ACID compliance
- **Pros**: Strong data integrity, transaction support, mature tooling
- **Cons**: Schema migrations required for changes
- **Note**: The specific database will be selected based on deployment needs and scalability requirements

**ORM**: Laravel Eloquent
- **Rationale**: Built-in Laravel ORM with Active Record pattern
- **Pros**: Intuitive syntax, relationship management, query builder
- **Cons**: Can generate inefficient queries if not used carefully

## Development & Deployment

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