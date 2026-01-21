/**
 * API Routes: /api/videos/:id
 *
 * Handles single video operations (GET, PUT, PATCH, DELETE)
 */

import type { APIRoute } from "astro";
import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import {
  uuidSchema,
  updateVideoRequestSchema,
  partialUpdateVideoRequestSchema,
} from "../../../lib/validators/video.validator";
import { getVideoById, updateVideo, partialUpdateVideo, deleteVideo } from "../../../lib/services/video.service";
import { requireAdmin } from "../../../lib/utils/auth.utils";
import {
  createErrorResponse,
  formatValidationErrors,
  handleSupabaseError,
  notFoundError,
  forbiddenError,
  unauthorizedError,
} from "../../../lib/utils/error.utils";
import { AuthError } from "../../../lib/utils/auth.utils";

export const prerender = false;

/**
 * GET /api/videos/:id
 *
 * Retrieves a single video by ID.
 * Access is controlled by RLS policies based on user role.
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Validate UUID parameter
    const id = uuidSchema.parse(params.id);

    // Get Supabase client
    const supabase = locals.supabase;

    // Call service to fetch video
    const video = await getVideoById(id, supabase);

    // Handle not found (could be non-existent or no access)
    if (!video) {
      const errorResponse = notFoundError("Video", id);
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response
    return new Response(JSON.stringify({ data: video }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle validation errors (invalid UUID)
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
 * PUT /api/videos/:id
 *
 * Performs a full update of a video (all fields required).
 * Admin only - requires authentication and admin role.
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Validate UUID parameter
    const id = uuidSchema.parse(params.id);

    // Get Supabase client
    const supabase = locals.supabase;

    // Check admin role (throws AuthError if not admin)
    await requireAdmin(supabase);

    // Parse request body
    const body = await request.json();

    // Validate request body (all fields required for PUT)
    const validatedData = updateVideoRequestSchema.parse(body);

    // Call service to update video
    const video = await updateVideo(id, validatedData, supabase);

    // Handle not found
    if (!video) {
      const errorResponse = notFoundError("Video", id);
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response
    return new Response(JSON.stringify({ data: video }), {
      status: 200,
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
 * PATCH /api/videos/:id
 *
 * Performs a partial update of a video (only provided fields are updated).
 * Admin only - requires authentication and admin role.
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Validate UUID parameter
    const id = uuidSchema.parse(params.id);

    // Get Supabase client
    const supabase = locals.supabase;

    // Check admin role (throws AuthError if not admin)
    await requireAdmin(supabase);

    // Parse request body
    const body = await request.json();

    // Validate request body (partial - only provided fields)
    const validatedData = partialUpdateVideoRequestSchema.parse(body);

    // Call service to partially update video
    const video = await partialUpdateVideo(id, validatedData, supabase);

    // Handle not found
    if (!video) {
      const errorResponse = notFoundError("Video", id);
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response
    return new Response(JSON.stringify({ data: video }), {
      status: 200,
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
 * DELETE /api/videos/:id
 *
 * Deletes a video record.
 * Admin only - requires authentication and admin role.
 * Note: This does NOT delete associated files from storage.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Validate UUID parameter
    const id = uuidSchema.parse(params.id);

    // Get Supabase client
    const supabase = locals.supabase;

    // Check admin role (throws AuthError if not admin)
    await requireAdmin(supabase);

    // Call service to delete video
    const deleted = await deleteVideo(id, supabase);

    // Handle not found
    if (!deleted) {
      const errorResponse = notFoundError("Video", id);
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success response (204 No Content)
    return new Response(null, {
      status: 204,
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

    // Handle validation errors (invalid UUID)
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
