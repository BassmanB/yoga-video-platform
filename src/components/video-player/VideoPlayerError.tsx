/**
 * VideoPlayerError Component
 *
 * Error display with retry functionality
 */

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoErrorType } from "@/types/video-player.types";

interface VideoPlayerErrorProps {
  error: VideoErrorType;
  message?: string;
  onRetry: () => void;
  className?: string;
}

export function VideoPlayerError({ error, message, onRetry, className = "" }: VideoPlayerErrorProps) {
  const shouldShowRetry = error !== "INVALID_URL" && error !== "NOT_FOUND";

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 p-8 ${className}`}
      style={{ minHeight: "400px" }}
      role="alert"
      aria-live="polite"
    >
      {/* Error icon */}
      <div className="mb-4 rounded-full bg-red-500/10 p-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
      </div>

      {/* Error message */}
      <h3 className="mb-2 text-xl font-semibold text-white">
        {error === "NOT_FOUND"
          ? "Nagranie nie znalezione"
          : error === "TIMEOUT"
            ? "Upłynął limit czasu"
            : error === "NETWORK_ERROR"
              ? "Błąd połączenia"
              : error === "PLAYBACK_ERROR"
                ? "Błąd odtwarzania"
                : error === "INVALID_URL"
                  ? "Nieprawidłowy adres"
                  : "Wystąpił błąd"}
      </h3>

      <p className="mb-6 max-w-md text-center text-sm text-slate-400">
        {message || "Nie udało się załadować nagrania. Spróbuj ponownie lub wróć do strony głównej."}
      </p>

      {/* Action buttons */}
      <div className="flex gap-3">
        {shouldShowRetry && (
          <Button onClick={onRetry} className="gap-2" variant="default" size="default">
            <RefreshCw className="h-4 w-4" />
            Spróbuj ponownie
          </Button>
        )}

        <Button
          onClick={handleGoHome}
          variant={shouldShowRetry ? "outline" : "default"}
          size="default"
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Strona główna
        </Button>
      </div>
    </div>
  );
}
