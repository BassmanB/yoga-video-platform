# Magic Link Issue - Diagnosis and Fix

## Your Issue

✅ **Email is being sent correctly** with magic link
❌ **When clicking the link**, you get an error message that the link is not correct

## Root Cause

Based on your terminal logs, when you click the magic link, the callback receives:

```
=== Auth Callback Debug ===
1. Token hash: missing
2. Type: null
3. Redirect: /
Missing token_hash or type parameter
```

This means **Supabase is not including the authentication parameters** in the redirect URL.

## Why This Happens

### Most Common Cause: Redirect URL Misconfiguration

Supabase Cloud requires you to **whitelist** the exact URLs where users can be redirected after authentication. If your callback URL is not in this whitelist, Supabase will redirect to a default URL **without** the authentication tokens.

## The Fix

### ⚠️ CRITICAL: Configure Supabase Dashboard

You **MUST** configure your Supabase project dashboard. This is not optional!

1. **Go to**: https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to**: Authentication → URL Configuration
4. **Configure these settings**:

#### Site URL
Set this to your app's URL:
```
http://localhost:3001
```

**Note**: Check your terminal to see what port your app is actually running on! It might be 4321 or another port.

#### Redirect URLs
Add **ALL** of these (click "+ Add URL" for each):
```
http://localhost:3001/auth/callback
http://localhost:4321/auth/callback
http://127.0.0.1:3001/auth/callback
http://127.0.0.1:4321/auth/callback
```

**Why multiple URLs?**
- Different ports (3001 vs 4321)
- Different formats (localhost vs 127.0.0.1)
- Better to have extras than miss the right one!

5. **Click "Save"**

### Verify Your Port Number

Check your terminal where the dev server is running. Look for a line like:

```
Local: http://localhost:3001/
```

or

```
Local: http://localhost:4321/
```

**This port number MUST match** what you configured in Supabase!

## Testing After Configuration

### Step 1: Request New Magic Link

1. Go to your login page
2. Enter your email
3. Click "Send magic link"
4. Wait for email (check spam folder too!)

### Step 2: Click the Magic Link

When you click it, watch what happens:

**Expected behavior:**
- Browser opens to: `http://localhost:3001/auth/callback?token_hash=xxxxx&type=magiclink`
- You get redirected to home page
- You're logged in!

**If still broken:**
- Browser opens to: `http://localhost:3001/auth/callback` (no parameters!)
- You see error page
- Check the logs below

### Step 3: Check Terminal Logs

After clicking the magic link, your terminal should show:

**✅ Good (working):**
```
=== Auth Callback Debug ===
1. All URL params: { token_hash: 'abc123...', type: 'magiclink' }
2. Token hash: present
3. Token (old format): missing
4. Type: magiclink
5. Redirect: /
6. Calling verifyOtp...
7. Using token_hash format
8. Verification response: { hasData: true, hasSession: true, hasUser: true, error: undefined }
9. Success! Redirecting to: /
```

**❌ Bad (still broken):**
```
=== Auth Callback Debug ===
1. All URL params: {}
2. Token hash: missing
3. Token (old format): missing
4. Type: null
5. Redirect: /
Missing token parameter. Received params: {}
```

## If Still Not Working

### Check 1: Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to find these:**
1. Supabase Dashboard → Project Settings → API
2. Copy "Project URL" → `PUBLIC_SUPABASE_URL`
3. Copy "anon public" key → `PUBLIC_SUPABASE_ANON_KEY`

### Check 2: Email Template

1. Supabase Dashboard → Authentication → Email Templates
2. Click "Magic Link"
3. Verify it contains: `{{ .ConfirmationURL }}`

This variable generates the magic link. If it's missing or wrong, the link won't work.

### Check 3: Rate Limiting

Supabase free tier has strict rate limits:
- **2 emails per hour** per email address
- If you've been testing a lot, you might be rate-limited
- Wait 1 hour and try again

### Check 4: Copy the Actual URL

When you click the magic link and land on the error page:

1. Look at the URL in your browser's address bar
2. Copy the entire URL
3. Share it here (you can replace the token value with "XXXXX" for security)

Example:
```
http://localhost:3001/auth/callback?token_hash=XXXXX&type=magiclink
```

This will tell us exactly what Supabase is sending.

## Backend vs Supabase Setup

### Your Backend Code: ✅ CORRECT

Your callback handler (`src/pages/auth/callback.astro`) is implemented correctly and can handle:
- New format: `token_hash`
- Old format: `token`
- Multiple token types: `magiclink`, `email`, `signup`, etc.

### Your Supabase Setup: ❓ NEEDS CONFIGURATION

The issue is **NOT in your code**. It's in your **Supabase project configuration**.

Think of it like this:
- Your code is a door that's ready to receive guests (✅)
- But Supabase is the bouncer who won't let anyone through (❌)
- You need to tell Supabase (the bouncer) which URLs are allowed

## What I Changed in Your Code

Updated `src/pages/auth/callback.astro` to:

1. **Log ALL URL parameters** - so we can see exactly what Supabase sends
2. **Support both token formats** - `token_hash` (new) and `token` (old)
3. **Better error messages** - shows what parameters were received
4. **Support more token types** - including `email` type

These changes help with debugging, but **won't fix the issue** if Supabase redirect URLs aren't configured.

## Summary

### The Problem
Supabase is redirecting to your callback URL **without** the authentication tokens because your callback URL is not whitelisted in your Supabase project settings.

### The Solution
1. ✅ Configure Redirect URLs in Supabase Dashboard (see above)
2. ✅ Make sure the port matches your actual app
3. ✅ Request a new magic link
4. ✅ Click it and check the logs

### This is a Supabase Configuration Issue, Not a Code Issue

Your backend code is fine. You just need to configure your Supabase project to allow redirects to your callback URL.

## Next Steps

1. **Configure Supabase Dashboard** (5 minutes)
   - Add redirect URLs
   - Save settings

2. **Test Again** (2 minutes)
   - Request new magic link
   - Click it
   - Check terminal logs

3. **Share Results**
   - If still broken, share the terminal logs
   - Share the URL from your browser
   - We'll figure it out!

## Common Supabase Free Tier Limitations

- ✅ Magic links work on free tier
- ⚠️ Only 2 emails per hour per address
- ⚠️ Must configure redirect URLs (not automatic)
- ⚠️ Links expire after 60 minutes
- ⚠️ Each link can only be used once

Your issue is almost certainly the redirect URL configuration. Fix that first!
