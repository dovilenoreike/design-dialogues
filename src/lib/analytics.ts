// No-op stubs — PostHog removed. Call sites preserved for future tracking needs.

export function initAnalytics() {}
export function enableAnalytics() {}
export function disableAnalytics() {}
export function trackEvent(_eventName: string, _properties?: Record<string, unknown>) {}
export function trackPageView(_path: string, _referrer?: string) {}
export function identifyUser(_userId: string, _isAnonymous: boolean) {}
export function resetAnalyticsUser() {}

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
  TAB_VIEWED: "tab_viewed",
  MATERIAL_CLICKED: "material_clicked",
  DESIGNER_PROFILE_OPENED: "designer_profile_opened",
  BUDGET_TIER_SELECTED: "budget_tier_selected",
  BUDGET_CALCULATOR_USED: "budget_calculator_used",
  AUDIT_RESPONSE_GIVEN: "audit_response_given",
  TIMELINE_TASK_TOGGLED: "timeline_task_toggled",
  MOVE_IN_DATE_SET: "move_in_date_set",
  THREAD_SECTION_CLICKED: "thread_section_clicked",
  MOODBOARD_MATERIAL_SELECTED: "moodboard_material_selected",
  MOODBOARD_MATERIAL_CLEARED: "moodboard_material_cleared",
  MOODBOARD_COLLECTION_SELECTED: "moodboard_collection_selected",
  MOODBOARD_SLOTS_RESET: "moodboard_slots_reset",
} as const;
