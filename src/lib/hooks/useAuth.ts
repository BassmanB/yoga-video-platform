/**
 * useAuth hook
 *
 * Manages user authentication state and provides auth methods
 */

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserRole } from "../../types";
import type { UseAuthResult } from "../types/view-models";
import { checkEnvVariables } from "../utils/env-check";

// Create Supabase client for client-side auth
// Fallback to empty strings if env vars are not set (will show error in console but won't crash)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Hook for managing authentication state
 *
 * @returns Authentication state and methods
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    if (!checkEnvVariables()) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        setIsLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Extract role from user metadata, default to 'free'
  const role: UserRole | null = user?.user_metadata?.role || "free";

  /**
   * Sign in - redirects to login page
   */
  const signIn = () => {
    // Get current path for redirect after login
    const currentPath = window.location.pathname;
    const redirectParam = currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : "";

    // Redirect to login page
    window.location.href = `/auth/login${redirectParam}`;
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    if (!checkEnvVariables()) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      alert("Błąd podczas wylogowania.");
    }
  };

  return {
    user,
    role,
    isLoading,
    signIn,
    signOut,
  };
}
