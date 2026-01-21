/**
 * Authentication and Authorization Utilities
 *
 * Provides helper functions for user authentication and role-based access control.
 * Works with Supabase Auth and user metadata.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { UserRole } from "../../types";
import { isUserRole } from "../../types";

/**
 * Custom error class for authentication/authorization failures
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Retrieves the current user's role from Supabase Auth metadata
 *
 * @param supabase - Supabase client instance
 * @returns User role or null if not authenticated
 */
export async function getUserRole(supabase: SupabaseClient<Database>): Promise<UserRole | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get role from user metadata
  const role = user.user_metadata?.role as string | undefined;

  // Validate role using type guard
  if (role && isUserRole(role)) {
    return role;
  }

  // Default role for authenticated users without explicit role
  return "free";
}

/**
 * Checks if a user is authenticated
 *
 * @param supabase - Supabase client instance
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated(supabase: SupabaseClient<Database>): Promise<boolean> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return !error && user !== null;
}

/**
 * Checks if the current user has admin role
 *
 * @param supabase - Supabase client instance
 * @returns True if user is admin, false otherwise
 */
export async function isAdmin(supabase: SupabaseClient<Database>): Promise<boolean> {
  const role = await getUserRole(supabase);
  return role === "admin";
}

/**
 * Middleware function to require authentication
 * Throws AuthError if user is not authenticated
 *
 * @param supabase - Supabase client instance
 * @throws {AuthError} If user is not authenticated
 */
export async function requireAuth(supabase: SupabaseClient<Database>): Promise<void> {
  const authenticated = await isAuthenticated(supabase);

  if (!authenticated) {
    throw new AuthError("Authentication required", "UNAUTHORIZED");
  }
}

/**
 * Middleware function to require admin role
 * Throws AuthError if user is not authenticated or not an admin
 *
 * @param supabase - Supabase client instance
 * @throws {AuthError} If user is not authenticated or not an admin
 */
export async function requireAdmin(supabase: SupabaseClient<Database>): Promise<void> {
  const role = await getUserRole(supabase);

  if (!role) {
    throw new AuthError("Authentication required", "UNAUTHORIZED");
  }

  if (role !== "admin") {
    throw new AuthError("Admin role required", "FORBIDDEN");
  }
}

/**
 * Gets the current user's ID
 *
 * @param supabase - Supabase client instance
 * @returns User ID or null if not authenticated
 */
export async function getUserId(supabase: SupabaseClient<Database>): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}
