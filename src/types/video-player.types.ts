/**
 * ViewModel Types for Video Player View
 *
 * This file contains all types specific to the video player feature.
 * These types extend the base types from src/types.ts
 */

import type { Video, UserRole } from "@/types";

// ============================================================================
// VIDEO PLAYER STATE
// ============================================================================

/**
 * Stan widoku odtwarzacza wideo
 */
export interface VideoPlayerState {
  // Dane nagrania
  video: Video | null;

  // URL do odtwarzania (public lub signed)
  videoUrl: string | null;

  // Stany ładowania
  isLoading: boolean;
  isLoadingUrl: boolean;

  // Stan błędu
  error: VideoError | null;

  // Stan dostępu
  hasAccess: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Typ błędu odtwarzacza
 */
export type VideoErrorType =
  | "NOT_FOUND" // Nagranie nie istnieje lub brak dostępu (404)
  | "NETWORK_ERROR" // Błąd sieci podczas fetch
  | "TIMEOUT" // Przekroczenie timeout (10s)
  | "PLAYBACK_ERROR" // Błąd podczas odtwarzania wideo
  | "INVALID_URL" // Nieprawidłowy URL wideo
  | "UNKNOWN"; // Nieznany błąd

/**
 * Obiekt błędu wideo
 */
export interface VideoError {
  type: VideoErrorType;
  message: string;
  details?: unknown;
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

/**
 * Wynik sprawdzenia dostępu do nagrania
 */
export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: "PREMIUM_REQUIRED" | "NOT_PUBLISHED" | "ARCHIVED";
  requiredRole?: UserRole;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Sformatowany czas trwania
 */
export interface FormattedDuration {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string; // np. "15:30" lub "1:15:30"
}

/**
 * Konfiguracja Plyr player
 */
export interface PlyrConfig {
  controls: string[];
  speed: { selected: number; options: number[] };
  ratio: string;
  loadSprite: boolean;
  i18n: PlyrI18n;
}

/**
 * Polskie tłumaczenia dla Plyr
 */
export interface PlyrI18n {
  play: string;
  pause: string;
  restart: string;
  rewind: string;
  fastForward: string;
  seek: string;
  played: string;
  buffered: string;
  currentTime: string;
  duration: string;
  volume: string;
  mute: string;
  unmute: string;
  enableCaptions: string;
  disableCaptions: string;
  enterFullscreen: string;
  exitFullscreen: string;
  settings: string;
  speed: string;
  normal: string;
  quality: string;
}
