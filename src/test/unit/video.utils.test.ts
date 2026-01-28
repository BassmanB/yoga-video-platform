/**
 * Unit tests for video.utils.ts
 *
 * Tests cover validation utilities, access control, formatting, and error handling
 * with focus on business rules and edge cases.
 */

import { describe, it, expect } from "vitest";
import {
  isValidUUID,
  isValidVideoUrl,
  canAccessVideo,
  formatDuration,
  getCategoryLabel,
  getLevelLabel,
  getCategoryColor,
  getLevelColor,
  getErrorMessage,
} from "@/lib/utils/video.utils";
import type { Video } from "@/types";

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

describe("isValidUUID", () => {
  describe("valid UUIDs", () => {
    it("should accept valid UUID v4 with lowercase letters", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("should accept valid UUID v4 with uppercase letters", () => {
      expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
    });

    it("should accept valid UUID v4 with mixed case", () => {
      expect(isValidUUID("550e8400-E29B-41d4-A716-446655440000")).toBe(true);
    });

    it("should accept UUID with variant bits (8,9,a,b in 4th group)", () => {
      expect(isValidUUID("123e4567-e89b-42d3-8456-426614174000")).toBe(true);
      expect(isValidUUID("123e4567-e89b-42d3-9456-426614174000")).toBe(true);
      expect(isValidUUID("123e4567-e89b-42d3-a456-426614174000")).toBe(true);
      expect(isValidUUID("123e4567-e89b-42d3-b456-426614174000")).toBe(true);
    });
  });

  describe("invalid UUIDs", () => {
    it("should reject empty string", () => {
      expect(isValidUUID("")).toBe(false);
    });

    it("should reject non-string values", () => {
      expect(isValidUUID(null as unknown as string)).toBe(false);
      expect(isValidUUID(undefined as unknown as string)).toBe(false);
      expect(isValidUUID(123 as unknown as string)).toBe(false);
      expect(isValidUUID({} as unknown as string)).toBe(false);
    });

    it("should reject UUID without hyphens", () => {
      expect(isValidUUID("550e8400e29b41d4a716446655440000")).toBe(false);
    });

    it("should reject UUID with wrong format", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716")).toBe(false);
      expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000-extra")).toBe(false);
    });

    it("should reject UUID v1/v2/v3/v5 (not v4)", () => {
      expect(isValidUUID("550e8400-e29b-11d4-a716-446655440000")).toBe(false); // v1
      expect(isValidUUID("550e8400-e29b-21d4-a716-446655440000")).toBe(false); // v2
      expect(isValidUUID("550e8400-e29b-31d4-a716-446655440000")).toBe(false); // v3
      expect(isValidUUID("550e8400-e29b-51d4-a716-446655440000")).toBe(false); // v5
    });

    it("should reject strings with invalid characters", () => {
      expect(isValidUUID("550e8400-e29b-41d4-a716-44665544000g")).toBe(false);
      expect(isValidUUID("550e8400-e29b-41d4-a716-44665544000!")).toBe(false);
    });

    it("should reject UUID with wrong variant bits", () => {
      expect(isValidUUID("123e4567-e89b-42d3-0456-426614174000")).toBe(false); // starts with 0
      expect(isValidUUID("123e4567-e89b-42d3-c456-426614174000")).toBe(false); // starts with c
    });
  });
});

describe("isValidVideoUrl", () => {
  describe("valid URLs", () => {
    it("should accept HTTP URLs", () => {
      expect(isValidVideoUrl("http://example.com/video.mp4")).toBe(true);
    });

    it("should accept HTTPS URLs", () => {
      expect(isValidVideoUrl("https://example.com/video.mp4")).toBe(true);
    });

    it("should accept URLs with port numbers", () => {
      expect(isValidVideoUrl("http://localhost:3000/video.mp4")).toBe(true);
    });

    it("should accept URLs with query parameters", () => {
      expect(isValidVideoUrl("https://example.com/video.mp4?quality=high")).toBe(true);
    });

    it("should accept URLs with fragments", () => {
      expect(isValidVideoUrl("https://example.com/video.mp4#section")).toBe(true);
    });

    it("should accept URLs with paths", () => {
      expect(isValidVideoUrl("https://example.com/videos/subfolder/video.mp4")).toBe(true);
    });
  });

  describe("invalid URLs", () => {
    it("should reject empty string", () => {
      expect(isValidVideoUrl("")).toBe(false);
    });

    it("should reject non-string values", () => {
      expect(isValidVideoUrl(null as unknown as string)).toBe(false);
      expect(isValidVideoUrl(undefined as unknown as string)).toBe(false);
      expect(isValidVideoUrl(123 as unknown as string)).toBe(false);
    });

    it("should reject relative URLs", () => {
      expect(isValidVideoUrl("/videos/video.mp4")).toBe(false);
      expect(isValidVideoUrl("videos/video.mp4")).toBe(false);
    });

    it("should reject URLs with wrong protocol", () => {
      expect(isValidVideoUrl("ftp://example.com/video.mp4")).toBe(false);
      expect(isValidVideoUrl("file:///video.mp4")).toBe(false);
      expect(isValidVideoUrl("data:video/mp4;base64,ABC")).toBe(false);
    });

    it("should reject malformed URLs", () => {
      expect(isValidVideoUrl("not a url")).toBe(false);
      expect(isValidVideoUrl("http://")).toBe(false);
      expect(isValidVideoUrl("://example.com")).toBe(false);
    });

    it("should reject javascript: URLs (security)", () => {
      expect(isValidVideoUrl("javascript:alert(1)")).toBe(false);
    });
  });
});

// ============================================================================
// ACCESS CONTROL - Business Rules
// ============================================================================

describe("canAccessVideo", () => {
  describe("admin access rules", () => {
    it("should allow admin to access published free content", () => {
      const video: Video = {
        id: "test-id",
        title: "Test",
        description: null,
        category: "yoga",
        level: "beginner",
        duration: 600,
        video_url: "test.mp4",
        thumbnail_url: "test.jpg",
        is_premium: false,
        status: "published",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = canAccessVideo(video, "admin");
      expect(result).toEqual({ hasAccess: true });
    });

    it("should allow admin to access draft content", () => {
      const video = {
        status: "draft",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, "admin");
      expect(result).toEqual({ hasAccess: true });
    });

    it("should allow admin to access archived content", () => {
      const video = {
        status: "archived",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, "admin");
      expect(result).toEqual({ hasAccess: true });
    });

    it("should allow admin to access premium content", () => {
      const video = {
        status: "published",
        is_premium: true,
      } as Video;

      const result = canAccessVideo(video, "admin");
      expect(result).toEqual({ hasAccess: true });
    });
  });

  describe("status-based access rules", () => {
    it("should block draft content for free users", () => {
      const video = {
        status: "draft",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, "free");
      expect(result).toEqual({
        hasAccess: false,
        reason: "NOT_PUBLISHED",
      });
    });

    it("should block draft content for premium users", () => {
      const video = {
        status: "draft",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, "premium");
      expect(result).toEqual({
        hasAccess: false,
        reason: "NOT_PUBLISHED",
      });
    });

    it("should block archived content for free users", () => {
      const video = {
        status: "archived",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, "free");
      expect(result).toEqual({
        hasAccess: false,
        reason: "ARCHIVED",
      });
    });

    it("should block archived content for premium users", () => {
      const video = {
        status: "archived",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, "premium");
      expect(result).toEqual({
        hasAccess: false,
        reason: "ARCHIVED",
      });
    });

    it("should block draft content for unauthenticated users", () => {
      const video = {
        status: "draft",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, null);
      expect(result).toEqual({
        hasAccess: false,
        reason: "NOT_PUBLISHED",
      });
    });
  });

  describe("free content access rules", () => {
    it("should allow unauthenticated users to access published free content", () => {
      const video = {
        status: "published",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, null);
      expect(result).toEqual({ hasAccess: true });
    });

    it("should allow free users to access published free content", () => {
      const video = {
        status: "published",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, "free");
      expect(result).toEqual({ hasAccess: true });
    });

    it("should allow premium users to access published free content", () => {
      const video = {
        status: "published",
        is_premium: false,
      } as Video;

      const result = canAccessVideo(video, "premium");
      expect(result).toEqual({ hasAccess: true });
    });
  });

  describe("premium content access rules", () => {
    it("should block premium content for unauthenticated users", () => {
      const video = {
        status: "published",
        is_premium: true,
      } as Video;

      const result = canAccessVideo(video, null);
      expect(result).toEqual({
        hasAccess: false,
        reason: "PREMIUM_REQUIRED",
        requiredRole: "premium",
      });
    });

    it("should block premium content for free users", () => {
      const video = {
        status: "published",
        is_premium: true,
      } as Video;

      const result = canAccessVideo(video, "free");
      expect(result).toEqual({
        hasAccess: false,
        reason: "PREMIUM_REQUIRED",
        requiredRole: "premium",
      });
    });

    it("should allow premium users to access premium content", () => {
      const video = {
        status: "published",
        is_premium: true,
      } as Video;

      const result = canAccessVideo(video, "premium");
      expect(result).toEqual({ hasAccess: true });
    });
  });

  describe("edge cases", () => {
    it("should prioritize admin access over status checks", () => {
      const video = {
        status: "draft",
        is_premium: true,
      } as Video;

      const result = canAccessVideo(video, "admin");
      expect(result).toEqual({ hasAccess: true });
    });

    it("should prioritize status checks over premium checks", () => {
      const video = {
        status: "draft",
        is_premium: true,
      } as Video;

      const result = canAccessVideo(video, "premium");
      expect(result).toEqual({
        hasAccess: false,
        reason: "NOT_PUBLISHED",
      });
    });
  });
});

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

describe("formatDuration", () => {
  describe("edge cases", () => {
    it("should handle zero seconds", () => {
      const result = formatDuration(0);
      expect(result).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        formatted: "0:00",
      });
    });

    it("should handle negative numbers gracefully", () => {
      const result = formatDuration(-100);
      expect(result).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        formatted: "0:00",
      });
    });

    it("should handle null/undefined as zero", () => {
      expect(formatDuration(null as unknown as number).formatted).toBe("0:00");
      expect(formatDuration(undefined as unknown as number).formatted).toBe("0:00");
    });

    it("should handle NaN as zero", () => {
      expect(formatDuration(NaN).formatted).toBe("0:00");
    });
  });

  describe("short durations (< 1 hour)", () => {
    it("should format 1 second", () => {
      const result = formatDuration(1);
      expect(result).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 1,
        formatted: "0:01",
      });
    });

    it("should format 59 seconds", () => {
      const result = formatDuration(59);
      expect(result).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 59,
        formatted: "0:59",
      });
    });

    it("should format exactly 1 minute", () => {
      const result = formatDuration(60);
      expect(result).toEqual({
        hours: 0,
        minutes: 1,
        seconds: 0,
        formatted: "1:00",
      });
    });

    it("should format 1 minute 30 seconds", () => {
      const result = formatDuration(90);
      expect(result).toEqual({
        hours: 0,
        minutes: 1,
        seconds: 30,
        formatted: "1:30",
      });
    });

    it("should format 59 minutes 59 seconds", () => {
      const result = formatDuration(3599);
      expect(result).toEqual({
        hours: 0,
        minutes: 59,
        seconds: 59,
        formatted: "59:59",
      });
    });

    it("should pad seconds with leading zero", () => {
      const result = formatDuration(65);
      expect(result.formatted).toBe("1:05");
    });

    it("should not pad minutes with leading zero when < 1 hour", () => {
      const result = formatDuration(540); // 9 minutes
      expect(result.formatted).toBe("9:00");
    });
  });

  describe("long durations (>= 1 hour)", () => {
    it("should format exactly 1 hour", () => {
      const result = formatDuration(3600);
      expect(result).toEqual({
        hours: 1,
        minutes: 0,
        seconds: 0,
        formatted: "1:00:00",
      });
    });

    it("should format 1 hour 1 minute 1 second", () => {
      const result = formatDuration(3661);
      expect(result).toEqual({
        hours: 1,
        minutes: 1,
        seconds: 1,
        formatted: "1:01:01",
      });
    });

    it("should format 1 hour 1 minute 5 seconds", () => {
      const result = formatDuration(3665);
      expect(result).toEqual({
        hours: 1,
        minutes: 1,
        seconds: 5,
        formatted: "1:01:05",
      });
    });

    it("should format 2 hours", () => {
      const result = formatDuration(7200);
      expect(result).toEqual({
        hours: 2,
        minutes: 0,
        seconds: 0,
        formatted: "2:00:00",
      });
    });

    it("should format very long duration", () => {
      const result = formatDuration(10800); // 3 hours
      expect(result).toEqual({
        hours: 3,
        minutes: 0,
        seconds: 0,
        formatted: "3:00:00",
      });
    });

    it("should pad minutes with leading zero when >= 1 hour", () => {
      const result = formatDuration(3900); // 1 hour 5 minutes
      expect(result.formatted).toBe("1:05:00");
    });

    it("should pad seconds with leading zero", () => {
      const result = formatDuration(3605); // 1:00:05
      expect(result.formatted).toBe("1:00:05");
    });
  });

  describe("decimal seconds", () => {
    it("should floor decimal seconds", () => {
      const result = formatDuration(90.7);
      expect(result).toEqual({
        hours: 0,
        minutes: 1,
        seconds: 30,
        formatted: "1:30",
      });
    });

    it("should not round up seconds", () => {
      const result = formatDuration(90.9);
      expect(result.seconds).toBe(30);
    });
  });
});

describe("getCategoryLabel", () => {
  it("should return label for yoga", () => {
    expect(getCategoryLabel("yoga")).toBe("Yoga");
  });

  it("should return label for mobility", () => {
    expect(getCategoryLabel("mobility")).toBe("Mobilność");
  });

  it("should return label for calisthenics", () => {
    expect(getCategoryLabel("calisthenics")).toBe("Kalistenika");
  });

  it("should return original value for unknown category", () => {
    expect(getCategoryLabel("unknown" as never)).toBe("unknown");
  });
});

describe("getLevelLabel", () => {
  it("should return label for beginner", () => {
    expect(getLevelLabel("beginner")).toBe("Początkujący");
  });

  it("should return label for intermediate", () => {
    expect(getLevelLabel("intermediate")).toBe("Średniozaawansowany");
  });

  it("should return label for advanced", () => {
    expect(getLevelLabel("advanced")).toBe("Zaawansowany");
  });

  it("should return original value for unknown level", () => {
    expect(getLevelLabel("unknown" as never)).toBe("unknown");
  });
});

describe("getCategoryColor", () => {
  it("should return purple colors for yoga", () => {
    const colors = getCategoryColor("yoga");
    expect(colors).toContain("purple");
  });

  it("should return blue colors for mobility", () => {
    const colors = getCategoryColor("mobility");
    expect(colors).toContain("blue");
  });

  it("should return orange colors for calisthenics", () => {
    const colors = getCategoryColor("calisthenics");
    expect(colors).toContain("orange");
  });

  it("should return slate colors for unknown category", () => {
    const colors = getCategoryColor("unknown" as never);
    expect(colors).toContain("slate");
  });

  it("should include Tailwind class structure", () => {
    const colors = getCategoryColor("yoga");
    expect(colors).toMatch(/bg-\w+/);
    expect(colors).toMatch(/text-\w+/);
    expect(colors).toMatch(/border-\w+/);
  });
});

describe("getLevelColor", () => {
  it("should return green colors for beginner", () => {
    const colors = getLevelColor("beginner");
    expect(colors).toContain("green");
  });

  it("should return yellow colors for intermediate", () => {
    const colors = getLevelColor("intermediate");
    expect(colors).toContain("yellow");
  });

  it("should return red colors for advanced", () => {
    const colors = getLevelColor("advanced");
    expect(colors).toContain("red");
  });

  it("should return slate colors for unknown level", () => {
    const colors = getLevelColor("unknown" as never);
    expect(colors).toContain("slate");
  });

  it("should include Tailwind class structure", () => {
    const colors = getLevelColor("beginner");
    expect(colors).toMatch(/bg-\w+/);
    expect(colors).toMatch(/text-\w+/);
    expect(colors).toMatch(/border-\w+/);
  });
});

// ============================================================================
// ERROR UTILITIES
// ============================================================================

describe("getErrorMessage", () => {
  it("should return message for NOT_FOUND", () => {
    const message = getErrorMessage("NOT_FOUND");
    expect(message).toBe("Nagranie nie zostało znalezione lub nie masz do niego dostępu.");
  });

  it("should return message for NETWORK_ERROR", () => {
    const message = getErrorMessage("NETWORK_ERROR");
    expect(message).toBe("Wystąpił błąd połączenia. Spróbuj ponownie.");
  });

  it("should return message for TIMEOUT", () => {
    const message = getErrorMessage("TIMEOUT");
    expect(message).toBe("Nie udało się załadować nagrania. Sprawdź połączenie internetowe.");
  });

  it("should return message for PLAYBACK_ERROR", () => {
    const message = getErrorMessage("PLAYBACK_ERROR");
    expect(message).toBe("Nie udało się odtworzyć wideo. Spróbuj ponownie.");
  });

  it("should return message for INVALID_URL", () => {
    const message = getErrorMessage("INVALID_URL");
    expect(message).toBe("Nieprawidłowy adres nagrania.");
  });

  it("should return message for UNKNOWN", () => {
    const message = getErrorMessage("UNKNOWN");
    expect(message).toBe("Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
  });

  it("should return UNKNOWN message for unrecognized error type", () => {
    const message = getErrorMessage("UNRECOGNIZED_ERROR" as never);
    expect(message).toBe("Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
  });

  it("should return user-friendly messages in Polish", () => {
    const errors: ("NOT_FOUND" | "NETWORK_ERROR" | "TIMEOUT" | "PLAYBACK_ERROR" | "INVALID_URL" | "UNKNOWN")[] = [
      "NOT_FOUND",
      "NETWORK_ERROR",
      "TIMEOUT",
      "PLAYBACK_ERROR",
      "INVALID_URL",
      "UNKNOWN",
    ];

    errors.forEach((errorType) => {
      const message = getErrorMessage(errorType);
      expect(message).toBeTruthy();
      expect(typeof message).toBe("string");
      expect(message.length).toBeGreaterThan(10);
    });
  });
});
