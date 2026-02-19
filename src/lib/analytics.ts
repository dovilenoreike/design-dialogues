import posthog from "posthog-js";

let isInitialized = false;

/**
 * Initialize PostHog analytics
 */
export function initAnalytics() {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST;

  // Skip initialization if no key configured
  if (!apiKey) {
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost || "https://eu.posthog.com",
    // Respect Do Not Track
    respect_dnt: true,
    // Capture pageviews manually for SPA
    capture_pageview: false,
    // Disable session recordings to minimize data
    disable_session_recording: true,
    // Persist across sessions
    persistence: "localStorage",
    // Bootstrap with feature flags disabled
    bootstrap: {
      featureFlags: {},
    },
  });

  isInitialized = true;
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
) {
  if (!isInitialized) return;

  posthog.capture(eventName, properties);
}

/**
 * Track page view
 */
export function trackPageView(path: string, referrer?: string) {
  if (!isInitialized) return;

  posthog.capture("$pageview", {
    $current_url: path,
    $referrer: referrer || document.referrer,
  });
}

/**
 * Identify user for cross-session tracking
 */
export function identifyUser(userId: string, isAnonymous: boolean) {
  if (!isInitialized) return;

  // Use distinct ID prefix for anonymous users
  const distinctId = isAnonymous ? `anon_${userId}` : userId;

  posthog.identify(distinctId, {
    is_anonymous: isAnonymous,
  });
}

/**
 * Reset user identity (e.g., on logout)
 */
export function resetAnalyticsUser() {
  if (!isInitialized) return;

  posthog.reset();
}

// Event name constants for consistency
export const AnalyticsEvents = {
  PAGE_VIEW: "$pageview",
  IMAGE_UPLOADED: "image_uploaded",
  STYLE_SELECTED: "style_selected",
  PALETTE_SELECTED: "palette_selected",
  VISUALIZATION_STARTED: "visualization_started",
  VISUALIZATION_COMPLETED: "visualization_completed",
  VISUALIZATION_FAILED: "visualization_failed",
  CREDITS_PURCHASED: "credits_purchased",
  SESSION_SHARED: "session_shared",
  // Tab tracking
  TAB_VIEWED: "tab_viewed",
  // Specs tab
  MATERIAL_CLICKED: "material_clicked",
  DESIGNER_PROFILE_OPENED: "designer_profile_opened",
  // Budget tab
  BUDGET_TIER_SELECTED: "budget_tier_selected",
  BUDGET_CALCULATOR_USED: "budget_calculator_used",
  // Plan tab
  AUDIT_RESPONSE_GIVEN: "audit_response_given",
  TIMELINE_TASK_TOGGLED: "timeline_task_toggled",
  MOVE_IN_DATE_SET: "move_in_date_set",
  // Thread tab
  THREAD_SECTION_CLICKED: "thread_section_clicked",
} as const;
