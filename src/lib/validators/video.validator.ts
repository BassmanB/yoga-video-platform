/**
 * Video Validators
 *
 * Zod schemas for validating video-related API requests and parameters.
 * Provides type-safe validation with detailed error messages.
 */

import { z } from "zod";

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

/**
 * Schema for VideoCategory enum
 */
export const videoCategorySchema = z.enum(["yoga", "mobility", "calisthenics"], {
  errorMap: () => ({ message: "Category must be one of: yoga, mobility, calisthenics" }),
});

/**
 * Schema for VideoLevel enum
 */
export const videoLevelSchema = z.enum(["beginner", "intermediate", "advanced"], {
  errorMap: () => ({ message: "Level must be one of: beginner, intermediate, advanced" }),
});

/**
 * Schema for VideoStatus enum
 */
export const videoStatusSchema = z.enum(["draft", "published", "archived"], {
  errorMap: () => ({ message: "Status must be one of: draft, published, archived" }),
});

// ============================================================================
// FIELD SCHEMAS
// ============================================================================

/**
 * Schema for UUID validation
 */
export const uuidSchema = z.string().uuid({
  message: "Invalid UUID format",
});

/**
 * Schema for video_url field
 * Prevents path traversal attacks and enforces correct bucket structure
 */
export const videoUrlSchema = z
  .string()
  .regex(
    /^videos-(free|premium)\/[^/]+\.mp4$/,
    "Invalid video URL format. Must be: videos-free/filename.mp4 or videos-premium/filename.mp4"
  );

/**
 * Schema for thumbnail_url field
 * Enforces correct bucket structure and allowed image formats
 */
export const thumbnailUrlSchema = z
  .string()
  .regex(
    /^thumbnails\/[^/]+\.(jpg|png|webp)$/,
    "Invalid thumbnail URL format. Must be: thumbnails/filename.jpg (or .png, .webp)"
  );

/**
 * Schema for video title
 */
export const titleSchema = z.string().min(1, "Title is required").max(255, "Title must not exceed 255 characters");

/**
 * Schema for video description
 */
export const descriptionSchema = z
  .string()
  .max(5000, "Description must not exceed 5000 characters")
  .nullable()
  .optional();

/**
 * Schema for video duration (in seconds)
 */
export const durationSchema = z
  .number()
  .int("Duration must be an integer")
  .min(1, "Duration must be at least 1 second")
  .max(7200, "Duration must not exceed 7200 seconds (2 hours)");

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

/**
 * Schema for video list query parameters (GET /api/videos)
 */
export const videoListQueryParamsSchema = z.object({
  category: videoCategorySchema.optional(),
  level: videoLevelSchema.optional(),
  is_premium: z
    .union([z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === "boolean") return val;
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    })
    .optional(),
  status: videoStatusSchema.optional(),
  limit: z
    .union([z.number(), z.string()])
    .transform((val) => {
      const num = typeof val === "number" ? val : parseInt(val, 10);
      return isNaN(num) ? 50 : num;
    })
    .pipe(
      z
        .number()
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit must not exceed 100")
    )
    .default(50),
  offset: z
    .union([z.number(), z.string()])
    .transform((val) => {
      const num = typeof val === "number" ? val : parseInt(val, 10);
      return isNaN(num) ? 0 : num;
    })
    .pipe(z.number().int("Offset must be an integer").min(0, "Offset must be at least 0"))
    .default(0),
  sort: z
    .enum(["created_at", "title", "duration"], {
      errorMap: () => ({ message: "Sort must be one of: created_at, title, duration" }),
    })
    .default("created_at"),
  order: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "Order must be one of: asc, desc" }),
    })
    .default("desc"),
});

// ============================================================================
// REQUEST BODY SCHEMAS
// ============================================================================

/**
 * Schema for CreateVideoRequest (POST /api/videos)
 */
export const createVideoRequestSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  category: videoCategorySchema,
  level: videoLevelSchema,
  duration: durationSchema,
  video_url: videoUrlSchema,
  thumbnail_url: thumbnailUrlSchema,
  is_premium: z.boolean().default(false),
  status: videoStatusSchema.default("draft"),
});

/**
 * Schema for UpdateVideoRequest (PUT /api/videos/:id)
 * Same as create - all fields required for full replacement
 */
export const updateVideoRequestSchema = createVideoRequestSchema;

/**
 * Schema for PartialUpdateVideoRequest (PATCH /api/videos/:id)
 * All fields optional - only provided fields will be updated
 */
export const partialUpdateVideoRequestSchema = createVideoRequestSchema.partial();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Inferred types from schemas for use in service layer
 */
export type VideoListQueryParams = z.infer<typeof videoListQueryParamsSchema>;
export type CreateVideoRequest = z.infer<typeof createVideoRequestSchema>;
export type UpdateVideoRequest = z.infer<typeof updateVideoRequestSchema>;
export type PartialUpdateVideoRequest = z.infer<typeof partialUpdateVideoRequestSchema>;
