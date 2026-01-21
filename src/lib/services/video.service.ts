/**
 * Video Service
 *
 * Business logic layer for video operations.
 * Handles all database interactions for the videos resource.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  Video,
  VideoListQueryParams,
  VideoListResponse,
  CreateVideoRequest,
  UpdateVideoRequest,
  PartialUpdateVideoRequest,
} from "../../types";
import { getThumbnailUrl } from "../utils/storage.utils";

/**
 * Transforms video data to include full storage URLs
 *
 * @param video - Raw video data from database
 * @param supabase - Supabase client instance
 * @returns Video with transformed thumbnail URL
 */
function transformVideoUrls(video: Video, supabase: SupabaseClient<Database>): Video {
  return {
    ...video,
    thumbnail_url: getThumbnailUrl(video.thumbnail_url, supabase),
    // Note: video_url stays as relative path; use getVideoUrl() separately for playback
  };
}

/**
 * Retrieves a paginated list of videos with optional filtering and sorting
 *
 * @param params - Query parameters for filtering, sorting, and pagination
 * @param supabase - Supabase client instance
 * @returns Promise resolving to VideoListResponse with data and metadata
 * @throws Error if database query fails
 */
export async function listVideos(
  params: VideoListQueryParams,
  supabase: SupabaseClient<Database>
): Promise<VideoListResponse> {
  const { category, level, is_premium, status, limit = 50, offset = 0, sort = "created_at", order = "desc" } = params;

  // Build query with count
  let query = supabase.from("videos").select("*", { count: "exact" });

  // Apply filters
  if (category) {
    query = query.eq("category", category);
  }
  if (level) {
    query = query.eq("level", level);
  }
  if (is_premium !== undefined) {
    query = query.eq("is_premium", is_premium);
  }
  if (status) {
    query = query.eq("status", status);
  }

  // Apply sorting
  query = query.order(sort, { ascending: order === "asc" });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  // Transform storage paths to full URLs
  const transformedData = (data as Video[])?.map((video) => transformVideoUrls(video, supabase)) || [];

  return {
    data: transformedData,
    meta: {
      total: count ?? 0,
      limit,
      offset,
      count: data?.length ?? 0,
    },
  };
}

/**
 * Retrieves a single video by ID
 *
 * RLS policies automatically enforce access control based on user role
 *
 * @param id - Video UUID
 * @param supabase - Supabase client instance
 * @returns Promise resolving to Video or null if not found/no access
 * @throws Error if database query fails
 */
export async function getVideoById(id: string, supabase: SupabaseClient<Database>): Promise<Video | null> {
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).single();

  if (error) {
    // PGRST116 means no rows returned (not found or no access)
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return transformVideoUrls(data as Video, supabase);
}

/**
 * Creates a new video record
 *
 * Admin only operation - enforced by RLS policies
 *
 * @param videoData - Video data to create
 * @param supabase - Supabase client instance
 * @returns Promise resolving to created Video
 * @throws Error if database insert fails or user lacks permissions
 */
export async function createVideo(videoData: CreateVideoRequest, supabase: SupabaseClient<Database>): Promise<Video> {
  const { data, error } = await supabase
    .from("videos")
    .insert({
      title: videoData.title,
      description: videoData.description ?? null,
      category: videoData.category,
      level: videoData.level,
      duration: videoData.duration,
      video_url: videoData.video_url,
      thumbnail_url: videoData.thumbnail_url,
      is_premium: videoData.is_premium ?? false,
      status: videoData.status ?? "draft",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return transformVideoUrls(data as Video, supabase);
}

/**
 * Updates all fields of an existing video (full replacement)
 *
 * Admin only operation - enforced by RLS policies
 *
 * @param id - Video UUID
 * @param videoData - Complete video data for update
 * @param supabase - Supabase client instance
 * @returns Promise resolving to updated Video or null if not found
 * @throws Error if database update fails or user lacks permissions
 */
export async function updateVideo(
  id: string,
  videoData: UpdateVideoRequest,
  supabase: SupabaseClient<Database>
): Promise<Video | null> {
  const { data, error } = await supabase
    .from("videos")
    .update({
      title: videoData.title,
      description: videoData.description ?? null,
      category: videoData.category,
      level: videoData.level,
      duration: videoData.duration,
      video_url: videoData.video_url,
      thumbnail_url: videoData.thumbnail_url,
      is_premium: videoData.is_premium ?? false,
      status: videoData.status ?? "draft",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    // PGRST116 means no rows returned (not found or no access)
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return transformVideoUrls(data as Video, supabase);
}

/**
 * Partially updates an existing video (only provided fields)
 *
 * Admin only operation - enforced by RLS policies
 *
 * @param id - Video UUID
 * @param videoData - Partial video data for update
 * @param supabase - Supabase client instance
 * @returns Promise resolving to updated Video or null if not found
 * @throws Error if database update fails or user lacks permissions
 */
export async function partialUpdateVideo(
  id: string,
  videoData: PartialUpdateVideoRequest,
  supabase: SupabaseClient<Database>
): Promise<Video | null> {
  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};

  if (videoData.title !== undefined) updateData.title = videoData.title;
  if (videoData.description !== undefined) updateData.description = videoData.description;
  if (videoData.category !== undefined) updateData.category = videoData.category;
  if (videoData.level !== undefined) updateData.level = videoData.level;
  if (videoData.duration !== undefined) updateData.duration = videoData.duration;
  if (videoData.video_url !== undefined) updateData.video_url = videoData.video_url;
  if (videoData.thumbnail_url !== undefined) updateData.thumbnail_url = videoData.thumbnail_url;
  if (videoData.is_premium !== undefined) updateData.is_premium = videoData.is_premium;
  if (videoData.status !== undefined) updateData.status = videoData.status;

  // If no fields to update, return current video
  if (Object.keys(updateData).length === 0) {
    return getVideoById(id, supabase);
  }

  const { data, error } = await supabase.from("videos").update(updateData).eq("id", id).select().single();

  if (error) {
    // PGRST116 means no rows returned (not found or no access)
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return transformVideoUrls(data as Video, supabase);
}

/**
 * Deletes a video record
 *
 * Admin only operation - enforced by RLS policies
 * Note: This does NOT delete associated files from storage
 *
 * @param id - Video UUID
 * @param supabase - Supabase client instance
 * @returns Promise resolving to true if deleted, false if not found
 * @throws Error if database delete fails or user lacks permissions
 */
export async function deleteVideo(id: string, supabase: SupabaseClient<Database>): Promise<boolean> {
  const { error, count } = await supabase.from("videos").delete({ count: "exact" }).eq("id", id);

  if (error) {
    throw error;
  }

  // Return true if at least one row was deleted
  return (count ?? 0) > 0;
}
