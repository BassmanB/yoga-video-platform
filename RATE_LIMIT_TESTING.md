# Rate Limit Testing Guide

## Problem

Supabase has rate limits to prevent abuse. During testing, you might hit these limits:
- **Email sends:** 4 emails per hour per email address (default)
- **API requests:** Various limits per IP address

Error message: "Za dużo prób logowania. Spróbuj ponownie za kilka minut."

## Solutions

### Option 1: Disable Rate Limiting in Supabase Dashboard (Recommended for Testing)

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/ckeeneggpukpwgkjcpnc/auth/rate-limits
   ```

2. **Adjust Rate Limits:**
   - Click on "Rate Limits" in the Authentication section
   - Find "Email send rate limit"
   - Increase to a higher number (e.g., 100 per hour)
   - Or temporarily disable it for testing

3. **Save Changes**

4. **Wait 1-2 minutes** for changes to take effect

### Option 2: Use Different Email Addresses

The rate limit is per email address, so you can test with different emails:
- `test1@example.com`
- `test2@example.com`
- `test3@example.com`
- etc.

**Note:** Use a real email address you have access to, or use email aliases:
- Gmail: `youremail+test1@gmail.com`, `youremail+test2@gmail.com`
- Outlook: `youremail+test1@outlook.com`

### Option 3: Wait for Rate Limit to Reset

Default rate limits reset after:
- **1 hour** for email send limits
- **15 minutes** for some API limits

Just wait and try again later.

### Option 4: Use Different IP Address (Advanced)

If the limit is IP-based:
- Switch to mobile hotspot
- Use a VPN
- Restart your router to get a new IP

## How to Check Current Rate Limits

1. Go to Supabase Dashboard
2. Navigate to: **Authentication > Rate Limits**
3. You'll see settings like:
   ```
   Email send rate: 4 per hour
   SMS send rate: 4 per hour
   Password reset rate: 4 per hour
   ```

## Recommended Settings for Development

For local development, increase these limits:

| Setting | Production | Development |
|---------|-----------|-------------|
| Email send rate | 4/hour | 100/hour |
| Password reset rate | 4/hour | 50/hour |
| API request rate | Default | Increased |

**Remember to restore production limits before deploying!**

## How to Test Without Hitting Limits

### 1. Use Email Templates Testing

Instead of sending real emails during development:

1. Check Supabase Dashboard > Authentication > Users
2. After requesting a magic link, you can see the token there
3. Manually construct the callback URL:
   ```
   http://localhost:3001/auth/callback?token_hash=TOKEN_HERE&type=magiclink
   ```

### 2. Mock Authentication in Development

For rapid testing, you can temporarily bypass email verification:

**Create a development bypass** (only for local testing):

```typescript
// In LoginForm.tsx - ONLY FOR TESTING, REMOVE BEFORE PRODUCTION
if (import.meta.env.DEV && data.email.includes('+devtest@')) {
  // Skip email, directly set session
  // This is for testing only
  toast.success("DEV MODE: Bypassing email");
  window.location.href = "/";
  return;
}
```

**⚠️ WARNING:** Remove this code before deploying to production!

## Current Issue: How to Continue Testing Now

Since you've hit the rate limit, here's what to do:

### Quick Solution:

1. **Use a different email address:**
   - If you were testing with `test@example.com`
   - Try `test2@example.com` or use email aliases

2. **Or increase rate limits in Supabase:**
   ```
   Dashboard → Authentication → Rate Limits → Increase Email Send Rate
   ```

3. **Or wait 60 minutes** for the rate limit to reset

### Verify Rate Limit Settings

Run this to check your current configuration:

```bash
# Log into Supabase CLI
npx supabase login

# Check project settings
npx supabase projects list
```

## Alternative: Test with Console Token

You can test the callback functionality directly:

1. **Get a token from Supabase Dashboard:**
   - Go to: Authentication > Users
   - After requesting a magic link, check the logs
   - Copy the token_hash

2. **Manually visit callback URL:**
   ```
   http://localhost:3001/auth/callback?token_hash=YOUR_TOKEN&type=magiclink
   ```

3. **This bypasses the email step** but tests the callback logic

## Future: Implement Development Mode

For easier testing, you could implement a development-only bypass:

**File:** `src/pages/auth/dev-login.astro` (only for local dev)

```astro
---
// Only available in development
if (!import.meta.env.DEV) {
  return Astro.redirect("/");
}

// Create session directly without email
const testEmail = Astro.url.searchParams.get("email");
if (testEmail) {
  // Development-only: Create session directly
  // Implementation here
}
---

<Layout title="Dev Login">
  <form>
    <input type="email" name="email" placeholder="test@example.com" />
    <button>Instant Login (Dev Only)</button>
  </form>
</Layout>
```

## Troubleshooting

### Rate limit still active after increasing?

1. Wait 2-3 minutes for changes to propagate
2. Clear browser cache/cookies
3. Try incognito/private window
4. Check Supabase status page for any issues

### Can't find rate limit settings?

- Older Supabase projects: Settings might be under Project Settings > API
- Free tier: Some rate limit controls might not be available
- Solution: Upgrade to Pro tier for full control

### Rate limit from IP address?

If Supabase is blocking your IP:
1. Check Supabase Dashboard for IP blocks
2. Restart your network to get new IP
3. Contact Supabase support if persistent

## Summary

**Right now, to continue testing:**

1. ✅ **Easiest:** Use a different email (or email alias)
2. ✅ **Best:** Go to Supabase Dashboard and increase rate limits
3. ⏱️ **Patient:** Wait 60 minutes

**Dashboard link:**
```
https://supabase.com/dashboard/project/ckeeneggpukpwgkjcpnc/auth/rate-limits
```

After increasing the limit, you should be able to test freely!
