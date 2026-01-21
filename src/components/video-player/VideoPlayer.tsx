/**
 * VideoPlayer Component
 *
 * Wrapper for Plyr video player with full controls and configuration
 * Supports both free (public) and premium (signed) video URLs
 */

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

// Type-only import for Plyr types
interface PlyrOptions {
  controls: string[];
  settings?: string[];
  speed?: { selected: number; options: number[] };
  ratio?: string;
  loadSprite?: boolean;
  i18n?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlyrInstance = any;

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onError?: (error: Error) => void;
  onUrlExpired?: () => void;
  className?: string;
}

/**
 * Plyr configuration with Polish translations
 */
const getPlyrConfig = (): PlyrOptions => ({
  controls: ["play-large", "play", "progress", "current-time", "duration", "mute", "volume", "settings", "fullscreen"],
  settings: ["quality", "speed"],
  speed: {
    selected: 1,
    options: [0.5, 0.75, 1, 1.25, 1.5, 2],
  },
  ratio: "16:9",
  loadSprite: false,
  i18n: {
    play: "Odtwórz",
    pause: "Pauza",
    restart: "Zacznij od początku",
    rewind: "Cofnij {seektime}s",
    fastForward: "Przewiń {seektime}s",
    seek: "Przewiń",
    played: "Odtworzone",
    buffered: "Buforowane",
    currentTime: "Aktualny czas",
    duration: "Czas trwania",
    volume: "Głośność",
    mute: "Wycisz",
    unmute: "Wyłącz wyciszenie",
    enableCaptions: "Włącz napisy",
    disableCaptions: "Wyłącz napisy",
    enterFullscreen: "Pełny ekran",
    exitFullscreen: "Wyjdź z pełnego ekranu",
    settings: "Ustawienia",
    speed: "Prędkość",
    normal: "Normalna",
    quality: "Jakość",
    loop: "Zapętlenie",
    start: "Start",
    end: "Koniec",
    all: "Wszystkie",
    reset: "Resetuj",
    disabled: "Wyłączone",
    enabled: "Włączone",
    advertisement: "Reklama",
    qualityBadge: {
      2160: "4K",
      1440: "HD",
      1080: "HD",
      720: "HD",
      576: "SD",
      480: "SD",
    },
  },
});

export function VideoPlayer({ videoUrl, title, onError, onUrlExpired, className = "" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<PlyrInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Validate video URL
    try {
      new URL(videoUrl);
    } catch {
      // eslint-disable-next-line no-console
      console.error("[VideoPlayer] Invalid video URL:", videoUrl);
      setHasError(true);
      onError?.(new Error("Invalid video URL"));
      return;
    }

    // Dynamically import Plyr only on the client side
    let player: PlyrInstance | null = null;

    const initPlayer = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const Plyr = (await import("plyr")).default;
        // Import CSS dynamically
        await import("plyr/dist/plyr.css");

        if (!videoRef.current) return;

        // Initialize Plyr
        player = new Plyr(videoRef.current, getPlyrConfig());
        plyrRef.current = player;

        if (!player) return;

        // Set loading timeout (10 seconds)
        loadingTimeoutRef.current = setTimeout(() => {
          if (isLoading && player && !player.playing) {
            // eslint-disable-next-line no-console
            console.error("[VideoPlayer] Video loading timeout");
            setHasError(true);
            onError?.(new Error("Video loading timeout"));
          }
        }, 10000);

        // Event: Ready
        player.on("ready", () => {
          // eslint-disable-next-line no-console
          console.info("[VideoPlayer] Player ready");
          setIsLoading(false);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
        });

        // Event: Playing (clear loading state)
        player.on("playing", () => {
          setIsLoading(false);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
        });

        // Event: Error
        player.on("error", () => {
          // eslint-disable-next-line no-console
          console.error("[VideoPlayer] Playback error occurred");

          setIsLoading(false);
          setHasError(true);

          // Trigger error callback
          onError?.(new Error("Video playback error occurred"));
        });

        // Event: Buffering start
        player.on("waiting", () => {
          // eslint-disable-next-line no-console
          console.info("[VideoPlayer] Buffering...");
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[VideoPlayer] Failed to load Plyr:", error);
        setHasError(true);
        setIsLoading(false);
        onError?.(new Error("Failed to load video player"));
      }
    };

    // Initialize player
    initPlayer();

    // Cleanup
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (player) {
        player.destroy();
      }
      plyrRef.current = null;
    };
  }, [videoUrl, onError, onUrlExpired, isLoading]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-slate-800 ${className}`}
        style={{ aspectRatio: "16 / 9" }}
      >
        <p className="text-sm text-slate-400">Nie udało się załadować odtwarzacza</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Video element */}
      <video ref={videoRef} className="w-full rounded-lg" playsInline controls crossOrigin="anonymous">
        <source src={videoUrl} type="video/mp4" />
        <track kind="captions" />
        Twoja przeglądarka nie obsługuje odtwarzacza wideo.
      </video>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
            <p className="text-sm text-slate-300">Ładowanie wideo...</p>
          </div>
        </div>
      )}

      {/* Accessibility: Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading ? "Ładowanie wideo" : `Odtwarzacz wideo: ${title}`}
      </div>
    </div>
  );
}
