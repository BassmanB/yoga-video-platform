/**
 * PremiumGate Component
 *
 * Overlay displayed when user tries to access premium content without proper permissions
 * Shows blurred thumbnail, video info, and CTA to contact admin
 */

import { useEffect } from "react";
import { Lock, Mail, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Video } from "@/types";

interface PremiumGateProps {
  video: Video;
  contactEmail?: string;
  onDismiss?: () => void;
  className?: string;
}

const DEFAULT_CONTACT_EMAIL = "kontakt@yoga-platform.pl";

export function PremiumGate({
  video,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  onDismiss,
  className = "",
}: PremiumGateProps) {
  // Handle ESC key to dismiss
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onDismiss) {
        onDismiss();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onDismiss]);

  const handleContactClick = () => {
    const subject = encodeURIComponent(`Zapytanie o dostęp premium - ${video.title}`);
    const body = encodeURIComponent(
      `Witam,\n\nChciałbym/Chciałabym uzyskać dostęp do nagrania premium:\n\nTytuł: ${video.title}\nID: ${video.id}\n\nProszę o informacje dotyczące dostępu.\n\nPozdrawiam`
    );

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const truncatedDescription =
    video.description && video.description.length > 150
      ? video.description.substring(0, 150) + "..."
      : video.description || "Brak opisu";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-gate-title"
      aria-describedby="premium-gate-description"
    >
      {/* Blurred background thumbnail */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl"
        style={{ backgroundImage: `url(${video.thumbnail_url})` }}
        aria-hidden="true"
      />

      {/* Content card */}
      <Card className="relative z-10 mx-4 w-full max-w-lg border-slate-700 bg-slate-900/95">
        <CardHeader className="text-center">
          {/* Lock icon */}
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10"
            aria-hidden="true"
          >
            <Lock className="h-8 w-8 text-purple-400" />
          </div>

          <CardTitle id="premium-gate-title" className="text-2xl text-white">
            Treść Premium
          </CardTitle>
          <CardDescription id="premium-gate-description" className="text-slate-400">
            Ta treść jest dostępna tylko dla użytkowników premium
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Video info */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <h3 className="mb-2 font-semibold text-white">{video.title}</h3>
            <p className="text-sm text-slate-400">{truncatedDescription}</p>
          </div>

          {/* Info message */}
          <p className="text-center text-sm text-slate-300">
            Aby uzyskać dostęp do tej i innych treści premium, skontaktuj się z administratorem platformy.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {/* Primary CTA - Contact */}
          <Button onClick={handleContactClick} className="w-full gap-2" size="lg" variant="default">
            <Mail className="h-4 w-4" />
            Skontaktuj się aby uzyskać dostęp
          </Button>

          {/* Secondary - Go home */}
          <Button onClick={handleGoHome} className="w-full gap-2" size="default" variant="outline">
            <Home className="h-4 w-4" />
            Powrót do strony głównej
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
