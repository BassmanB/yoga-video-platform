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
      className="group cursor-pointer transition-all hover:scale-[1.02] focus-within:ring-2 focus-within:ring-primary/50"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${video.title} - ${formatDuration(video.duration)}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-muted">
        <img
          src={imageError ? "/placeholder-thumbnail.svg" : video.thumbnail_url}
          alt={video.title}
          onError={() => setImageError(true)}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${!hasAccess ? "blur-md" : ""}`}
        />

        {/* Premium Badge */}
        {video.is_premium && (
          <Badge className="absolute top-3 right-3 bg-gradient-sunset shadow-glow">Premium</Badge>
        )}

        {/* Duration Badge */}
        <Badge variant="secondary" className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm">
          {formatDuration(video.duration)}
        </Badge>

        {/* Blur Overlay for inaccessible premium */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <p className="text-foreground text-sm font-medium font-heading">Tylko Premium</p>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-5">
        <h3 className="font-heading font-semibold text-lg text-foreground line-clamp-2 mb-3">{video.title}</h3>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{getCategoryLabel(video.category)}</Badge>
          <Badge variant="outline">{getLevelLabel(video.level)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
