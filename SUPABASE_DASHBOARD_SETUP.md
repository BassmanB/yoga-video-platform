# Supabase Dashboard Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Sign in with your account
3. Click on your project (the one you're using for this app)

### Step 2: Navigate to URL Configuration

In the left sidebar:
1. Click **"Authentication"** (shield icon)
2. Click **"URL Configuration"**

### Step 3: Configure Site URL

You'll see a field called **"Site URL"**

**Set it to:**
```
http://localhost:3001
```

**Or if your app runs on a different port:**
```
http://localhost:4321
```

**How to check your port:**
- Look at your terminal where `npm run dev` is running
- Find the line that says `Local: http://localhost:XXXX/`
- Use that port number

### Step 4: Configure Redirect URLs

Scroll down to **"Redirect URLs"** section

**Add these URLs one by one:**

1. Click **"+ Add URL"**
2. Enter: `http://localhost:3001/auth/callback`
3. Click **"+ Add URL"** again
4. Enter: `http://localhost:4321/auth/callback`
5. Click **"+ Add URL"** again
6. Enter: `http://127.0.0.1:3001/auth/callback`
7. Click **"+ Add URL"** again
8. Enter: `http://127.0.0.1:4321/auth/callback`

**Why so many?**
- We're covering both common ports (3001 and 4321)
- We're covering both `localhost` and `127.0.0.1` formats
- Better safe than sorry!

### Step 5: Save Configuration

1. Scroll to the bottom
2. Click **"Save"** button
3. Wait for confirmation message

### Step 6: Verify Email Provider is Enabled

1. In the left sidebar, click **"Authentication"**
2. Click **"Providers"**
3. Find **"Email"** in the list
4. Make sure it's **enabled** (toggle should be ON/green)
5. Make sure **"Enable Magic Link"** is checked

### Step 7: Check Email Template (Optional)

1. In the left sidebar, click **"Authentication"**
2. Click **"Email Templates"**
3. Click on **"Magic Link"** template
4. Verify the template contains `{{ .ConfirmationURL }}`
5. You don't need to change anything, just verify it's there

## Visual Reference

```
Supabase Dashboard
├── Authentication (click here)
│   ├── URL Configuration (click here)
│   │   ├── Site URL: http://localhost:3001
│   │   └── Redirect URLs:
│   │       ├── http://localhost:3001/auth/callback
│   │       ├── http://localhost:4321/auth/callback
│   │       ├── http://127.0.0.1:3001/auth/callback
│   │       └── http://127.0.0.1:4321/auth/callback
│   │
│   ├── Providers (verify)
│   │   └── Email: ✅ Enabled
│   │       └── ✅ Enable Magic Link
│   │
│   └── Email Templates (optional check)
│       └── Magic Link: contains {{ .ConfirmationURL }}
│
└── Project Settings → API
    ├── Project URL (copy to .env)
    └── anon public key (copy to .env)
```

## After Configuration

### Test the Magic Link

1. **Go to your app**: http://localhost:3001/auth/login
2. **Enter your email**
3. **Click "Send magic link"**
4. **Check your email** (including spam!)
5. **Click the magic link**
6. **You should be logged in!**

### Check Terminal Logs

After clicking the magic link, your terminal should show:

```
=== Auth Callback Debug ===
1. All URL params: { token_hash: 'abc123...', type: 'magiclink' }
2. Token hash: present
3. Token (old format): missing
4. Type: magiclink
5. Redirect: /
6. Calling verifyOtp...
7. Using token_hash format
8. Verification response: { hasData: true, hasSession: true, ... }
9. Success! Redirecting to: /
```

## Troubleshooting

### "Still getting invalid token error"

**Check:**
1. Did you save the configuration in Supabase?
2. Did you use the correct port number?
3. Did you request a **new** magic link after configuring?
4. Is your `.env` file correct?

### "No email received"

**Check:**
1. Spam folder
2. Wait 2-3 minutes (email delivery can be slow)
3. Rate limit - Supabase free tier allows only 2 emails/hour
4. Try a different email address

### "Email received but link doesn't work"

**Check:**
1. Click the link within 60 minutes (links expire)
2. Each link can only be used once
3. Check terminal logs to see what parameters are received

## Environment Variables

Make sure your `.env` file has these:

```env
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these:**
1. Supabase Dashboard
2. Click **"Project Settings"** (gear icon at bottom of sidebar)
3. Click **"API"**
4. Copy **"Project URL"** → `PUBLIC_SUPABASE_URL`
5. Copy **"anon public"** key → `PUBLIC_SUPABASE_ANON_KEY`

## Important Notes

### Port Numbers Matter!

If your app runs on `http://localhost:3001` but you configured `http://localhost:4321` in Supabase, **it won't work**.

Always check your terminal to see the actual port:
```bash
npm run dev
# Look for: Local: http://localhost:XXXX/
```

### Localhost vs 127.0.0.1

These are the same thing, but Supabase treats them as different URLs. That's why we add both!

### Free Tier Limitations

- **2 emails per hour** per email address
- If you're testing, use different email addresses
- Or wait 1 hour between tests

### Changes Take Effect Immediately

After saving the configuration in Supabase:
- No need to restart your app
- No need to wait
- Just request a new magic link

## Success Checklist

- [ ] Supabase Dashboard → Authentication → URL Configuration
- [ ] Site URL set to your app's URL (with correct port)
- [ ] Redirect URLs added (all 4 variations)
- [ ] Configuration saved
- [ ] Email provider enabled
- [ ] Magic Link enabled
- [ ] `.env` file has correct Supabase URL and key
- [ ] Requested new magic link after configuration
- [ ] Checked terminal logs

If all checkboxes are checked and it's still not working, share:
1. The URL from your browser when you land on the error page
2. The terminal logs
3. A screenshot of your Supabase URL Configuration page

We'll figure it out! 🚀
