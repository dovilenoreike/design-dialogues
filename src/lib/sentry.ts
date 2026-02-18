import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error tracking and monitoring
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Skip initialization if no DSN configured
  if (!dsn) {
    console.log("Sentry: No DSN configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,

    // Capture 100% of errors
    sampleRate: 1.0,

    // Capture 10% of performance traces to stay within free tier
    tracesSampleRate: 0.1,

    // Disable replays to save quota
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Filter out noise
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter browser extension errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Skip aborted requests (user navigated away)
        if (message.includes("aborted") || message.includes("abort")) {
          return null;
        }

        // Skip browser extension errors
        if (
          message.includes("extension") ||
          message.includes("chrome-extension") ||
          message.includes("moz-extension")
        ) {
          return null;
        }

        // Skip common benign errors
        if (
          message.includes("resizeobserver loop") ||
          message.includes("script error")
        ) {
          return null;
        }
      }

      return event;
    },

    // Ignore specific error types
    ignoreErrors: [
      // Benign browser errors
      "ResizeObserver loop",
      "ResizeObserver loop limit exceeded",
      "Script error.",
      "Non-Error promise rejection",

      // Network errors that aren't actionable
      "Failed to fetch",
      "NetworkError",
      "Load failed",
    ],

    // Don't send URLs containing certain paths
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });
}

/**
 * Set the current user context in Sentry
 */
export function setSentryUser(userId: string | null, isAnonymous = false) {
  if (!userId) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: isAnonymous ? `anon_${userId}` : userId,
  });
}

/**
 * Set design context for better error grouping
 */
export function setSentryDesignContext(context: {
  room?: string | null;
  style?: string | null;
  palette?: string | null;
  hasUploadedImage?: boolean;
}) {
  Sentry.setContext("design", {
    room: context.room || "none",
    style: context.style || "none",
    palette: context.palette || "none",
    hasUploadedImage: context.hasUploadedImage || false,
  });
}

/**
 * Capture an error with additional context
 */
export function captureError(
  error: unknown,
  context?: {
    action?: string;
    [key: string]: unknown;
  }
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  if (context) {
    Sentry.setContext("action", context);
  }

  Sentry.captureException(errorObj);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}
