/**
 * useFilters hook
 *
 * Manages filter state and synchronizes with URL query parameters
 */

import { useState, useCallback } from "react";
import type { VideoCategory, VideoLevel } from "../../types";
import { isVideoCategory, isVideoLevel } from "../../types";
import type { FilterState, UseFiltersResult } from "../types/view-models";

interface UseFiltersOptions {
  initialCategory?: string | null;
  initialLevel?: string | null;
}

/**
 * Hook for managing video filters with URL synchronization
 *
 * @param options - Initial filter values from URL
 * @returns Filter state and methods
 */
export function useFilters(options: UseFiltersOptions = {}): UseFiltersResult {
  const [filters, setFilters] = useState<FilterState>({
    category: isVideoCategory(options.initialCategory || "") ? (options.initialCategory as VideoCategory) : null,
    level: isVideoLevel(options.initialLevel || "") ? (options.initialLevel as VideoLevel) : null,
  });

  /**
   * Update URL when filters change
   */
  const updateURL = useCallback((newFilters: FilterState) => {
    const url = new URL(window.location.href);

    if (newFilters.category) {
      url.searchParams.set("category", newFilters.category);
    } else {
      url.searchParams.delete("category");
    }

    if (newFilters.level) {
      url.searchParams.set("level", newFilters.level);
    } else {
      url.searchParams.delete("level");
    }

    window.history.pushState({}, "", url);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("filterchange"));
  }, []);

  /**
   * Set category filter
   */
  const setCategory = useCallback(
    (category: VideoCategory | null) => {
      const newFilters = { ...filters, category };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  /**
   * Set level filter
   */
  const setLevel = useCallback(
    (level: VideoLevel | null) => {
      const newFilters = { ...filters, level };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    const newFilters = { category: null, level: null };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [updateURL]);

  const hasActiveFilters = filters.category !== null || filters.level !== null;

  return {
    filters,
    setCategory,
    setLevel,
    clearFilters,
    hasActiveFilters,
  };
}
