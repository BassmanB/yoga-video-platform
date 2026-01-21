/**
 * VideoCard component
 *
 * Displays a single video card with thumbnail, metadata, and access control
 */

import { useState } from "react";
import type { Video, UserRole } from "../types";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { canAccessVideo, formatDuration, getCategoryLabel, getLevelLabel } from "../lib/utils/video.utils";

interface VideoCardProps {
  video: Video;
  userRole: UserRole | null;
}

export function VideoCard({ video, userRole }: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasAccess = canAccessVideo(video, userRole);

  const handleClick = () => {
    window.location.href = `/video/${video.id}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className="group cursor-pointer transition-transform hover:scale-105 focus-within:ring-2 focus-within:ring-indigo-500"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${video.title} - ${formatDuration(video.duration)}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-slate-800">
        <img
          src={imageError ? "/placeholder-thumbnail.svg" : video.thumbnail_url}
          alt={video.title}
          onError={() => setImageError(true)}
          loading="lazy"
          className={`w-full h-full object-cover ${!hasAccess ? "blur-md" : ""}`}
        />

        {/* Premium Badge */}
        {video.is_premium && (
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-indigo-600">Premium</Badge>
        )}

        {/* Duration Badge */}
        <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/70 text-white">
          {formatDuration(video.duration)}
        </Badge>

        {/* Blur Overlay for inaccessible premium */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <p className="text-white text-sm font-medium">Tylko Premium</p>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-slate-100 line-clamp-2 mb-2">{video.title}</h3>
        <div className="flex gap-2">
          <Badge variant="outline">{getCategoryLabel(video.category)}</Badge>
          <Badge variant="outline">{getLevelLabel(video.level)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
