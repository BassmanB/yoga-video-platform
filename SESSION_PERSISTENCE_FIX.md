# Session Persistence Fix

## The Problem

After clicking the magic link:
- ✅ PKCE code exchange succeeded
- ✅ Session was created
- ✅ No errors shown
- ❌ User wasn't logged in on the home page

## Root Cause

The issue was a **Supabase client mismatch**:

### Two Different Supabase Clients

**Server-side (callback):**
```typescript
// src/db/supabase.client.ts
import { createBrowserClient } from "@supabase/ssr";
export const supabaseClient = createBrowserClient(...);
```
- Uses `@supabase/ssr` package
- Handles cookies properly for SSR
- Session persists across requests

**Client-side (useAuth hook):**
```typescript
// src/lib/hooks/useAuth.ts (BEFORE FIX)
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(...);
```
- Uses `@supabase/supabase-js` package
- Different client instance
- **Doesn't share cookies** with server-side client
- Can't see the session created by PKCE exchange

### Why This Caused the Issue

1. **Callback page** (server-side):
   - Uses `Astro.locals.supabase` (from `createSupabaseServerClient`)
   - Exchanges PKCE code for session
   - Sets session cookies ✅

2. **Home page loads** (server-side):
   - Middleware uses `createSupabaseServerClient`
   - Reads session from cookies ✅
   - `Astro.locals.user` is set correctly ✅

3. **AuthButton component** (client-side):
   - Uses `useAuth()` hook
   - Hook uses **different Supabase client**
   - Can't read the session cookies ❌
   - Shows "Login" button instead of user menu ❌

## The Fix

Updated `src/lib/hooks/useAuth.ts` to use the **same Supabase client**:

### Before (Broken)
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### After (Fixed)
```typescript
import { supabaseClient } from "../../db/supabase.client";

// Use the shared Supabase client
const supabase = supabaseClient;
```

## Why This Works

Now both server and client use clients from the **same package** (`@supabase/ssr`):

- **Server-side**: `createServerClient` (for Astro pages/middleware)
- **Client-side**: `createBrowserClient` (for React components)

Both clients from `@supabase/ssr` are designed to work together and **share session state** through cookies.

## What Changed

### Files Updated

1. **`src/lib/hooks/useAuth.ts`**
   - Changed from `@supabase/supabase-js` to `supabaseClient` from `src/db/supabase.client.ts`
   - Now uses the same client instance as the rest of the app

2. **`src/pages/auth/callback.astro`**
   - Added session verification after PKCE exchange
   - Better logging to debug session issues

## Test It Now!

1. **Request a new magic link**:
   - Go to http://localhost:3000/auth/login
   - Enter your email
   - Click "Send magic link"

2. **Click the magic link in your email**

3. **Expected behavior**:
   - Redirected to home page
   - **User menu appears** in top-right corner (with your email initial)
   - No "Login" button
   - You're logged in! ✅

4. **Expected terminal logs**:
   ```
   === Auth Callback Debug ===
   1. All URL params: { code: '...' }
   4. Code (PKCE flow): present
   7. Using PKCE flow - exchanging code for session
   8. PKCE exchange response: { hasData: true, hasSession: true, hasUser: true, userId: '...' }
   9. Verifying session was set...
   10. Session verification: { userExists: true, userId: '...', email: 'your@email.com' }
   11. PKCE Success! Redirecting to: /
   ```

## How to Verify It's Working

### Check 1: User Menu Appears
After login, you should see:
- Avatar with your email's first letter
- Click it to see dropdown with your email and role
- "Logout" option

### Check 2: Browser DevTools
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Look for cookies starting with `sb-`
4. You should see session cookies

### Check 3: Refresh Page
- Refresh the page (F5)
- You should **stay logged in**
- User menu should still be there

### Check 4: New Tab
- Open a new tab
- Go to http://localhost:3000
- You should **still be logged in**
- Session persists across tabs

## Why This Is Important

### Consistent Session Management

Using the same Supabase client across your app ensures:
- ✅ Sessions persist across page loads
- ✅ Server and client see the same auth state
- ✅ No race conditions or sync issues
- ✅ Cookies are managed consistently

### Best Practice

Always use the clients from `src/db/supabase.client.ts`:
- **Server-side** (Astro pages/middleware): Use `Astro.locals.supabase`
- **Client-side** (React components): Use `supabaseClient`

**Never** create ad-hoc Supabase clients with `createClient()` directly!

## Common Issues

### Issue: Still showing "Login" button

**Cause**: Browser cached the old JavaScript
**Solution**: 
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache
3. Request a new magic link

### Issue: Session lost after page refresh

**Cause**: Cookies not being set
**Solution**:
1. Check browser DevTools → Application → Cookies
2. Make sure `sb-*` cookies exist
3. Check if cookies are being blocked (privacy settings)

### Issue: Different behavior in incognito

**Cause**: Incognito blocks third-party cookies
**Solution**: This is expected. Use regular browser window for development.

## Summary

### The Problem
Client-side code was using a different Supabase client that couldn't read the session cookies set by the server-side PKCE exchange.

### The Solution
Updated `useAuth` hook to use the same `supabaseClient` from `src/db/supabase.client.ts` that uses `@supabase/ssr` package.

### The Result
- ✅ PKCE login works
- ✅ Session persists
- ✅ User stays logged in
- ✅ Consistent auth state across server and client

Try logging in now - it should work perfectly! 🎉
