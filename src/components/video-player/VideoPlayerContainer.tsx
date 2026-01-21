/**
 * VideoPlayerContainer Component
 *
 * Main orchestrator component for the video player view
 * Manages state, data fetching, access control, and conditional rendering
 */

import type { UserRole } from "@/types";
import { useVideoPlayer } from "@/lib/hooks/useVideoPlayer";
import { VideoPlayerSkeleton } from "./VideoPlayerSkeleton";
import { VideoPlayer } from "./VideoPlayer";
import { VideoPlayerError } from "./VideoPlayerError";
import { PremiumGate } from "./PremiumGate";
import { VideoDetails } from "./VideoDetails";

interface VideoPlayerContainerProps {
  videoId: string;
  userRole: UserRole | null;
  className?: string;
}

export function VideoPlayerContainer({ videoId, userRole, className = "" }: VideoPlayerContainerProps) {
  const { video, videoUrl, isLoading, isLoadingUrl, error, hasAccess, retry, regenerateUrl } = useVideoPlayer(
    videoId,
    userRole
  );

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Player section */}
      <div className="w-full">
        {/* Loading state */}
        {isLoading && <VideoPlayerSkeleton />}

        {/* Error state */}
        {!isLoading && error && !hasAccess && (
          <VideoPlayerError error={error.type} message={error.message} onRetry={retry} />
        )}

        {/* Premium gate - no access to premium content */}
        {!isLoading && !error && !hasAccess && video && <PremiumGate video={video} />}

        {/* Success state - show player */}
        {!isLoading && hasAccess && videoUrl && video && (
          <div className="relative">
            <VideoPlayer
              videoUrl={videoUrl}
              title={video.title}
              onError={(err) => {
                console.error("[VideoPlayerContainer] Player error:", err);
                retry();
              }}
              onUrlExpired={regenerateUrl}
            />

            {/* URL regeneration loading overlay */}
            {isLoadingUrl && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/50 backdrop-blur-sm">
                <p className="text-sm text-slate-300">Odświeżanie połączenia...</p>
              </div>
            )}
          </div>
        )}

        {/* Edge case: Has access but no URL yet (shouldn't happen but safety check) */}
        {!isLoading && hasAccess && !videoUrl && !error && <VideoPlayerSkeleton />}
      </div>

      {/* Video details section - only show if we have video data */}
      {video && hasAccess && (
        <div className="w-full">
          <VideoDetails video={video} />
        </div>
      )}
    </div>
  );
}
