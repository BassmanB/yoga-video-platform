/**
 * useVideos hook
 *
 * Fetches and manages video list data from API
 */

import { useState, useEffect } from "react";
import type { Video, VideoListResponse, VideoListQueryParams, PaginationMeta } from "../../types";
import type { UseVideosResult } from "../types/view-models";

/**
 * Hook for fetching video list with filters and pagination
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Video list data, loading state, and refetch method
 */
export function useVideos(params: VideoListQueryParams): UseVideosResult {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query string
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.set("category", params.category);
      if (params.level) queryParams.set("level", params.level);
      if (params.is_premium !== undefined) queryParams.set("is_premium", params.is_premium.toString());
      if (params.status) queryParams.set("status", params.status);
      if (params.limit) queryParams.set("limit", params.limit.toString());
      if (params.offset) queryParams.set("offset", params.offset.toString());
      if (params.sort) queryParams.set("sort", params.sort);
      if (params.order) queryParams.set("order", params.order);

      const response = await fetch(`/api/videos?${queryParams.toString()}`);

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Invalid request parameters");
        } else if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        } else if (response.status === 500) {
          throw new Error("Wystąpił błąd serwera. Spróbuj ponownie później.");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data: VideoListResponse = await response.json();
      setVideos(data.data);
      setMeta(data.meta);
    } catch (err) {
      // Check for network errors
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError(new Error("Brak połączenia z internetem"));
      } else {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [
    params.category,
    params.level,
    params.is_premium,
    params.status,
    params.limit,
    params.offset,
    params.sort,
    params.order,
  ]);

  return {
    videos,
    isLoading,
    error,
    meta,
    refetch: fetchVideos,
  };
}
