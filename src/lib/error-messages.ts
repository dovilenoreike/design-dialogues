/**
 * Map technical errors to translation keys for user-friendly messages
 */
export function getErrorTranslationKey(error: unknown): string {
  const message = getErrorMessage(error).toLowerCase();

  // Rate limiting
  if (message.includes("rate limit") || message.includes("429") || message.includes("too many")) {
    return "error.rateLimit";
  }

  // Authentication/session errors
  if (
    message.includes("unauthorized") ||
    message.includes("401") ||
    message.includes("session expired") ||
    message.includes("invalid token")
  ) {
    return "error.sessionExpired";
  }

  // Credits/payment errors
  if (
    message.includes("402") ||
    message.includes("no credits") ||
    message.includes("insufficient credits") ||
    message.includes("out of credits")
  ) {
    return "error.noCredits";
  }

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("offline")
  ) {
    return "error.networkError";
  }

  // OpenAI/image generation errors
  if (
    message.includes("openai") ||
    message.includes("image generation") ||
    message.includes("generation service")
  ) {
    return "error.imageGeneration";
  }

  // Storage/upload errors
  if (message.includes("upload") || message.includes("storage")) {
    return "error.uploadFailed";
  }

  // Stripe/payment processing
  if (message.includes("stripe") || message.includes("payment")) {
    return "error.paymentError";
  }

  // Share errors
  if (message.includes("share")) {
    return "error.shareFailed";
  }

  // Server errors
  if (message.includes("500") || message.includes("server error")) {
    return "error.serverError";
  }

  // Generic fallback
  return "error.generic";
}

/**
 * Extract error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    // Handle Supabase function errors
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    // Handle response-like objects
    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }
  }

  return "Unknown error";
}

/**
 * Check if an error is a user-facing error (not a bug)
 * Used to decide whether to show technical details
 */
export function isUserError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("rate limit") ||
    message.includes("unauthorized") ||
    message.includes("no credits") ||
    message.includes("session expired")
  );
}
