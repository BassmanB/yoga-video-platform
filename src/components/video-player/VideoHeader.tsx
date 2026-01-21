/**
 * VideoHeader Component
 *
 * Displays video title and metadata badges (category, level, duration)
 */

import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VideoCategory, VideoLevel } from "@/types";
import {
  formatDuration,
  getCategoryLabel,
  getCategoryColor,
  getLevelLabel,
  getLevelColor,
} from "@/lib/utils/video.utils";

interface VideoHeaderProps {
  title: string;
  category: VideoCategory;
  level: VideoLevel;
  duration: number; // in seconds
  className?: string;
}

export function VideoHeader({ title, category, level, duration, className = "" }: VideoHeaderProps) {
  const formattedDuration = formatDuration(duration);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title */}
      <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">{title}</h1>

      {/* Metadata badges */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category badge */}
        <Badge variant="outline" className={`border ${getCategoryColor(category)}`}>
          {getCategoryLabel(category)}
        </Badge>

        {/* Level badge */}
        <Badge variant="outline" className={`border ${getLevelColor(level)}`}>
          {getLevelLabel(level)}
        </Badge>

        {/* Duration badge */}
        <Badge variant="outline" className="border border-slate-500/30 bg-slate-500/20 text-slate-300">
          <Clock className="mr-1 h-3 w-3" />
          {formattedDuration.formatted}
        </Badge>
      </div>
    </div>
  );
}
