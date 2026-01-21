/**
 * VideoPlayerSkeleton Component
 *
 * Loading skeleton for video player with 16:9 aspect ratio
 */

import { Play } from "lucide-react";

interface VideoPlayerSkeletonProps {
  className?: string;
}

export function VideoPlayerSkeleton({ className = "" }: VideoPlayerSkeletonProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg bg-slate-800 ${className}`}
      style={{ aspectRatio: "16 / 9" }}
      role="status"
      aria-label="Ładowanie odtwarzacza wideo"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />

      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-slate-900/50 p-6">
          <Play className="h-12 w-12 text-slate-400" />
        </div>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900/50">
          <div className="h-full w-1/3 animate-pulse bg-slate-600" />
        </div>
      </div>
    </div>
  );
}
