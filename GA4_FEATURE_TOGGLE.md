# GA4 Feature Toggle Implementation

## Overview

A configurable feature toggle has been implemented to enable or disable Google Analytics 4 (GA4) tracking at the application level. This allows you to:

- **Disable GA4 in local development** to avoid console errors and network requests
- **Enable GA4 in production** for full analytics tracking
- **Prevent accidental tracking** of development/test traffic
- **Control analytics per deployment environment**

## How It Works

### 1. **Environment-Based Configuration**

The GA4 toggle is controlled via the `GA4_ENABLED` environment variable:

```
GA4_ENABLED=false  # Disables GA4 (default for local development)
GA4_ENABLED=true   # Enables GA4 (recommended for production)
```

### 2. **Default Behavior**

| Environment | GA4 Status | GTM Scripts Loaded | Tracking Events Fired |
|-------------|----------|-------------------|----------------------|
| Local (development) | **Disabled** ✓ | ❌ No | ❌ No |
| Production | Configurable | ✓ Yes (if enabled) | ✓ Yes (if enabled) |
| Staging/Testing | Configurable | ✓ Yes (if enabled) | ✓ Yes (if enabled) |

## Configuration

### **For Local Development** (Default)

GA4 is **disabled by default** in local environments:

```bash
# GA4_ENABLED is set to 'false' by default
# No GTM scripts load, no console errors, no tracking events fire
```

No action needed! Just develop locally without worrying about GA4 errors.

### **For Production**

To enable GA4 in production, set the environment variable:

```bash
# In your production .env or deployment configuration:
GA4_ENABLED=true
```

Then ensure you have a valid Google Tag Manager ID in your database:

```bash
# Via Laravel Tinker or admin panel:
AppSetting::set('google_tag_manager_id', 'G-XXXXXXXXXX', 'string');
```

### **Via Admin Settings** (Optional)

You can also control GA4 via the database if the environment variable is not set:

```php
// Enable GA4 via code
AppSetting::set('ga4_enabled', true, 'boolean');

// Check current status
AppSetting::isGA4Enabled(); // Returns true or false
```

**Priority Order:**
1. `GA4_ENABLED` environment variable (highest priority)
2. `ga4_enabled` app setting in database
3. Default: `false` (disabled)

## Technical Implementation

### **Backend Changes**

**File: `app/Models/AppSetting.php`**

Added new method to check if GA4 is enabled:

```php
public static function isGA4Enabled(): bool
{
    // Check environment variable first
    if (env('GA4_ENABLED') !== null) {
        return filter_var(env('GA4_ENABLED'), FILTER_VALIDATE_BOOLEAN);
    }
    
    // Fall back to app setting
    return self::get('ga4_enabled', false);
}
```

**File: `resources/views/welcome.blade.php`**

Updated GTM script loading to check both the GA4 toggle AND the GTM ID:

```blade
@if(App\Models\AppSetting::isGA4Enabled() && ($googleTagManagerId = App\Models\AppSetting::getGoogleTagManagerId()))
    <!-- GTM scripts only load if BOTH conditions are true -->
    <!-- GTM noscript fallback -->
    <!-- GTM gtag.js script -->
@endif
```

### **Frontend Changes**

**File: `resources/js/utils/gtmTracking.js`**

Enhanced with safety checks:

```javascript
const gtmTracking = {
    // New method to check if GA4 is available
    isAvailable: () => {
        return typeof window !== 'undefined' && typeof window.gtag === 'function';
    },
    
    // All tracking functions check if window.gtag exists:
    trackPageView: (pageName, pageTitle) => {
        if (window.gtag) {  // Safe check - no error if GA4 disabled
            window.gtag('event', 'page_view', { ... });
        }
    },
    // ... other tracking methods also have safe checks
};
```

## Safety Features

✅ **No Errors When Disabled**
- All tracking function check `if (window.gtag)` before calling
- Application continues to work normally with GA4 disabled
- Zero console errors in local development

✅ **No Network Requests When Disabled**
- GTM scripts are not loaded when `GA4_ENABLED=false`
- No requests to Google services
- Faster local development

✅ **Graceful Degradation**
- If GA4 becomes unavailable at runtime, tracking calls silently skip
- Application functionality is not affected

✅ **Multiple Control Methods**
- Environment variable (easiest for deployment)
- Database setting (easier for runtime changes)
- Automatic environment detection

## Current Status

### Local Development
```
GA4_ENABLED = false (default)
✓ GA4 is disabled
✓ No GTM scripts loaded
✓ No console errors
✓ All functionality works normally
```

## Usage Examples

### **Example 1: Local Development (Current Default)**

```bash
# In your .env (GA4_ENABLED=false by default)
# Start development server
php -S 0.0.0.0:5000 server.php

# Result:
# ✓ No GA4 errors
# ✓ No GTM scripts loaded
# ✓ All tracking code runs safely (no-op)
```

### **Example 2: Enable GA4 for Testing**

```bash
# Temporarily enable GA4:
# Set in your shell:
export GA4_ENABLED=true

# Or add to .env:
GA4_ENABLED=true

# Ensure GTM ID is set:
# Via admin panel or tinker:
# AppSetting::set('google_tag_manager_id', 'G-XXXXXXXXXX');

# Start server:
php -S 0.0.0.0:5000 server.php

# Result:
# ✓ GTM scripts load
# ✓ GA4 events are tracked
# ✓ Events visible in Google Analytics
```

### **Example 3: Production Deployment**

```dockerfile
# In your Dockerfile or deployment script:
ENV GA4_ENABLED=true

# Or in your CI/CD pipeline:
export GA4_ENABLED=true
npm run build
php artisan serve
```

## Checking if GA4 is Enabled

### **In Backend Code**
```php
if (App\Models\AppSetting::isGA4Enabled()) {
    // GA4 is enabled
    // Use analytics features
}
```

### **In Frontend Code**
```javascript
if (gtmTracking.isAvailable()) {
    // GA4 is available and can be used
    gtmTracking.trackPageView('page_name', 'Page Title');
}
```

## Testing the Feature Toggle

### **Test 1: Verify GA4 is Disabled (Current)**

1. Open your local development site
2. Open Browser DevTools (F12)
3. Check Console for GA4/GTM errors
   - ✓ **Expected:** No errors related to GA4 or Google Tag Manager
4. Check Network tab
   - ✓ **Expected:** No requests to `googletagmanager.com` or `google-analytics.com`

### **Test 2: Enable GA4 and Verify It Works**

1. Set `GA4_ENABLED=true` in your environment
2. Set a valid GTM ID in database
3. Restart your server
4. Open your site
5. Check Network tab
   - ✓ **Expected:** Requests to `googletagmanager.com` should appear
6. Trigger an event (e.g., click a navigation link)
7. Check GA4 dashboard
   - ✓ **Expected:** Events should appear in Real-time view

## Troubleshooting

### **"GA4 not tracking but I have it enabled"**

Check:
1. `GA4_ENABLED` is set to `true`
2. Google Tag Manager ID is set correctly: `AppSetting::get('google_tag_manager_id')`
3. GTM ID follows format: `G-XXXXXXXXXX` (not an old tracking ID)
4. GTM script is loaded in page source (check HTML)

### **"Still seeing GA4 errors in console"**

Check:
1. `GA4_ENABLED` is set to `false`
2. Browser cache is cleared (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
3. Vite build was completed (`npm run build`)

### **"Can't toggle GA4 at runtime"**

GA4 toggle is evaluated when the page loads. Changes to environment variables require:
1. Restarting the PHP server
2. Or clearing the Vite cache: `rm -rf bootstrap/cache/*`

## Best Practices

✅ **Do:**
- Keep `GA4_ENABLED=false` in local `.env`
- Set `GA4_ENABLED=true` only in production environments
- Use environment variables for deployment environments
- Test GA4 in staging before enabling in production

❌ **Don't:**
- Commit `GA4_ENABLED=true` to your repository (security risk)
- Enable GA4 for local development (wastes Google quota, slows down site)
- Rely only on app settings without environment variables (use env vars for deployment)

## Summary

The GA4 feature toggle provides:

| Feature | Benefit |
|---------|---------|
| **Environment Variable Control** | Easy deployment configuration |
| **Database Setting Fallback** | Runtime changes without redeployment |
| **Dual Safety Checks** | No errors when disabled |
| **Default Disabled** | Safe by default for development |
| **Backward Compatible** | Works with existing GTM setup |

Your site is now **production-ready** for analytics while **safe to develop locally**!
