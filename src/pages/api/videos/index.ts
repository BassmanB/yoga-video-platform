/**
 * API Routes: /api/videos
 *
 * Handles video list and creation endpoints
 */

import type { APIRoute } from "astro";
import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import { videoListQueryParamsSchema, createVideoRequestSchema } from "../../../lib/validators/video.validator";
import { listVideos, createVideo } from "../../../lib/services/video.service";
import { requireAdmin } from "../../../lib/utils/auth.utils";
import {
  createErrorResponse,
  formatValidationErrors,
  handleSupabaseError,
  forbiddenError,
  unauthorizedError,
} from "../../../lib/utils/error.utils";
import { AuthError } from "../../../lib/utils/auth.utils";

export const prerender = false;

/**
 * GET /api/videos
 *
 * Retrieves a paginated list of videos with optional filtering and sorting.
 * Access is controlled by RLS policies based on user role.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Parse query parameters from URL
    const params: Record<string, unknown> = {};
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }

    // Convert string values to appropriate types for validation
    if (params.is_premium !== undefined) {
      params.is_premium = params.is_premium === "true";
    }
    if (params.limit !== undefined) {
      params.limit = parseInt(params.limit as string, 10);
    }
    if (params.offset !== undefined) {
      params.offset = parseInt(params.offset as string, 10);
    }

    // Validate query parameters
    const validatedParams = videoListQueryParamsSchema.parse(params);

    // Get Supabase client from locals
    const supabase = locals.supabase;

    // Call service to fetch videos
    const result = await listVideos(validatedParams, supabase);

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorResponse = formatValidationErrors(error);
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle Supabase errors
    if (error && typeof error === "object" && "code" in error) {
      const errorResponse = handleSupabaseError(error as PostgrestError);
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    const errorResponse = createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/videos
 *
 * Creates a new video record.
 * Admin only - requires authentication and admin role.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get Supabase client
    const supabase = locals.supabase;

    // Check admin role (throws AuthError if not admin)
    await requireAdmin(supabase);

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = createVideoRequestSchema.parse(body);

    // Call service to create video
    const video = await createVideo(validatedData, supabase);

    // Return success response with 201 Created
    return new Response(JSON.stringify({ data: video }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle authentication/authorization errors
    if (error instanceof AuthError) {
      if (error.code === "UNAUTHORIZED") {
        const errorResponse = unauthorizedError();
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (error.code === "FORBIDDEN") {
        const errorResponse = forbiddenError("admin", "unknown");
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorResponse = formatValidationErrors(error);
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle Supabase errors (including unique constraint violations)
    if (error && typeof error === "object" && "code" in error) {
      const pgError = error as PostgrestError;
      const errorResponse = handleSupabaseError(pgError);
      const statusCode = pgError.code === "23505" ? 409 : 500;
      return new Response(JSON.stringify(errorResponse), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    const errorResponse = createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
