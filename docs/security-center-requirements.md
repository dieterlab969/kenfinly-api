# Backend Development Requirements

# Security Center & Authentication Enhancements

**Version:** 1.0
**Status:** Approved for Development
**Target Stack:** Laravel 12 + ReactJS
**Module:** Settings → Security Center

---

# 1. Objective

Implement enterprise-grade security features within the Security Center module while maintaining full compatibility with the existing authentication architecture.

The project currently uses:

* Laravel 12 (Backend API)
* ReactJS (Frontend)
* JWT-Based Authentication

The implementation must extend the current authentication system and must not replace it with Sanctum, Passport, Auth0, Clerk, Firebase Auth, Keycloak, or any other identity provider unless explicitly approved.

The implementation must leverage mature, battle-tested libraries and security standards rather than custom-built cryptographic solutions.

---

# 2. Existing Authentication Architecture

## Current Authentication Model

```text
ReactJS
    ↓
JWT Access Token
    ↓
Laravel API
```

Authentication is currently performed using JSON Web Tokens (JWT).

All new security features must integrate with the existing JWT authentication flow.

---

# 3. Security Features

---

# 3.1 Biometric Authentication (Face ID / Touch ID)

## Objective

Allow users to authenticate using Face ID, Touch ID, Windows Hello, or equivalent platform biometrics.

---

## Security Principles

The backend must never store:

* Face images
* Fingerprint images
* Raw biometric templates
* Biometric metadata

All biometric data must remain on the user device.

Implementation must follow:

* WebAuthn
* FIDO2

standards.

---

## Registration Flow

### Backend Responsibilities

1. Generate WebAuthn registration challenge.

2. Return challenge to frontend.

3. Receive credential registration response.

4. Store:

    * User ID
    * Credential ID
    * Public Key
    * Device Name (optional)
    * Created Timestamp

5. Mark biometric authentication as enabled.

---

## Authentication Flow

### Backend Responsibilities

1. Generate login challenge.
2. Return challenge.
3. Receive signed assertion.
4. Verify signature using stored public key.
5. If verification succeeds:

    * Create authenticated session.
    * Issue JWT access token.
    * Log security event.

---

## Recommended Database Table

```sql
user_credentials
------------------------
id
user_id
credential_id
public_key
device_name
created_at
updated_at
```

---

# 3.2 Two-Factor Authentication (2FA)

## Objective

Provide an additional authentication layer using TOTP (Time-Based One-Time Password).

Implementation must comply with:

RFC 6238

---

## Supported Authenticator Applications

* Google Authenticator
* Microsoft Authenticator
* Authy
* 1Password

---

## Recommended Laravel Libraries

* pragmarx/google2fa
* bacon/bacon-qr-code

or equivalent actively maintained packages.

---

## Enable 2FA Flow

### Step 1: Generate Secret

Backend must:

1. Generate secure secret key.
2. Store secret temporarily.
3. Generate QR Code.
4. Return QR Code to frontend.

---

### Step 2: Verify Setup

Backend must:

1. Receive 6-digit OTP.
2. Verify OTP.
3. Enable 2FA upon successful validation.

Database update:

```sql
users.is_2fa_enabled = true
```

---

## Login Flow

1. Validate username/password.
2. Check 2FA status.
3. Request OTP if enabled.
4. Verify OTP.
5. Issue JWT access token.

---

# 3.3 Remember Me

## Objective

Allow users to remain authenticated across browser sessions without repeatedly entering credentials.

---

## Architecture

Implement:

```text
Access Token + Refresh Token
```

architecture.

---

## Access Token

Type:

```text
JWT
```

Expiration:

```text
15 - 60 minutes
```

Purpose:

```text
API Authorization
```

---

## Refresh Token

Purpose:

```text
Silent Re-authentication
```

Requirements:

* Random cryptographically secure token
* Stored in database
* Revocable
* Rotatable

---

## Refresh Token Storage

### Web

Must use secure cookies:

```text
HttpOnly
Secure
SameSite=Strict
```

---

## Remember Me Enabled

Refresh Token Expiration:

```text
30 days - 365 days
```

---

## Remember Me Disabled

Refresh Token Expiration:

```text
Session only
or
Maximum 8 hours
```

---

## Refresh Endpoint

### API Responsibilities

1. Validate refresh token.
2. Verify token status.
3. Verify expiration.
4. Rotate refresh token.
5. Issue new JWT access token.
6. Return updated authentication payload.

---

# 3.4 Change Password

## Objective

Allow users to securely update their account password.

---

## Password Storage

Passwords must never be stored as plain text.

Approved algorithms:

* Argon2id (Preferred)
* Bcrypt

Forbidden:

* MD5
* SHA1
* Unsalted Hashes

---

## Change Password Flow

1. User submits current password.
2. User submits new password.
3. Validate current password.
4. Hash new password.
5. Save new password hash.
6. Revoke all active sessions.
7. Revoke all refresh tokens.
8. Force re-authentication on all devices.

---

# 3.5 Change PIN

## Objective

Allow users to maintain a secondary security PIN.

---

## Security Requirements

PIN values must:

* Never be stored in plain text.
* Never be reversible.
* Never be logged.

Use:

* Argon2id
* Bcrypt

for hashing.

---

## Change PIN Flow

1. Validate existing PIN.
2. Validate new PIN policy.
3. Hash new PIN.
4. Update database.
5. Record audit log.

---

# 3.6 Brute Force Protection

## Objective

Prevent credential stuffing and brute-force attacks.

---

## Rate Limiting

Apply Laravel Rate Limiter.

Recommended policy:

```text
Maximum 5 failed attempts
within 10 minutes
```

---

## Lockout Policy

If threshold exceeded:

```text
Account lock:
15 - 30 minutes
```

or

```text
Require CAPTCHA verification
```

before further login attempts.

---

# 3.7 Device Management

## Objective

Allow users to view and manage active devices.

---

## Features

Users can:

* View active devices
* View last activity
* View login location (if available)
* Remove individual devices
* Sign out all devices

---

## Recommended Database Table

```sql
user_devices
------------------------
id
user_id
device_name
device_type
browser
ip_address
last_activity_at
refresh_token_id
created_at
updated_at
```

---

# 4. Security Audit Logging

All security-sensitive actions must be recorded.

---

## Events To Track

* Login Success
* Login Failure
* Logout
* Password Changed
* PIN Changed
* 2FA Enabled
* 2FA Disabled
* Biometric Enabled
* Biometric Disabled
* Device Removed
* Refresh Token Used
* Session Revoked

---

## Recommended Table

```sql
user_security_logs
------------------------
id
user_id
event_type
ip_address
user_agent
device_id
metadata
created_at
```

---

# 5. Database Components

Recommended tables:

```text
users

user_credentials

user_refresh_tokens

user_devices

user_security_logs
```

---

# 6. API Requirements

The implementation must provide APIs for:

```text
Enable Biometric Authentication
Disable Biometric Authentication

Generate 2FA Secret
Verify 2FA Setup
Disable 2FA

Change Password
Change PIN

Get Active Devices
Remove Device
Logout All Devices

Refresh Access Token
```

All APIs must require authentication unless explicitly designed for login or token refresh.

---

# 7. Non-Functional Requirements

## Secure Transport

All authentication APIs must require:

```text
HTTPS
TLS 1.2+
```

---

## Token Revocation

The system must support immediate token revocation when:

* Password changes
* Security settings change
* Device removed
* User logs out
* Account disabled

---

## Real-Time Security State Updates

Changes to:

* Remember Me
* Face ID / Biometrics
* 2FA

must be immediately persisted to the database.

---

# 8. Acceptance Criteria

## Password Security

* Passwords stored only as secure hashes.
* Plain text passwords must never exist.

---

## Session Revocation

After password change:

* Existing refresh tokens are revoked.
* Existing sessions are revoked.
* Other devices are logged out.

---

## 2FA

* QR Code generation works.
* OTP verification works.
* Invalid OTP is rejected.

---

## Biometric Authentication

* Credential registration works.
* Login verification works.
* Invalid signatures are rejected.

---

## Remember Me

* Access tokens expire normally.
* Refresh tokens renew sessions automatically.
* Expired access tokens do not break the application.

---

## Device Management

* User can view active devices.
* User can remove devices.
* User can revoke all devices.

---

# 9. Engineering Constraints

The implementation team must:

* Reuse the existing JWT authentication architecture.
* Avoid introducing a new authentication provider.
* Avoid replacing the current login flow.
* Avoid implementing custom cryptographic algorithms.
* Follow OWASP Authentication Best Practices.
* Follow OWASP ASVS recommendations.
* Maintain backward compatibility with existing users.

---

# End of Document
