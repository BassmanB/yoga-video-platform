/**
 * ResendEmailButton component
 *
 * Button to resend magic link with rate limiting
 * - 60 second cooldown timer
 * - Visual countdown display
 * - Disabled state during cooldown
 */

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ResendEmailButtonProps {
  email: string;
}

const COOLDOWN_SECONDS = 60;

export function ResendEmailButton({ email }: ResendEmailButtonProps) {
  const [isResending, setIsResending] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleResend = async () => {
    if (cooldownRemaining > 0 || isResending) return;

    try {
      setIsResending(true);

      // TODO: Replace with actual API call to resend magic link
      // This is a placeholder for UI implementation
      console.log("Resending magic link to:", email);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Link wysłany ponownie", {
        description: "Sprawdź swoją skrzynkę email",
      });

      // Start cooldown
      setCooldownRemaining(COOLDOWN_SECONDS);
    } catch (error) {
      toast.error("Nie udało się wysłać linku", {
        description: error instanceof Error ? error.message : "Spróbuj ponownie później",
      });
    } finally {
      setIsResending(false);
    }
  };

  const isDisabled = cooldownRemaining > 0 || isResending;

  return (
    <Button onClick={handleResend} disabled={isDisabled} variant="outline" className="w-full h-12 font-semibold">
      {isResending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Wysyłanie...
        </>
      ) : cooldownRemaining > 0 ? (
        `Wyślij ponownie (${cooldownRemaining}s)`
      ) : (
        "Wyślij link ponownie"
      )}
    </Button>
  );
}
