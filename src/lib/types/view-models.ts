/**
 * View Models and UI-specific types
 *
 * This file contains types used specifically for UI components and view logic.
 */

import type { Video, VideoCategory, VideoLevel, UserRole, PaginationMeta } from "../../types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Filter state for FilterBar component
 * Represents current active filters in the UI
 */
export interface FilterState {
  category: VideoCategory | null;
  level: VideoLevel | null;
}

/**
 * Props for VideoCard component
 */
export interface VideoCardProps {
  video: Video;
  userRole: UserRole | null;
}

/**
 * Props for VideoGrid component
 */
export interface VideoGridProps {
  initialParams: import("../../types").VideoListQueryParams;
}

/**
 * Props for FilterBar component
 */
export interface FilterBarProps {
  initialCategory?: string | null;
  initialLevel?: string | null;
}

/**
 * Return type for useVideos hook
 */
export interface UseVideosResult {
  videos: Video[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  meta: PaginationMeta | null;
}

/**
 * Return type for useFilters hook
 */
export interface UseFiltersResult {
  filters: FilterState;
  setCategory: (category: VideoCategory | null) => void;
  setLevel: (level: VideoLevel | null) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Return type for useAuth hook
 */
export interface UseAuthResult {
  user: SupabaseUser | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}
