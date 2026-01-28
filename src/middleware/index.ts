/**
 * Astro Middleware - Session Management
 *
 * This middleware:
 * 1. Creates Supabase server client with cookie-based session
 * 2. Extracts user session from cookies (if exists)
 * 3. Attaches user and role to context.locals for easy access in routes
 * 4. Does NOT block requests - acts as a "session provider" only
 */

import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with request context (for session cookies)
  const supabase = createSupabaseServerClient({
    headers: context.request.headers,
    cookies: context.cookies,
  });

  // Attach supabase client to locals for use in routes
  context.locals.supabase = supabase;

  // Get current session (this also refreshes if needed)
  // Note: Using getUser() instead of getSession() for better security
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Attach user and role to locals for easy access
  context.locals.user = user || null;
  context.locals.userRole = user?.user_metadata?.role || null;

  // Continue to next middleware/route
  // Note: We don't redirect here - let individual routes decide what to do
  return next();
});
