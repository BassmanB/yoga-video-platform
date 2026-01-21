/**
 * API Route: /api/health
 *
 * Health check endpoint for monitoring API status
 */

import type { APIRoute } from "astro";
import { checkHealth } from "../../lib/services/health.service";

export const prerender = false;

/**
 * GET /api/health
 *
 * Checks the health status of all system services.
 * Returns 200 if healthy, 503 if unhealthy.
 * No authentication required - public endpoint.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client
    const supabase = locals.supabase;

    // Call service to check health
    const healthStatus = await checkHealth(supabase);

    // Return appropriate status code based on health
    const statusCode = healthStatus.status === "healthy" ? 200 : 503;

    return new Response(JSON.stringify(healthStatus), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    // Even if health check fails, return structured response
    const errorResponse = {
      status: "unhealthy" as const,
      timestamp: new Date().toISOString(),
      services: {
        api: "up" as const,
        database: "down" as const,
        storage: "down" as const,
      },
      version: "1.0.0",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
