/**
 * VideoDetails Component
 *
 * Displays comprehensive video information below the player
 * Composed of VideoHeader (title + metadata) and VideoDescription
 */

import type { Video } from "@/types";
import { VideoHeader } from "./VideoHeader";
import { VideoDescription } from "./VideoDescription";

interface VideoDetailsProps {
  video: Video;
  className?: string;
}

export function VideoDetails({ video, className = "" }: VideoDetailsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video header with title and badges */}
      <VideoHeader title={video.title} category={video.category} level={video.level} duration={video.duration} />

      {/* Video description with expand/collapse */}
      <VideoDescription description={video.description} />

      {/* Future: Related videos section could go here */}
      {/* <RelatedVideos currentVideoId={video.id} category={video.category} /> */}
    </div>
  );
}
