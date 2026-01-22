/**
 * LoginForm component
 *
 * Magic link login form for existing users
 * - Email validation with Zod
 * - Loading states
 * - Error handling with inline messages
 * - Success redirect to verify-email page
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { loginSchema, type LoginInput } from "@/lib/validators/auth.validator";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  redirectTo?: string;
}

function navigateToVerifyEmail(email: string) {
  window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`;
}

export function LoginForm({ redirectTo = "/" }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      redirectTo,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setServerError(null);

      // TODO: Replace with actual Supabase signInWithOtp call
      // This is a placeholder for UI implementation
      console.log("Login form submitted:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to verify-email page
      navigateToVerifyEmail(data.email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
      setServerError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Adres email
        </label>
        <input
          {...register("email")}
          id="email"
          type="email"
          autoComplete="email"
          placeholder="twoj@email.pl"
          disabled={isSubmitting}
          className={`
            w-full px-4 py-3 rounded-lg border bg-background
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${errors.email ? "border-red-500 focus:ring-red-500" : "border-border"}
          `}
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-500 flex items-center gap-1" role="alert">
            <span aria-hidden="true">⚠️</span>
            {errors.email.message}
          </p>
        )}
      </div>

      {serverError && (
        <div
          className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4"
          role="alert"
        >
          <p className="text-sm text-red-700 dark:text-red-400">{serverError}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-base font-semibold shadow-card hover:shadow-float transition-all"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Wysyłanie...
          </>
        ) : (
          "Wyślij link logowania"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Wyślemy Ci link logowania na podany adres email. Link będzie ważny przez 60 minut.
      </p>
    </form>
  );
}
