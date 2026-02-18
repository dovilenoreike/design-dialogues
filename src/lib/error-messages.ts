/**
 * Map technical errors to user-friendly messages
 */
export function mapErrorToUserMessage(error: unknown): string {
  const message = getErrorMessage(error).toLowerCase();

  // Rate limiting
  if (message.includes("rate limit") || message.includes("429") || message.includes("too many")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Authentication/session errors
  if (
    message.includes("unauthorized") ||
    message.includes("401") ||
    message.includes("session expired") ||
    message.includes("invalid token")
  ) {
    return "Your session has expired. Please refresh the page.";
  }

  // Credits/payment errors
  if (
    message.includes("402") ||
    message.includes("no credits") ||
    message.includes("insufficient credits") ||
    message.includes("out of credits")
  ) {
    return "You're out of credits. Purchase more to continue.";
  }

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("offline")
  ) {
    return "Connection problem. Please check your internet and try again.";
  }

  // OpenAI/image generation errors
  if (
    message.includes("openai") ||
    message.includes("image generation") ||
    message.includes("generation service")
  ) {
    return "Image generation service is temporarily unavailable. Please try again.";
  }

  // Storage/upload errors
  if (message.includes("upload") || message.includes("storage")) {
    return "Failed to upload image. Please try again.";
  }

  // Stripe/payment processing
  if (message.includes("stripe") || message.includes("payment")) {
    return "Payment processing error. Please try again.";
  }

  // Server errors
  if (message.includes("500") || message.includes("server error")) {
    return "Server error. Please try again in a moment.";
  }

  // Generic fallback
  return "Something went wrong. Please try again.";
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
