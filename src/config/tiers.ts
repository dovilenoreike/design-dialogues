/**
 * Tier configuration - centralized tier constants and types
 */

export const TIERS = {
  BUDGET: "Budget",
  STANDARD: "Standard",
  PREMIUM: "Premium",
} as const;

export type Tier = (typeof TIERS)[keyof typeof TIERS];

export const DEFAULT_TIER: Tier = TIERS.STANDARD;

/**
 * All tier values as an array for iteration
 */
export const TIER_VALUES: Tier[] = [TIERS.BUDGET, TIERS.STANDARD, TIERS.PREMIUM];

/**
 * Tier philosophy descriptions for UI display
 */
export const tierPhilosophy: Record<Tier, string> = {
  [TIERS.BUDGET]: "Smart solutions that maximize value — quality basics done well.",
  [TIERS.STANDARD]: "The sweet spot — lasting quality with thoughtful design details.",
  [TIERS.PREMIUM]: "Exceptional finishes and craftsmanship — built to inspire for decades.",
};
