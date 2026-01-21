/**
 * Video API Client
 *
 * Client-side functions for fetching video data and generating playback URLs.
 * These functions are designed to be used in React components with proper error handling.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { Video, VideoResponse, ErrorResponse } from "@/types";
import type { VideoError } from "@/types/video-player.types";
import { isValidUUID, getErrorMessage } from "@/lib/utils/video.utils";
import { getVideoUrl } from "@/lib/utils/storage.utils";

/**
 * Timeout dla operacji fetch (10 sekund)
 */
const FETCH_TIMEOUT = 10000;

/**
 * Tworzy obiekt VideoError na podstawie różnych typów błędów
 */
function createVideoError(error: unknown, defaultType: VideoError["type"] = "UNKNOWN"): VideoError {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return {
        type: "TIMEOUT",
        message: getErrorMessage("TIMEOUT"),
        details: error,
      };
    }

    return {
      type: defaultType,
      message: error.message || getErrorMessage(defaultType),
      details: error,
    };
  }

  return {
    type: defaultType,
    message: getErrorMessage(defaultType),
    details: error,
  };
}

/**
 * Pobiera dane nagrania z API
 *
 * Ta funkcja wykonuje request do endpoint'u API (nie bezpośrednio do Supabase),
 * co pozwala na centralizację logiki biznesowej i RLS w endpoincie.
 *
 * @param videoId - UUID nagrania
 * @returns Promise z danymi nagrania
 * @throws VideoError w przypadku błędu (NOT_FOUND, TIMEOUT, NETWORK_ERROR, INVALID_URL)
 *
 * @example
 * try {
 *   const video = await fetchVideoById("550e8400-e29b-41d4-a716-446655440000");
 *   console.log(video.title);
 * } catch (error) {
 *   if (error.type === "NOT_FOUND") {
 *     // Obsługa 404
 *   }
 * }
 */
export async function fetchVideoById(videoId: string): Promise<Video> {
  // Walidacja UUID
  if (!isValidUUID(videoId)) {
    throw createVideoError(new Error("Invalid video ID format"), "INVALID_URL");
  }

  // Konfiguracja timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(`/api/videos/${videoId}`, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    // Obsługa błędów HTTP
    if (!response.ok) {
      if (response.status === 404) {
        throw createVideoError(new Error("Video not found or you don't have access"), "NOT_FOUND");
      }

      if (response.status === 403) {
        const errorData: ErrorResponse = await response.json();
        throw createVideoError(
          new Error(errorData.error.message),
          "NOT_FOUND" // 403 traktujemy jako NOT_FOUND dla bezpieczeństwa
        );
      }

      // Inne błędy HTTP
      throw createVideoError(new Error(`HTTP ${response.status}: ${response.statusText}`), "NETWORK_ERROR");
    }

    const data: VideoResponse = await response.json();
    return data.data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Przekaż VideoError jeśli już został utworzony
    if (error && typeof error === "object" && "type" in error && "message" in error) {
      throw error;
    }

    // Obsługa timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw createVideoError(error, "TIMEOUT");
    }

    // Obsługa innych błędów sieciowych
    throw createVideoError(error as Error, "NETWORK_ERROR");
  }
}

/**
 * Generuje URL do odtwarzania wideo
 *
 * Dla free content zwraca publiczny URL.
 * Dla premium content zwraca signed URL ważny przez 1 godzinę.
 *
 * @param video - Obiekt nagrania
 * @param supabase - Klient Supabase (dla auth token i storage access)
 * @returns Promise z URL do wideo
 * @throws VideoError w przypadku błędu generowania URL
 *
 * @example
 * const videoUrl = await generateVideoUrl(video, supabase);
 * // videoUrl: "https://...supabase.co/storage/v1/object/public/videos-free/..."
 */
export async function generateVideoUrl(video: Video, supabase: SupabaseClient<Database>): Promise<string> {
  try {
    const url = await getVideoUrl(video.video_url, video.is_premium, supabase);

    if (!url) {
      throw new Error("Failed to generate video URL");
    }

    return url;
  } catch (error) {
    throw createVideoError(error as Error, "INVALID_URL");
  }
}

/**
 * Regeneruje signed URL dla premium content
 *
 * Używane gdy signed URL wygaśnie podczas odtwarzania (po 1h).
 * Funkcja jest identyczna z generateVideoUrl, ale ma wyraźną nazwę dla celów debugowania.
 *
 * @param video - Obiekt nagrania
 * @param supabase - Klient Supabase
 * @returns Promise z nowym signed URL
 * @throws VideoError w przypadku błędu
 */
export async function regenerateVideoUrl(video: Video, supabase: SupabaseClient<Database>): Promise<string> {
  console.info(`[API] Regenerating video URL for: ${video.id} (premium: ${video.is_premium})`);
  return generateVideoUrl(video, supabase);
}

/**
 * Pobiera thumbnail URL dla nagrania
 *
 * Funkcja pomocnicza - thumbnail URL jest już generowany przez video.service.ts,
 * ale ta funkcja może być użyta jeśli potrzebujemy go ponownie wygenerować.
 *
 * @param video - Obiekt nagrania
 * @returns Pełny URL do miniatury (już jest w video.thumbnail_url po transformacji)
 */
export function getVideoThumbnailUrl(video: Video): string {
  return video.thumbnail_url; // Already transformed by video.service.ts
}
