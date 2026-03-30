/**
 * URL state utilities for shareable links
 * Syncs design selections with URL query parameters
 */

import { BottomTab, Tier } from "@/contexts/DesignContext";

export interface UrlState {
  tab: BottomTab | null;
  room: string | null;
  tier: Tier | null;
}

// Valid values for validation
const VALID_TABS: BottomTab[] = ["moodboard", "design", "specs", "budget", "plan"];
const VALID_TIERS: Tier[] = ["Budget", "Standard", "Premium"];

/**
 * Parse URL path and query params into state
 */
export function parseUrlState(pathname: string, search: string): UrlState {
  const params = new URLSearchParams(search);

  // Extract tab from pathname (e.g., /design, /specs, /budget, /plan)
  const pathTab = pathname.slice(1) as BottomTab; // Remove leading /
  const tab = VALID_TABS.includes(pathTab) ? pathTab : null;

  const room = params.get("room");
  const tierParam = params.get("tier");

  // Validate tier
  const tier = tierParam && VALID_TIERS.includes(tierParam as Tier)
    ? (tierParam as Tier)
    : null;

  return { tab, room, tier };
}

/**
 * Build URL from current state
 */
export function buildUrl(
  tab: BottomTab,
  room: string | null,
  tier: Tier
): string {
  const path = `/${tab}`;
  const params = new URLSearchParams();

  if (room) params.set("room", room);
  if (tier !== "Standard") params.set("tier", tier); // Only include non-default tier

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

/**
 * Check if URL has any design state params
 */
export function hasUrlState(search: string): boolean {
  const params = new URLSearchParams(search);
  return !!(params.get("room") || params.get("tier"));
}
