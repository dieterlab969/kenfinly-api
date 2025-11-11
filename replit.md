# Overview

Kenfinly is a personal finance application designed to help users track, understand, and improve their financial health. It offers features such as expense and income tracking with multi-account and multi-currency support, budget planning, analytical dashboards, goal-oriented savings plans, and smart spending notifications. The project aims to provide a comprehensive and intuitive tool for personal financial management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
- **Design**: Responsive design with a blue gradient theme, interactive dashboards, and modals for transaction entry.
- **Components**: Modals for transaction details with tabs (Details, Photos, History), photo carousel, and drag-and-drop photo upload.
- **Multilanguage**: Complete English and Vietnamese support with a shared translation manifest architecture, ensuring graceful degradation in offline mode.
- **Forms**: Google reCAPTCHA v3 for invisible bot protection on login and registration forms, with a command-line toggle for management.
- **Email Templates**: Mobile-friendly, responsive design for verification and confirmation emails, with clear calls-to-action and support information.
- **User Education**: Dedicated FAQ and announcement components for the email verification process.

## Technical Implementations
- **Backend**: Laravel 12 (PHP 8.2+) REST API.
  - **Authentication**: JWT via `tymon/jwt-auth`.
  - **Database**: PostgreSQL with Eloquent ORM.
  - **Authorization**: Role-Based Access Control (RBAC) with 'owner', 'editor', and 'viewer' roles, enforced via custom middleware and Laravel Policies.
  - **Core Models**: `users`, `roles`, `user_roles`, `accounts`, `categories`, `transactions`.
  - **Features**: Multi-currency support (USD, VND), web-based CSV import/export with validation and error reporting, payment module, participant management with secure invitations, comprehensive API endpoints.
  - **Image Processing**: Server-side image optimization (resize, compress) for uploaded photos via Intervention Image.
  - **Email Verification**: Two-step email verification system with time-limited tokens, rate limiting, attempt tracking, and secure email delivery (SendGrid). Includes a seamless transition plan for existing users.
  - **Change History**: Audit trail for transaction changes, logging creation, updates, deletions, and photo management with detailed diffs.
  - **Configuration**: Database-driven configuration for reCAPTCHA toggle via `app_settings` table.
- **Frontend**: Single Page Application (SPA) using React 19.2, Vite 7.x, and Tailwind CSS 4.0.
  - **Build Tool**: Vite.
  - **Styling**: Tailwind CSS.
  - **Framework**: React with React Router.
  - **State Management**: React Context API for authentication and user session.
  - **Analytics**: Interactive dashboards powered by Recharts.

## System Design Choices
- **Development Environment**: Dockerized using Laravel Sail.
- **Concurrency**: `npm-concurrently` for running multiple services.
- **Code Quality**: Laravel Pint.
- **Testing**: PHPUnit.
- **Logging**: Laravel Pail.
- **REPL**: Laravel Tinker.
- **CI/CD**: GitHub Actions.
- **Test Users**: Pre-configured owner, editor, and viewer accounts for testing permissions.

# External Dependencies

- **HTTP Client**: Guzzle 7.x.
- **Error Handling (Dev)**: Whoops.
- **CORS**: Fruitcake PHP-CORS.
- **Authentication**: `tymon/jwt-auth`.
- **Image Processing**: Intervention Image.
- **Email Delivery**: SendGrid (via Replit integrations).
- **Bot Protection**: Google reCAPTCHA v3.
- **Development/Testing**: Faker, Mockery, Hamcrest.
- **Utilities**: Carbon, Monolog, Ramsey UUID, Symfony Components, `dragonmantank/cron-expression`, `doctrine/inflector`, `doctrine/lexer`.