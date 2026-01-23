/**
 * POST /api/auth/logout
 *
 * Logs out the current user by ending their Supabase session
 * and clearing auth cookies.
 */

import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies }) => {
  const supabase = locals.supabase;

  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: {
          code: "SUPABASE_NOT_CONFIGURED",
          message: "Supabase client not available",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Sign out from Supabase (this invalidates the session)
  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: "LOGOUT_FAILED",
          message: error.message,
        },
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Clear all Supabase auth cookies
  // Supabase uses multiple cookies for auth state
  const authCookieNames = ["sb-access-token", "sb-refresh-token", "sb-auth-token"];

  authCookieNames.forEach((cookieName) => {
    cookies.delete(cookieName, {
      path: "/",
    });
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: "Wylogowano pomyślnie",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
