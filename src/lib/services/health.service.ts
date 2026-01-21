/**
 * Health Service
 *
 * Provides health check functionality for monitoring API status.
 * Checks the status of API, database, and storage services.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { HealthCheckResponse } from "../../types";

/**
 * Performs health checks on all system services
 *
 * @param supabase - Supabase client instance
 * @returns Promise resolving to HealthCheckResponse with service statuses
 */
export async function checkHealth(supabase: SupabaseClient<Database>): Promise<HealthCheckResponse> {
  const services: {
    api: "up" | "down";
    database: "up" | "down";
    storage: "up" | "down";
  } = {
    api: "up",
    database: "up",
    storage: "up",
  };

  // Check database connectivity
  try {
    const { error } = await supabase.from("videos").select("id").limit(1);
    if (error) {
      services.database = "down";
    }
  } catch {
    services.database = "down";
  }

  // Check storage connectivity (optional - may be slower)
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error || !data) {
      services.storage = "down";
    }
  } catch {
    services.storage = "down";
  }

  // Determine overall status
  const status = Object.values(services).every((s) => s === "up") ? "healthy" : "unhealthy";

  return {
    status,
    timestamp: new Date().toISOString(),
    services,
    version: "1.0.0",
  };
}
