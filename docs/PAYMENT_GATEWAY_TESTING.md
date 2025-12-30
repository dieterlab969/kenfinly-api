# Payment Gateway Management - Testing Guide

## Overview
This guide provides comprehensive testing instructions for the Payment Gateway Management system.

## Test Credentials
```
Admin Email: admin@kenfinly.com
Admin Password: Admin@123
```

## API Endpoints

### Authentication
All endpoints except `/api/auth/login` and `/api/auth/register` require Bearer token:
```
Authorization: Bearer {jwt_token}
```

### Base URL
```
http://localhost:5000/api/admin/payment-gateways
```

## Test Cases

### 1. List Payment Gateways
**Endpoint**: `GET /admin/payment-gateways`

**Request**:
```bash
curl -X GET http://localhost:5000/api/admin/payment-gateways \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected Response**: 200 OK
```json
{
  "data": [],
  "meta": {
    "total": 0,
    "per_page": 15,
    "current_page": 1
  }
}
```

### 2. Create Payment Gateway
**Endpoint**: `POST /admin/payment-gateways`

**Request**:
```bash
curl -X POST http://localhost:5000/api/admin/payment-gateways \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stripe",
    "slug": "stripe",
    "description": "Stripe payment processor",
    "environment": "sandbox"
  }'
```

**Expected Response**: 201 Created
```json
{
  "id": 1,
  "name": "Stripe",
  "slug": "stripe",
  "description": "Stripe payment processor",
  "is_active": false,
  "environment": "sandbox",
  "created_by": 1,
  "created_at": "2025-12-30T10:30:00Z"
}
```

### 3. Add Credentials
**Endpoint**: `POST /admin/payment-gateways/{id}/credentials`

**Request**:
```bash
curl -X POST http://localhost:5000/api/admin/payment-gateways/1/credentials \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "sandbox",
    "credential_key": "api_key",
    "credential_value": "sk_test_123456789",
    "is_test": true
  }'
```

**Expected Response**: 201 Created
```json
{
  "message": "Credential added successfully",
  "credential": {
    "id": 1,
    "environment": "sandbox",
    "credential_key": "api_key",
    "is_test": true,
    "verified": false
  }
}
```

### 4. Verify Credential
**Endpoint**: `POST /admin/payment-gateways/{id}/credentials/{credential_id}/verify`

**Request**:
```bash
curl -X POST http://localhost:5000/api/admin/payment-gateways/1/credentials/1/verify \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected Response**: 200 OK
```json
{
  "message": "Credential verified successfully",
  "credential": {
    "id": 1,
    "verified": true,
    "verified_at": "2025-12-30T10:35:00Z"
  }
}
```

### 5. Activate Gateway
**Endpoint**: `POST /admin/payment-gateways/{id}/toggle`

**Request**:
```bash
curl -X POST http://localhost:5000/api/admin/payment-gateways/1/toggle \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected Response**: 200 OK
```json
{
  "message": "Gateway activated successfully",
  "gateway": {
    "id": 1,
    "name": "Stripe",
    "is_active": true,
    "activated_at": "2025-12-30T10:40:00Z"
  }
}
```

### 6. Update Credential
**Endpoint**: `PUT /admin/payment-gateways/{id}/credentials/{credential_id}`

**Request**:
```bash
curl -X PUT http://localhost:5000/api/admin/payment-gateways/1/credentials/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "credential_value": "sk_test_987654321"
  }'
```

**Expected Response**: 200 OK
```json
{
  "message": "Credential updated successfully",
  "credential": {
    "id": 1,
    "environment": "sandbox",
    "credential_key": "api_key",
    "verified": false
  }
}
```

### 7. View Audit Logs
**Endpoint**: `GET /admin/payment-gateways/{id}/audit-logs`

**Request**:
```bash
curl -X GET http://localhost:5000/api/admin/payment-gateways/1/audit-logs \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected Response**: 200 OK
```json
{
  "data": [
    {
      "id": 1,
      "action": "create",
      "description": "Created payment gateway: Stripe",
      "user": {
        "id": 1,
        "name": "Admin",
        "email": "admin@kenfinly.com"
      },
      "created_at": "2025-12-30T10:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "per_page": 20,
    "current_page": 1
  }
}
```

### 8. Delete Credential
**Endpoint**: `DELETE /admin/payment-gateways/{id}/credentials/{credential_id}`

**Request**:
```bash
curl -X DELETE http://localhost:5000/api/admin/payment-gateways/1/credentials/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected Response**: 200 OK
```json
{
  "message": "Credential deleted successfully"
}
```

### 9. Delete Gateway
**Endpoint**: `DELETE /admin/payment-gateways/{id}`

**Request**:
```bash
curl -X DELETE http://localhost:5000/api/admin/payment-gateways/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected Response**: 200 OK
```json
{
  "message": "Gateway deleted successfully"
}
```

## Error Handling

### Invalid Request (Missing Required Fields)
**Response**: 422 Unprocessable Entity
```json
{
  "message": "The given data was invalid",
  "errors": {
    "name": ["The name field is required"]
  }
}
```

### Unauthorized (No Admin Role)
**Response**: 403 Forbidden
```json
{
  "message": "Unauthorized"
}
```

### Duplicate Credential
**Response**: 409 Conflict
```json
{
  "message": "Credential already exists"
}
```

## Security Features

### 1. Encryption
- All credentials are encrypted using Laravel's built-in encryption (AES-256-CBC)
- Encryption/decryption happens automatically through the `EncryptionService`
- Encrypted values are never returned in API responses

### 2. Access Control
- All payment gateway endpoints are protected with `auth:api` middleware
- Admin-only operations require `admin` middleware
- Only authenticated super admins can manage gateways

### 3. Audit Logging
- Every action is logged with:
  - User ID and IP address
  - Timestamp
  - Old and new values (for changes)
  - User agent
  - Action type (create, update, delete, credential_add, etc.)

## Testing Workflow

### Step 1: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kenfinly.com",
    "password": "Admin@123"
  }'
```

Save the returned `access_token` for subsequent requests.

### Step 2: Create Gateway
Create a test payment gateway (e.g., Stripe, PayPal)

### Step 3: Add Credentials
Add test API keys and secrets for sandbox environment

### Step 4: Verify Setup
Verify credentials are encrypted and stored securely

### Step 5: Toggle Gateway
Activate/deactivate the gateway and verify audit logs are created

### Step 6: Monitor Audit Trail
Check the audit logs to ensure all actions are tracked with proper context

## Database Verification

To verify data in the database:

```bash
# List all payment gateways
php artisan tinker
>>> PaymentGateway::all();

# Check encrypted credentials (values are encrypted)
>>> PaymentGatewayCredential::first()->encrypted_value;

# Decrypt credential value
>>> PaymentGatewayCredential::first()->getCredentialValue();

# View audit logs
>>> PaymentGatewayAuditLog::latest()->take(10)->get();
```

## Performance Notes

- Indexes are set on frequently queried columns:
  - `is_active` on payment_gateways
  - `environment` on both tables
  - `verified` on credentials
  - `action` on audit_logs
  - `created_at` on audit_logs for time-range queries

## Compliance

The system meets these requirements:
- ✅ AES-256-CBC encryption for all sensitive data
- ✅ Role-based access control (admin-only)
- ✅ Complete audit trail with change tracking
- ✅ Environment-specific configuration (sandbox/production)
- ✅ Credential verification workflow
- ✅ Activity logging with IP and user agent
