# Magic Link Authentication Fix

## Problem

When clicking the magic link from email, the callback page shows "invalid token" error because the `token_hash` parameter is missing from the URL.

**Console logs show:**
```
=== Auth Callback Debug ===
1. Token hash: missing
2. Type: null
3. Redirect: /
Missing token_hash or type parameter
```

## Root Cause

The issue is likely one of these:

### 1. **Supabase Cloud Redirect URL Configuration** (Most Likely)

Your Supabase project's redirect URLs might not be configured correctly. Supabase needs to know where to send users after they click the magic link.

### 2. **Email Template Format**

Supabase Cloud might be using a different email template format than expected.

### 3. **PKCE Flow Configuration**

Some Supabase configurations use PKCE flow which requires different handling.

## Solution Steps

### Step 1: Check Supabase Dashboard Configuration

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to**: Authentication → URL Configuration

#### Required Settings:

**Site URL:**
```
http://localhost:3001
```
OR (if you're using a different port)
```
http://localhost:4321
```

**Redirect URLs (Add all of these):**
```
http://localhost:3001/auth/callback
http://localhost:4321/auth/callback
http://127.0.0.1:3001/auth/callback
http://127.0.0.1:4321/auth/callback
```

⚠️ **IMPORTANT**: The redirect URLs must be **exact matches**. If your app runs on port 4321 but you only configured 3001, it won't work!

### Step 2: Check Email Template

1. **In Supabase Dashboard**: Authentication → Email Templates
2. **Select**: "Magic Link"
3. **Verify the template contains**:
   ```html
   <a href="{{ .ConfirmationURL }}">Confirm your email</a>
   ```

The `{{ .ConfirmationURL }}` variable is crucial - this is what generates the magic link with the token.

### Step 3: Check Your Local Environment

Make sure your `.env` file has the correct Supabase credentials:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**How to find these:**
1. Supabase Dashboard → Project Settings → API
2. Copy "Project URL" → `PUBLIC_SUPABASE_URL`
3. Copy "anon public" key → `PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Verify the Port Your App is Running On

Check your terminal to see what port your app is actually using:

```bash
# Look for a line like:
# Local: http://localhost:3001/
# or
# Local: http://localhost:4321/
```

Make sure this matches the URLs you configured in Supabase!

### Step 5: Test the Fix

1. **Request a new magic link**:
   - Go to http://localhost:3001/auth/login (or your actual port)
   - Enter your email
   - Click "Send magic link"

2. **Check your email** (including spam folder)

3. **Click the magic link**

4. **Check the browser URL** when you land on the callback page:
   - It should look like: `http://localhost:3001/auth/callback?token_hash=xxxxx&type=magiclink`
   - If you see this, the fix is working!

5. **Check terminal logs**:
   ```
   === Auth Callback Debug ===
   1. All URL params: { token_hash: 'xxxxx', type: 'magiclink' }
   2. Token hash: present
   3. Token (old format): missing
   4. Type: magiclink
   5. Redirect: /
   6. Calling verifyOtp...
   7. Using token_hash format
   8. Verification response: { hasData: true, hasSession: true, ... }
   9. Success! Redirecting to: /
   ```

## Common Issues and Solutions

### Issue 1: "Invalid token" immediately

**Cause**: Redirect URL mismatch
**Solution**: 
- Double-check the port number in Supabase dashboard matches your actual app port
- Add ALL possible localhost variations to redirect URLs

### Issue 2: Email not received

**Cause**: Rate limiting or email provider issues
**Solution**:
- Wait 5-10 minutes (Supabase free tier has rate limits)
- Check spam folder
- Try a different email address
- Check Supabase Dashboard → Authentication → Users to see if the request was received

### Issue 3: Token expired

**Cause**: Magic links expire after 60 minutes
**Solution**:
- Request a new magic link
- Click it within 60 minutes

### Issue 4: "Type: null" in logs

**Cause**: Supabase is not adding the `type` parameter to the URL
**Solution**:
- This usually means the redirect URL is wrong
- Supabase redirects to the configured URL, not the one in your code
- Fix the redirect URLs in Supabase dashboard

## How Magic Link Flow Works

1. **User requests magic link**:
   ```typescript
   await supabase.auth.signInWithOtp({
     email: 'user@example.com',
     options: {
       emailRedirectTo: 'http://localhost:3001/auth/callback'
     }
   })
   ```

2. **Supabase sends email** with a link like:
   ```
   https://your-project.supabase.co/auth/v1/verify?
     token=xxxxx&
     type=magiclink&
     redirect_to=http://localhost:3001/auth/callback
   ```

3. **User clicks link** → Supabase verifies and redirects to:
   ```
   http://localhost:3001/auth/callback?
     token_hash=xxxxx&
     type=magiclink
   ```

4. **Your callback page** exchanges the token for a session:
   ```typescript
   await supabase.auth.verifyOtp({
     token_hash: 'xxxxx',
     type: 'magiclink'
   })
   ```

5. **User is logged in** and redirected to home page

## Debugging Checklist

- [ ] Supabase project URL and anon key are correct in `.env`
- [ ] Site URL in Supabase dashboard matches your app's URL
- [ ] Redirect URLs in Supabase dashboard include your callback URL
- [ ] Port number matches between your app and Supabase config
- [ ] Email template contains `{{ .ConfirmationURL }}`
- [ ] Magic link was clicked within 60 minutes
- [ ] Not hitting rate limits (wait 5-10 minutes between attempts)

## Still Not Working?

If you've tried all the above and it's still not working, check the actual URL parameters:

1. When you click the magic link and land on the callback page
2. Look at the URL in your browser
3. Copy the entire URL
4. Share it (remove the actual token value for security)

Example of what we need to see:
```
http://localhost:3001/auth/callback?token_hash=XXXXX&type=magiclink
```

If the URL is different (missing parameters, different format, etc.), that tells us what the real issue is.

## Code Changes Made

Updated `src/pages/auth/callback.astro` to:
1. Log ALL URL parameters for debugging
2. Support both `token_hash` (new format) and `token` (old format)
3. Support additional token types including `email`
4. Provide detailed console logging at each step

## Next Steps

1. Configure Supabase dashboard as described above
2. Request a new magic link
3. Check the URL parameters when you land on callback
4. Share the logs from your terminal

This will help us identify the exact issue!
