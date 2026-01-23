/**
 * Supabase Client Configuration
 *
 * This file provides both server-side and client-side Supabase clients:
 * - createSupabaseServerClient: For use in Astro middleware and pages (SSR)
 * - supabaseClient: For use in React components (browser)
 */

import type { AstroCookies } from "astro";
import { createBrowserClient } from "@supabase/ssr";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error("⚠️ Supabase environment variables are not set. See .env.example");
}

/**
 * Cookie options for Supabase Auth
 * Used for session persistence across requests
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD, // HTTPS only in production
  httpOnly: true, // Prevent XSS attacks
  sameSite: "lax", // CSRF protection
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/**
 * Parse cookie header string into array of cookie objects
 * Helper function for server-side cookie handling
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create Supabase server client for use in Astro middleware and pages
 *
 * This client properly handles cookies for session persistence in SSR context.
 * IMPORTANT: Use this in middleware and Astro pages, NOT in React components.
 *
 * @param context - Astro context with headers and cookies
 * @returns Supabase server client with cookie-based session management
 */
export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl || "", supabaseAnonKey || "", {
    cookies: {
      // Get all cookies from request headers
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      // Set cookies in response (Supabase manages auth tokens)
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

/**
 * Browser-side Supabase client for use in React components
 *
 * This client uses localStorage for session persistence.
 * Use this in React components, NOT in Astro pages.
 */
export const supabaseClient = createBrowserClient<Database>(supabaseUrl || "", supabaseAnonKey || "");

/**
 * Type exports for convenience
 */
export type SupabaseClient = typeof supabaseClient;
