/**
 * Utility functions for video player feature
 */

import type { Video, UserRole } from "@/types";
import type { AccessCheckResult, FormattedDuration } from "@/types/video-player.types";

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * UUID v4 regex pattern
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Sprawdza czy string jest prawidłowym UUID v4
 *
 * @param id - String do walidacji
 * @returns true jeśli to prawidłowy UUID v4
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false;
  }
  return UUID_REGEX.test(id);
}

/**
 * Sprawdza czy string jest prawidłowym HTTP(S) URL
 *
 * @param url - String do walidacji
 * @returns true jeśli to prawidłowy HTTP(S) URL
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

/**
 * Sprawdza czy użytkownik ma dostęp do nagrania
 *
 * Zasady dostępu:
 * 1. Admin ma dostęp do wszystkich nagrań (nawet draft/archived)
 * 2. Nagranie musi być opublikowane (status = 'published') dla użytkowników niebędących adminem
 * 3. Free content jest dostępne dla wszystkich
 * 4. Premium content wymaga roli 'premium' lub 'admin'
 *
 * @param video - Obiekt nagrania
 * @param userRole - Rola użytkownika (może być null dla niezalogowanych)
 * @returns Wynik sprawdzenia dostępu
 */
export function canAccessVideo(video: Video, userRole: UserRole | null): AccessCheckResult {
  // 1. Admin widzi wszystko
  if (userRole === "admin") {
    return { hasAccess: true };
  }

  // 2. Nagranie musi być opublikowane
  if (video.status !== "published") {
    return {
      hasAccess: false,
      reason: video.status === "archived" ? "ARCHIVED" : "NOT_PUBLISHED",
    };
  }

  // 3. Free content - wszyscy mają dostęp
  if (!video.is_premium) {
    return { hasAccess: true };
  }

  // 4. Premium content - wymagana rola premium
  if (userRole === "premium") {
    return { hasAccess: true };
  }

  // 5. Brak dostępu do premium content
  return {
    hasAccess: false,
    reason: "PREMIUM_REQUIRED",
    requiredRole: "premium",
  };
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formatuje czas trwania w sekundach do czytelnej formy
 *
 * @param seconds - Czas w sekundach
 * @returns Sformatowany czas trwania
 *
 * @example
 * formatDuration(90) // { hours: 0, minutes: 1, seconds: 30, formatted: "1:30" }
 * formatDuration(3665) // { hours: 1, minutes: 1, seconds: 5, formatted: "1:01:05" }
 */
export function formatDuration(seconds: number): FormattedDuration {
  if (!seconds || seconds < 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "0:00",
    };
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  // Formatowanie z zerami wiodącymi
  const pad = (num: number): string => num.toString().padStart(2, "0");

  let formatted: string;
  if (hours > 0) {
    // Format: H:MM:SS
    formatted = `${hours}:${pad(minutes)}:${pad(secs)}`;
  } else {
    // Format: M:SS lub MM:SS
    formatted = `${minutes}:${pad(secs)}`;
  }

  return {
    hours,
    minutes,
    seconds: secs,
    formatted,
  };
}

/**
 * Zwraca kategorię wideo w czytelnej formie po polsku
 *
 * @param category - Kategoria wideo
 * @returns Polska nazwa kategorii
 */
export function getCategoryLabel(category: "yoga" | "mobility" | "calisthenics"): string {
  const labels = {
    yoga: "Yoga",
    mobility: "Mobilność",
    calisthenics: "Kalistenika",
  };

  return labels[category] || category;
}

/**
 * Zwraca poziom trudności w czytelnej formie po polsku
 *
 * @param level - Poziom trudności
 * @returns Polska nazwa poziomu
 */
export function getLevelLabel(level: "beginner" | "intermediate" | "advanced"): string {
  const labels = {
    beginner: "Początkujący",
    intermediate: "Średniozaawansowany",
    advanced: "Zaawansowany",
  };

  return labels[level] || level;
}

/**
 * Zwraca kolor Tailwind dla kategorii (do użycia w badges)
 *
 * @param category - Kategoria wideo
 * @returns Klasy Tailwind dla koloru tła i tekstu
 */
export function getCategoryColor(category: "yoga" | "mobility" | "calisthenics"): string {
  const colors = {
    yoga: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    mobility: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    calisthenics: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  };

  return colors[category] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
}

/**
 * Zwraca kolor Tailwind dla poziomu trudności (do użycia w badges)
 *
 * @param level - Poziom trudności
 * @returns Klasy Tailwind dla koloru tła i tekstu
 */
export function getLevelColor(level: "beginner" | "intermediate" | "advanced"): string {
  const colors = {
    beginner: "bg-green-500/20 text-green-300 border-green-500/30",
    intermediate: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    advanced: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return colors[level] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Tworzy przyjazny dla użytkownika komunikat błędu na podstawie typu błędu
 *
 * @param errorType - Typ błędu
 * @returns Komunikat błędu po polsku
 */
export function getErrorMessage(
  errorType: "NOT_FOUND" | "NETWORK_ERROR" | "TIMEOUT" | "PLAYBACK_ERROR" | "INVALID_URL" | "UNKNOWN"
): string {
  const messages = {
    NOT_FOUND: "Nagranie nie zostało znalezione lub nie masz do niego dostępu.",
    NETWORK_ERROR: "Wystąpił błąd połączenia. Spróbuj ponownie.",
    TIMEOUT: "Nie udało się załadować nagrania. Sprawdź połączenie internetowe.",
    PLAYBACK_ERROR: "Nie udało się odtworzyć wideo. Spróbuj ponownie.",
    INVALID_URL: "Nieprawidłowy adres nagrania.",
    UNKNOWN: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
  };

  return messages[errorType] || messages.UNKNOWN;
}
