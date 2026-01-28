/**
 * VideoGrid component
 *
 * Displays a grid of video cards with loading, error, and empty states
 */

import { useEffect, useState } from "react";
import { useVideos } from "../lib/hooks/useVideos";
import { useAuth } from "../lib/hooks/useAuth";
import type { VideoListQueryParams } from "../types";
import { isVideoCategory, isVideoLevel } from "../types";
import { VideoCard } from "./VideoCard";
import { SkeletonLoader } from "./SkeletonLoader";
import { EmptyState } from "./EmptyState";
import { toast } from "sonner";

interface VideoGridProps {
  initialParams: VideoListQueryParams;
}

export function VideoGrid({ initialParams }: VideoGridProps) {
  const { role } = useAuth();
  const [params, setParams] = useState<VideoListQueryParams>(initialParams);
  const { videos, isLoading, error, refetch } = useVideos(params);

  // Listen to URL changes and update params
  useEffect(() => {
    const handleUrlChange = () => {
      const url = new URL(window.location.href);
      const categoryParam = url.searchParams.get("category");
      const levelParam = url.searchParams.get("level");

      const category = categoryParam && isVideoCategory(categoryParam) ? categoryParam : undefined;
      const level = levelParam && isVideoLevel(levelParam) ? levelParam : undefined;

      setParams({
        ...initialParams,
        category,
        level,
      });
    };

    // Listen to popstate (back/forward buttons)
    window.addEventListener("popstate", handleUrlChange);

    // Listen to custom event for filter changes
    window.addEventListener("filterchange", handleUrlChange);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("filterchange", handleUrlChange);
    };
  }, [initialParams]);

  // Handle error with toast notification
  useEffect(() => {
    if (error) {
      toast.error("Nie udało się załadować nagrań", {
        action: {
          label: "Spróbuj ponownie",
          onClick: () => refetch(),
        },
      });
    }
  }, [error, refetch]);

  // Show loading skeleton
  if (isLoading) {
    return <SkeletonLoader count={9} />;
  }

  // Handle error state
  if (error) {
    return <EmptyState message="Wystąpił błąd podczas ładowania" />;
  }

  // Handle empty state
  if (!videos || videos.length === 0) {
    return <EmptyState message="Nie znaleziono nagrań" />;
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      role="list"
      aria-label="Lista nagrań wideo"
      data-testid="video-grid"
    >
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} userRole={role} />
      ))}
    </div>
  );
}
