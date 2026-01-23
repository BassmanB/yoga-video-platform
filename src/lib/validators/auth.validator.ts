/**
 * Auth validation schemas using Zod
 *
 * Provides validation for authentication forms and API requests
 */

import { z } from "zod";

/**
 * Email validation schema
 */
export const emailSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .min(1, "Email jest wymagany")
    .max(255, "Email jest za długi")
    .email("Podaj prawidłowy adres email")
    .toLowerCase()
    .trim(),
});

/**
 * Login form schema (magic link)
 */
export const loginSchema = emailSchema.extend({
  redirectTo: z.string().url().optional(),
});

/**
 * Register form schema (email confirmation)
 */
export const registerSchema = emailSchema.extend({
  redirectTo: z.string().url().optional(),
});

/**
 * OAuth redirect schema
 */
export const oauthSchema = z.object({
  provider: z.enum(["google"], {
    errorMap: () => ({ message: "Nieobsługiwany provider" }),
  }),
  redirectTo: z.string().url().optional(),
});

/**
 * Callback query params schema
 */
export const callbackSchema = z.object({
  token_hash: z.string().min(1, "Token is required"),
  type: z.enum(["magiclink", "recovery", "invite"]),
  redirect: z.string().optional(),
});

// Export types
export type EmailInput = z.infer<typeof emailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
export type CallbackParams = z.infer<typeof callbackSchema>;
