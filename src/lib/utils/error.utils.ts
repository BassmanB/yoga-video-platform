/**
 * Error Utilities
 *
 * Provides standardized error handling and formatting for API responses.
 * All errors follow the ErrorResponse format defined in types.ts
 */

import type { ErrorResponse } from "../../types";
import type { PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";

/**
 * Creates a standardized error response
 *
 * @param code - Error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR')
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @returns Formatted ErrorResponse object
 */
export function createErrorResponse(code: string, message: string, details?: Record<string, unknown>): ErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Maps Supabase PostgrestError to standardized ErrorResponse
 *
 * @param error - Supabase PostgrestError
 * @returns Formatted ErrorResponse object
 */
export function handleSupabaseError(error: PostgrestError): ErrorResponse {
  // Map common Supabase error codes to our error codes
  const errorCodeMap: Record<string, string> = {
    "23505": "CONFLICT", // Unique constraint violation
    "23503": "INVALID_REFERENCE", // Foreign key violation
    "42P01": "DATABASE_ERROR", // Undefined table
    PGRST116: "NOT_FOUND", // No rows returned
  };

  const code = errorCodeMap[error.code] || "DATABASE_ERROR";

  return createErrorResponse(code, error.message || "A database error occurred", {
    supabase_code: error.code,
    supabase_details: error.details,
    supabase_hint: error.hint,
  });
}

/**
 * Formats Zod validation errors into standardized ErrorResponse
 *
 * @param zodError - ZodError from validation
 * @returns Formatted ErrorResponse with validation details
 */
export function formatValidationErrors(zodError: ZodError): ErrorResponse {
  const errors = zodError.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  return createErrorResponse("VALIDATION_ERROR", "Validation failed for one or more fields", { errors });
}

/**
 * Creates a NOT_FOUND error response
 *
 * @param resource - Resource type (e.g., 'Video', 'User')
 * @param id - Resource identifier
 * @returns Formatted ErrorResponse
 */
export function notFoundError(resource: string, id: string): ErrorResponse {
  return createErrorResponse("NOT_FOUND", `${resource} not found or you don't have permission to access it.`, {
    [`${resource.toLowerCase()}_id`]: id,
  });
}

/**
 * Creates an UNAUTHORIZED error response
 *
 * @returns Formatted ErrorResponse
 */
export function unauthorizedError(): ErrorResponse {
  return createErrorResponse("UNAUTHORIZED", "Authentication required. Please provide a valid authorization token.");
}

/**
 * Creates a FORBIDDEN error response
 *
 * @param requiredRole - Role required for the operation
 * @param currentRole - Current user's role
 * @returns Formatted ErrorResponse
 */
export function forbiddenError(requiredRole: string, currentRole: string): ErrorResponse {
  return createErrorResponse("FORBIDDEN", "You do not have permission to perform this action.", {
    required_role: requiredRole,
    current_role: currentRole,
  });
}

/**
 * Creates an INVALID_PARAMETER error response
 *
 * @param parameter - Parameter name
 * @param message - Error message
 * @param allowedValues - Optional array of allowed values
 * @returns Formatted ErrorResponse
 */
export function invalidParameterError(parameter: string, message: string, allowedValues?: string[]): ErrorResponse {
  return createErrorResponse("INVALID_PARAMETER", message, {
    parameter,
    ...(allowedValues && { allowed_values: allowedValues }),
  });
}
