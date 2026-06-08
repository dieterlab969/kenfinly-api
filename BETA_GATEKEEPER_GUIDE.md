# Beta Gatekeeper Middleware - Implementation Guide

## Overview

The **Beta Gatekeeper Middleware** protects your staging domain (`staging.kenfinly.com`) from public view and Google indexing while maintaining full access for build automation pipelines and health checks.

Unlike Nginx Basic Auth (which breaks CI/CD), this solution uses:
- **Secure HTTP-only cookies** for user persistence
- **Middleware pattern** for elegant route protection
- **Whitelist-based automation bypass** for API/webhooks/health checks

---

## Configuration

### 1. Environment Setup

Add to your `.env` file:
```env
STAGING_ACCESS_CODE=your-secure-code-here
```

**Example secure codes:**
- `beta-2024-staging-access`
- Use a strong, random string in production

### 2. Access the Beta Gate

Visit: `http://staging.kenfinly.com/beta-access`

Enter the code from `STAGING_ACCESS_CODE`. On success:
- A secure cookie (`kenfinly_beta_unlocked`) is set for 30 days
- User is redirected to `/dashboard`
- All subsequent requests bypass the gate

---

## Architecture

### File Structure

```
app/
├── Http/
│   ├── Middleware/
│   │   └── CheckBetaAccess.php          ← Gatekeeper middleware
│   └── Controllers/
│       └── BetaAccessController.php     ← Form handler
bootstrap/
└── app.php                              ← Middleware registration
resources/
└── views/
    └── beta-access.blade.php            ← Dark aesthetic UI
routes/
└── web.php                              ← Route definitions
```

---

## How It Works

### 1. Middleware Logic (`CheckBetaAccess`)

**When a user visits any route:**

```
Is path whitelisted (API/webhooks/health)? → YES → Allow through
                                           → NO
Does user have 'kenfinly_beta_unlocked' cookie? → YES → Allow through
                                                → NO → Redirect to /beta-access
```

**Whitelisted paths (automation bypass):**
- `/api/*` - All API endpoints
- `/health` - Health check endpoint
- `/api/status` - API status
- `/webhooks/*` - Webhook receivers (payments, etc.)
- Public routes (login, register, etc.)

### 2. Controller Logic (`BetaAccessController`)

**Flow:**
```
User submits code
    ↓
Validate against STAGING_ACCESS_CODE
    ↓
Match? → YES → Set secure cookie + redirect to /dashboard
     → NO → Show error, return to form
```

### 3. View (`beta-access.blade.php`)

- Clean, minimal dark UI (#09090b background)
- Password input field for code entry
- Error display for wrong codes
- Blocks Google indexing via `<meta name="robots" content="noindex, nofollow">`

---

## Routes

### Public Routes (No Gate)

```php
GET  /beta-access        → Show gate form
POST /beta-access/verify → Verify code & set cookie
```

### Protected Routes (Behind Gate)

```php
GET  /* → Redirects to /beta-access if no valid cookie
```

### Automation Bypass (Always Accessible)

```php
GET  /api/*                          → ✓ No gate
GET  /health                         → ✓ No gate
POST /api/webhooks/payment           → ✓ No gate
GET  /api/auth/login                 → ✓ No gate
POST /api/auth/register              → ✓ No gate
```

---

## Using in Your CI/CD Pipeline

### Health Checks (Jenkins, etc.)

```bash
# These will NOT be redirected by the gate
curl https://staging.kenfinly.com/health
curl https://staging.kenfinly.com/api/status

# Add to your health check script:
if curl -f https://staging.kenfinly.com/health; then
    echo "Staging is up and accessible"
else
    echo "Staging health check failed"
fi
```

### API Requests (No Cookie Needed)

```bash
# Direct API calls don't require the beta access code
curl -X POST https://staging.kenfinly.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'

# Webhook receivers are also bypassed
curl -X POST https://staging.kenfinly.com/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.success"}'
```

---

## Adding Custom Whitelisted Paths

Edit `app/Http/Middleware/CheckBetaAccess.php`:

```php
protected $except = [
    '/beta-access',
    '/health',
    '/api/status',
    '/api/*',
    '/webhooks/*',
    // Add custom paths here:
    '/special-automation-endpoint',
    '/monitoring/*',
];
```

---

## Cookie Details

**Cookie Name:** `kenfinly_beta_unlocked`

**Properties:**
- **Value:** `true` (simple flag)
- **Lifetime:** 30 days
- **HttpOnly:** Yes (cannot be accessed via JavaScript)
- **Secure:** Yes (HTTPS only in production)
- **SameSite:** Lax (CSRF protection)
- **Path:** `/` (domain-wide)

**Browser Storage:**
```
Name: kenfinly_beta_unlocked
Value: true
Expires: [30 days from now]
Domain: staging.kenfinly.com
Path: /
HttpOnly: ✓
Secure: ✓
SameSite: Lax
```

---

## Troubleshooting

### Issue: Health Checks Still Being Redirected

**Solution:** Ensure the path matches exactly in `$except` array:
```php
// ✓ Correct
'/api/status',
'/webhooks/*',

// ✗ Wrong
'/api/status/',  // trailing slash
'/api/status/*', // wrong wildcard pattern
```

### Issue: Cookie Not Persisting

**Solution:** Check browser cookie settings:
```bash
# In your browser's DevTools → Application → Cookies
# Look for 'kenfinly_beta_unlocked'

# If not showing:
1. Check secure flag in production (HTTPS required)
2. Verify domain matches exactly
3. Check SameSite policy allows cookies
```

### Issue: Users Locked Out After 30 Days

**Solution:** Add a `/refresh-beta-access` route to auto-refresh:
```php
Route::post('/refresh-beta-access', [BetaAccessController::class, 'refresh']);
```

---

## Security Considerations

1. **Strong Access Code:** Use a cryptographically random string
   ```bash
   # Generate: openssl rand -base64 32
   ```

2. **HTTPS Only:** Ensure `APP_DEBUG=false` and `HTTPS_ONLY=true` in production

3. **Rate Limiting:** Consider adding to `BetaAccessController`:
   ```php
   $this->middleware('throttle:5,1'); // 5 attempts per minute
   ```

4. **Logging:** Monitor failed access attempts:
   ```php
   Log::warning('Beta access attempt failed', ['ip' => $request->ip()]);
   ```

---

## Example: Adding Rate Limiting

Edit `app/Http/Controllers/BetaAccessController.php`:

```php
public function verify(Request $request): RedirectResponse
{
    // Add to controller constructor or here
    if (RateLimiter::tooManyAttempts('beta-access:' . $request->ip(), 5)) {
        return back()->withErrors(['code' => 'Too many attempts. Try again later.']);
    }

    RateLimiter::increment('beta-access:' . $request->ip(), 60);
    
    // ... rest of code
}
```

---

## Environment-Specific Behavior

| Environment | Gate Active | Cookie Set | API Bypass |
|---|---|---|---|
| **local** | Optional | Yes | Yes |
| **staging** | YES | Yes | Yes |
| **production** | NO | No | N/A |

To disable gate in development:
```php
// In .env
STAGING_ACCESS_CODE=   # Leave empty to disable
```

Then update middleware:
```php
public function handle(Request $request, Closure $next): Response
{
    if (!env('STAGING_ACCESS_CODE')) {
        return $next($request);
    }
    // ... rest of code
}
```

---

## Testing

### Manual Testing

```bash
# 1. Visit gate (should redirect)
curl -v https://staging.kenfinly.com/dashboard

# 2. Get code (submit form)
curl -X POST https://staging.kenfinly.com/beta-access/verify \
  -d "code=your-access-code"

# 3. Extract cookie from response and use
curl -b "kenfinly_beta_unlocked=true" https://staging.kenfinly.com/dashboard

# 4. Verify automation bypass works
curl https://staging.kenfinly.com/api/status
```

### Automated Testing (Pest/PHPUnit)

```php
test('beta access gate redirects without cookie', function () {
    $response = $this->get('/dashboard');
    $response->assertRedirect('/beta-access');
});

test('correct code sets cookie and redirects', function () {
    $response = $this->post('/beta-access/verify', [
        'code' => env('STAGING_ACCESS_CODE')
    ]);
    $response->assertRedirect('/dashboard');
    $response->assertCookie('kenfinly_beta_unlocked');
});

test('api endpoints bypass gate', function () {
    $response = $this->get('/api/status');
    $response->assertStatus(200);
});
```

---

## Next Steps

1. **Set a strong `STAGING_ACCESS_CODE` in production**
2. **Update CI/CD pipelines to use `/health` or `/api/status` endpoints**
3. **Test in staging:** Try accessing both protected and whitelisted routes
4. **Monitor:** Watch logs for unauthorized access attempts
5. **Document:** Share this guide with your team

---

## Support

For issues or questions:
- Check the **Troubleshooting** section above
- Review middleware whitelist paths in `CheckBetaAccess.php`
- Verify `.env` variables are set correctly
- Check Laravel logs: `storage/logs/laravel.log`
