/**
 * Video utility functions
 *
 * Helper functions for video-related operations in the UI
 */

import type { Video, VideoCategory, VideoLevel, UserRole } from "../../types";

/**
 * Check if user has access to a video based on their role
 *
 * @param video - Video entity to check access for
 * @param userRole - Current user's role (null for anonymous)
 * @returns true if user can access the video
 */
export function canAccessVideo(video: Video, userRole: UserRole | null): boolean {
  // Admin can access everything
  if (userRole === "admin") {
    return true;
  }

  // Only published videos are accessible (except for admin)
  if (video.status !== "published") {
    return false;
  }

  // Premium content requires premium role
  if (video.is_premium) {
    return userRole === "premium";
  }

  // Free content is accessible to everyone
  return true;
}

/**
 * Format duration in seconds to MM:SS format
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "12:05")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get localized label for video category
 *
 * @param category - Video category enum value
 * @returns Localized category label
 */
export function getCategoryLabel(category: VideoCategory): string {
  const labels: Record<VideoCategory, string> = {
    yoga: "Yoga",
    mobility: "Mobilność",
    calisthenics: "Kalistenika",
  };
  return labels[category];
}

/**
 * Get localized label for video level
 *
 * @param level - Video level enum value
 * @returns Localized level label
 */
export function getLevelLabel(level: VideoLevel): string {
  const labels: Record<VideoLevel, string> = {
    beginner: "Początkujący",
    intermediate: "Średniozaawansowany",
    advanced: "Zaawansowany",
  };
  return labels[level];
}
