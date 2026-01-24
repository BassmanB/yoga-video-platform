# Magic Link Quick Fix Checklist

## The Problem
✅ Email is sent
❌ Clicking the link shows "invalid token" error

## The Cause
**Supabase redirect URLs are not configured**

## The Fix (5 Minutes)

### 1. Check Your App's Port
Look at your terminal:
```
npm run dev
Local: http://localhost:3001/  ← This is your port!
```

### 2. Configure Supabase Dashboard

**Go to:** https://supabase.com/dashboard

**Navigate to:** Authentication → URL Configuration

**Set Site URL:**
```
http://localhost:3001
```
(Use YOUR port number from step 1)

**Add Redirect URLs:**
```
http://localhost:3001/auth/callback
http://localhost:4321/auth/callback
http://127.0.0.1:3001/auth/callback
http://127.0.0.1:4321/auth/callback
```

**Click:** Save

### 3. Test Again

1. Go to: http://localhost:3001/auth/login
2. Enter your email
3. Click "Send magic link"
4. Check email (and spam folder!)
5. Click the magic link
6. ✅ You should be logged in!

## Expected Terminal Logs (After Fix)

```
=== Auth Callback Debug ===
1. All URL params: { token_hash: 'abc123...', type: 'magiclink' }
2. Token hash: present
3. Token (old format): missing
4. Type: magiclink
5. Redirect: /
6. Calling verifyOtp...
7. Using token_hash format
8. Verification response: { hasData: true, hasSession: true, hasUser: true }
9. Success! Redirecting to: /
```

## Still Not Working?

### Check These:

1. **Port number matches?**
   - Terminal shows: `localhost:3001`
   - Supabase configured: `localhost:3001`
   - ✅ Must match!

2. **Saved configuration?**
   - Click "Save" button in Supabase
   - Wait for confirmation

3. **Requested NEW magic link?**
   - Old links won't work
   - Request a fresh one after configuration

4. **Environment variables correct?**
   ```env
   PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Rate limited?**
   - Free tier: 2 emails/hour
   - Wait 1 hour or use different email

## Need More Help?

Share these with me:

1. **Browser URL** when you land on error page:
   ```
   http://localhost:3001/auth/callback???? ← What's here?
   ```

2. **Terminal logs** after clicking magic link

3. **Port number** your app is running on

## Key Points

- ⚠️ **This is a Supabase configuration issue, not a code issue**
- ⚠️ **Your backend code is correct**
- ⚠️ **You MUST configure the Supabase dashboard**
- ⚠️ **Port numbers must match exactly**

## Quick Links

- Supabase Dashboard: https://supabase.com/dashboard
- Detailed Guide: `SUPABASE_DASHBOARD_SETUP.md`
- Full Diagnosis: `MAGIC_LINK_DIAGNOSIS.md`
- Technical Details: `SUPABASE_MAGIC_LINK_FIX.md`

---

**TL;DR:** Configure redirect URLs in Supabase Dashboard → Authentication → URL Configuration. Use the exact port your app runs on. Save. Test again.
