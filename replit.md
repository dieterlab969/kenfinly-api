# Overview

Kenfinly is a personal finance application designed to help users track, understand, and improve their financial health. It offers features such as multi-account and multi-currency expense/income tracking, budget planning, analytical dashboards, goal-oriented savings, and smart spending notifications. The project aims to provide a comprehensive and intuitive tool for personal financial management with strong market potential for users seeking robust financial control.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Design

The frontend is a Single Page Application (SPA) built with React 19.2, Vite 7.x, and Tailwind CSS 4.0. It features a responsive design with a blue gradient theme, interactive dashboards using Recharts, and modals for transaction entry with real-time updates. A dedicated admin UI with a dark sidebar navigation and consistent layout is implemented for super administrators. The application also supports multilanguage functionality, specifically English and Vietnamese, with a shared translation manifest architecture ensuring graceful degradation in offline mode.

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

# External Dependencies

- **HTTP Client**: Guzzle 7.x
- **Error Handling (Dev)**: Whoops
- **CORS**: Fruitcake PHP-CORS
- **Date/Time**: Carbon
- **UUID Generation**: Ramsey UUID
- **Image Processing**: Intervention Image (for photo optimization)
- **Email Service**: SendGrid (via Replit integrations for email verification)