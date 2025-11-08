# Changelog

All notable changes to the Personal Finance Application (Kenfinly) are documented in this file.

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
