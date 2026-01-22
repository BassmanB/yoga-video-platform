/**
 * Storage URL Utilities
 *
 * Converts storage paths to full public URLs for Supabase Storage
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

/**
 * Get the full public URL for a thumbnail
 *
 * @param path - Relative path in storage (e.g., "thumbnails/image.jpg" or "image.jpg")
 * @param supabase - Supabase client instance
 * @returns Full public URL to the thumbnail
 *
 * @example
 * getThumbnailUrl("morning-yoga.jpg", supabase)
 * // Returns: "http://localhost:54321/storage/v1/object/public/thumbnails/morning-yoga.jpg"
 *
 * getThumbnailUrl("thumbnails/morning-yoga.jpg", supabase)
 * // Returns: "http://localhost:54321/storage/v1/object/public/thumbnails/morning-yoga.jpg"
 */
export function getThumbnailUrl(path: string, supabase: SupabaseClient<Database>): string {
  if (!path) {
    return "";
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Remove bucket name if it's already in the path
  const pathWithoutBucket = cleanPath.startsWith("thumbnails/") ? cleanPath.slice("thumbnails/".length) : cleanPath;

  const { data } = supabase.storage.from("thumbnails").getPublicUrl(pathWithoutBucket);

  return data.publicUrl;
}

/**
 * Get the URL for a video (public or signed based on premium status)
 *
 * @param path - Relative path in storage (e.g., "video.mp4")
 * @param isPremium - Whether video is premium content
 * @param supabase - Supabase client instance
 * @returns Promise resolving to video URL (signed URL for premium, public URL for free)
 *
 * @example
 * // Free video
 * await getVideoUrl("morning-flow.mp4", false, supabase)
 * // Returns: "http://localhost:54321/storage/v1/object/public/videos-free/morning-flow.mp4"
 *
 * // Premium video
 * await getVideoUrl("advanced-class.mp4", true, supabase)
 * // Returns: "http://localhost:54321/storage/v1/object/sign/videos-premium/advanced-class.mp4?token=..."
 */
export async function getVideoUrl(
  path: string,
  isPremium: boolean,
  supabase: SupabaseClient<Database>
): Promise<string> {
  if (!path) {
    return "";
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  const bucket = isPremium ? "videos-premium" : "videos-free";

  // Remove bucket name if it's already in the path
  let pathWithoutBucket = cleanPath;
  if (cleanPath.startsWith("videos-premium/")) {
    pathWithoutBucket = cleanPath.slice("videos-premium/".length);
  } else if (cleanPath.startsWith("videos-free/")) {
    pathWithoutBucket = cleanPath.slice("videos-free/".length);
  }

  if (isPremium) {
    // Premium videos need signed URLs (1 hour expiry)
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(pathWithoutBucket, 3600);

    if (error) {
      throw error;
    }
    return data.signedUrl;
  } else {
    // Free videos use public URLs
    const { data } = supabase.storage.from(bucket).getPublicUrl(pathWithoutBucket);

    return data.publicUrl;
  }
}
