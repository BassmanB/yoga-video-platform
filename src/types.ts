/**
 * DTO (Data Transfer Object) and Command Model Types
 *
 * This file contains all types used for API requests and responses.
 * All types are derived from database models to ensure type safety.
 */

// Types are derived from database models but defined explicitly for API layer
// import type { Tables, TablesInsert } from "./db/database.types";

// ============================================================================
// ENUMS - Domain Value Objects
// ============================================================================

/**
 * Video content categories
 */
export type VideoCategory = "yoga" | "mobility" | "calisthenics";

/**
 * Video difficulty levels
 */
export type VideoLevel = "beginner" | "intermediate" | "advanced";

/**
 * Video publication status
 */
export type VideoStatus = "draft" | "published" | "archived";

/**
 * User role for access control
 */
export type UserRole = "free" | "premium" | "admin";

// ============================================================================
// ENTITIES - Read Models (DTOs)
// ============================================================================

/**
 * Video entity - represents a video resource in the system
 *
 * Derived from database Row type with explicit enum types for better type safety
 */
export interface Video {
  id: string; // UUID
  title: string;
  description: string | null;
  category: VideoCategory;
  level: VideoLevel;
  duration: number; // Duration in seconds
  video_url: string; // Relative path in Supabase Storage
  thumbnail_url: string; // Relative path in Supabase Storage
  is_premium: boolean;
  status: VideoStatus;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

// ============================================================================
// RESPONSE DTOs - API Response Wrappers
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  total: number; // Total number of items matching query
  limit: number; // Number of items per page
  offset: number; // Current offset
  count: number; // Number of items in current response
}

/**
 * Response DTO for video list endpoint
 *
 * Used by: GET /api/videos
 */
export interface VideoListResponse {
  data: Video[];
  meta: PaginationMeta;
}

/**
 * Response DTO for single video endpoint
 *
 * Used by: GET /api/videos/:id
 */
export interface VideoResponse {
  data: Video;
}

/**
 * Standard error response format
 *
 * Used by: All endpoints on error
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Health check response
 *
 * Used by: GET /api/health
 */
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  services: {
    api: "up" | "down";
    database: "up" | "down";
    storage: "up" | "down";
  };
  version: string;
}

// ============================================================================
// COMMAND MODELS - API Request DTOs
// ============================================================================

/**
 * Command Model for creating a new video
 *
 * Used by: POST /api/videos
 *
 * Derived from TablesInsert with auto-generated fields omitted
 */
export interface CreateVideoRequest {
  title: string;
  description?: string | null;
  category: VideoCategory;
  level: VideoLevel;
  duration: number;
  video_url: string;
  thumbnail_url: string;
  is_premium?: boolean;
  status?: VideoStatus;
}

/**
 * Command Model for full video update (PUT semantics)
 *
 * Used by: PUT /api/videos/:id
 *
 * All fields required for full replacement
 */
export type UpdateVideoRequest = CreateVideoRequest;

/**
 * Command Model for partial video update (PATCH semantics)
 *
 * Used by: PATCH /api/videos/:id
 *
 * All fields optional - only provided fields will be updated
 */
export type PartialUpdateVideoRequest = Partial<CreateVideoRequest>;

// ============================================================================
// QUERY PARAMETERS - Request Query DTOs
// ============================================================================

/**
 * Query parameters for video list endpoint
 *
 * Used by: GET /api/videos
 */
export interface VideoListQueryParams {
  category?: VideoCategory;
  level?: VideoLevel;
  is_premium?: boolean;
  status?: VideoStatus; // Admin only
  limit?: number; // Default: 50, Max: 100
  offset?: number; // Default: 0
  sort?: "created_at" | "title" | "duration"; // Default: 'created_at'
  order?: "asc" | "desc"; // Default: 'desc'
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard to check if a string is a valid VideoCategory
 */
export function isVideoCategory(value: string): value is VideoCategory {
  return ["yoga", "mobility", "calisthenics"].includes(value);
}

/**
 * Type guard to check if a string is a valid VideoLevel
 */
export function isVideoLevel(value: string): value is VideoLevel {
  return ["beginner", "intermediate", "advanced"].includes(value);
}

/**
 * Type guard to check if a string is a valid VideoStatus
 */
export function isVideoStatus(value: string): value is VideoStatus {
  return ["draft", "published", "archived"].includes(value);
}

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isUserRole(value: string): value is UserRole {
  return ["free", "premium", "admin"].includes(value);
}

/**
 * Helper type to extract video fields that can be sorted
 */
export type VideoSortField = "created_at" | "title" | "duration";

/**
 * Helper type for sort order
 */
export type SortOrder = "asc" | "desc";
