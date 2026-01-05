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
  [TIERS.BUDGET]: "Simple, practical materials and solutions, well suited for lightly used spaces or rentals.",
  [TIERS.STANDARD]: "A thoughtful balance of cost, quality, and aesthetics for comfortable everyday living.",
  [TIERS.PREMIUM]: "Exceptional materials and a refined, memorable experience of space.",
};
