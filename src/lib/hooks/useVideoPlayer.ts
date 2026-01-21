/**
 * Custom Hook: useVideoPlayer
 *
 * Manages the entire lifecycle of video player state including:
 * - Fetching video data from API
 * - Checking user access permissions
 * - Generating playback URLs (public or signed)
 * - Error handling and retry logic
 */

import { useState, useEffect, useCallback } from "react";
import type { Video, UserRole } from "@/types";
import type { VideoPlayerState, VideoError } from "@/types/video-player.types";
import { fetchVideoById, generateVideoUrl } from "@/lib/api/videos";
import { canAccessVideo } from "@/lib/utils/video.utils";
import { supabaseClient } from "@/db/supabase.client";

/**
 * Hook interface - return value
 */
interface UseVideoPlayerReturn {
  video: Video | null;
  videoUrl: string | null;
  isLoading: boolean;
  isLoadingUrl: boolean;
  error: VideoError | null;
  hasAccess: boolean;
  retry: () => void;
  regenerateUrl: () => Promise<void>;
}

/**
 * Initial state for the video player
 */
const initialState: VideoPlayerState = {
  video: null,
  videoUrl: null,
  isLoading: true,
  isLoadingUrl: false,
  error: null,
  hasAccess: false,
};

/**
 * Hook for managing video player state
 *
 * @param videoId - UUID of the video to load
 * @param userRole - Current user's role (can be null for unauthenticated users)
 * @returns Object containing video data, URLs, loading states, errors, and control functions
 *
 * @example
 * const { video, videoUrl, isLoading, error, hasAccess, retry } = useVideoPlayer(
 *   "550e8400-e29b-41d4-a716-446655440000",
 *   "premium"
 * );
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} onRetry={retry} />;
 * if (!hasAccess) return <PremiumGate video={video} />;
 * return <VideoPlayer url={videoUrl} />;
 */
export function useVideoPlayer(videoId: string, userRole: UserRole | null): UseVideoPlayerReturn {
  const [state, setState] = useState<VideoPlayerState>(initialState);

  /**
   * Fetches video data from API
   */
  const fetchVideo = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const video = await fetchVideoById(videoId);

      // Check access permissions
      const accessResult = canAccessVideo(video, userRole);

      setState((prev) => ({
        ...prev,
        video,
        isLoading: false,
        hasAccess: accessResult.hasAccess,
        error: accessResult.hasAccess
          ? null
          : {
              type: "NOT_FOUND",
              message:
                accessResult.reason === "PREMIUM_REQUIRED"
                  ? "Ta treść jest dostępna tylko dla użytkowników premium."
                  : accessResult.reason === "ARCHIVED"
                    ? "To nagranie zostało zarchiwizowane i nie jest już dostępne."
                    : "To nagranie nie jest jeszcze opublikowane.",
            },
      }));

      return { video, hasAccess: accessResult.hasAccess };
    } catch (error) {
      // Error is already a VideoError from fetchVideoById
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error as VideoError,
      }));

      return { video: null, hasAccess: false };
    }
  }, [videoId, userRole]);

  /**
   * Generates video URL for playback
   */
  const generateUrl = useCallback(async (video: Video) => {
    setState((prev) => ({
      ...prev,
      isLoadingUrl: true,
    }));

    try {
      const url = await generateVideoUrl(video, supabaseClient);

      setState((prev) => ({
        ...prev,
        videoUrl: url,
        isLoadingUrl: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoadingUrl: false,
        error: error as VideoError,
      }));
    }
  }, []);

  /**
   * Regenerates video URL (e.g., when signed URL expires)
   */
  const regenerateUrl = useCallback(async () => {
    if (!state.video) {
      // eslint-disable-next-line no-console
      console.warn("[useVideoPlayer] Cannot regenerate URL: no video data");
      return;
    }

    // eslint-disable-next-line no-console
    console.info(`[useVideoPlayer] Regenerating URL for video: ${state.video.id}`);
    await generateUrl(state.video);
  }, [state.video, generateUrl]);

  /**
   * Retry function for error recovery
   */
  const retry = useCallback(() => {
    // eslint-disable-next-line no-console
    console.info("[useVideoPlayer] Retrying video fetch...");
    setState(initialState);
    fetchVideo();
  }, [fetchVideo]);

  /**
   * Initial fetch effect
   */
  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  /**
   * URL generation effect - only runs when we have video and access
   */
  useEffect(() => {
    if (state.video && state.hasAccess && !state.videoUrl && !state.error) {
      generateUrl(state.video);
    }
  }, [state.video, state.hasAccess, state.videoUrl, state.error, generateUrl]);

  return {
    video: state.video,
    videoUrl: state.videoUrl,
    isLoading: state.isLoading,
    isLoadingUrl: state.isLoadingUrl,
    error: state.error,
    hasAccess: state.hasAccess,
    retry,
    regenerateUrl,
  };
}
