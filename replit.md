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
- **Features**: Multi-currency support (USD, VND) with conversion services, CSV import for bulk transactions, and comprehensive API endpoints for dashboard data, transactions, accounts, and categories.

## Frontend

The frontend is a Single Page Application (SPA) built using React 19.2, Vite 7.x, and Tailwind CSS 4.0.
- **Build Tool**: Vite for fast development and optimized production builds.
- **Styling**: Tailwind CSS for utility-first, rapid UI development.
- **Framework**: React with React Router for component-based UIs and client-side routing.
- **State Management**: React Context API for authentication and user session.
- **UI/UX**: Responsive design with a blue gradient theme, interactive dashboards (Recharts), and modals for transaction entry with real-time updates.

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