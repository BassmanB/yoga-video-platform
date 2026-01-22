/**
 * GoogleAuthButton component
 *
 * OAuth login button for Google authentication
 * - Initiates Google OAuth flow
 * - Error handling
 * - Loading state
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GoogleAuthButtonProps {
  redirectTo?: string;
  onError?: (error: Error) => void;
}

export function GoogleAuthButton({ redirectTo = "/", onError }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual Supabase OAuth call
      // This is a placeholder for UI implementation
      console.log("Initiating Google OAuth flow, redirect to:", redirectTo);

      // Simulate OAuth redirect delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.info("Przekierowywanie do Google...");

      // In real implementation, this would redirect to Google OAuth
      // await supabase.auth.signInWithOAuth({
      //   provider: 'google',
      //   options: {
      //     redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
      //   }
      // });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się połączyć z Google";

      toast.error("Błąd logowania", {
        description: errorMessage,
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      variant="outline"
      className="w-full h-12 font-semibold border-border hover:bg-accent/50 transition-all"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          Przekierowywanie...
        </>
      ) : (
        <>
          <svg className="mr-2 h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Kontynuuj z Google
        </>
      )}
    </Button>
  );
}
