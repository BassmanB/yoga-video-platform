/// <reference types="astro/client" />

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";
import type { UserRole } from "./types";

declare global {
  namespace App {
    interface Locals {
      /**
       * Supabase server client with cookie-based session
       * Available in all Astro pages and API routes
       */
      supabase: SupabaseClient<Database>;

      /**
       * Current authenticated user (null if not logged in)
       * Set by middleware, available in all routes
       */
      user: User | null;

      /**
       * Current user role (null if not logged in)
       * Extracted from user.user_metadata.role
       * Possible values: "free" | "premium" | "admin"
       */
      userRole: UserRole | null;
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
