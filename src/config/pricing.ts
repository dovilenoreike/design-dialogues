/**
 * Pricing configuration - centralized rates and calculation constants
 */

import type { Tier } from "./tiers";

/**
 * Base rates per m² by tier
 */
export const baseRates: Record<Tier, number> = {
  Budget: 350,
  Standard: 550,
  Premium: 900,
};

/**
 * Interior Design Project rates per m² by tier
 */
export const designRates: Record<Tier, number> = {
  Budget: 40,
  Standard: 50,
  Premium: 60,
};

/**
 * Kitchen & Joinery rates per linear meter
 */
export const kitchenRates: Record<Tier, number> = {
  Budget: 800,
  Standard: 1200,
  Premium: 2000,
};

/**
 * Home Appliances package (fixed amount per tier)
 */
export const appliancePackages: Record<Tier, number> = {
  Budget: 3000,
  Standard: 6000,
  Premium: 12000,
};

/**
 * Built-in Wardrobes rates per linear meter
 */
export const wardrobeRates: Record<Tier, number> = {
  Budget: 600,
  Standard: 800,
  Premium: 1000,
};

/**
 * Renovation prep cost per m²
 */
export const renovationRate = 150;

/**
 * Furniture estimate as percentage of subtotal (used when other services are selected)
 */
export const furniturePercentage = 0.20;

/**
 * Furniture rates per m² by tier (used when only Furnishing & Decor is selected)
 */
export const furnitureRates: Record<Tier, number> = {
  Budget: 80,
  Standard: 150,
  Premium: 300,
};

/**
 * Price range variance (±15%)
 */
export const priceVariance = 0.15;

/**
 * Urgency multiplier (20% premium for rush projects)
 */
export const urgencyMultiplier = 1.20;

/**
 * Round to nearest hundred for cleaner estimates
 */
export const roundToHundred = (value: number): number => Math.round(value / 100) * 100;

/**
 * Service card content with tier-aware descriptions
 * @deprecated Use getServiceCardContent with translation function instead
 */
export const serviceCardContent = {
  spacePlanning: {
    title: "Space Planning",
    descriptions: {
      Budget: "Standardized Basics. Application of generic layout rules. Focuses on the fastest, most obvious solutions to keep design time and complexity to a minimum.",
      Standard: "Ergonomic Optimization. Flow optimized for specific lifestyle habits. Involves custom zoning and solving specific spatial challenges.",
      Premium: "Complete spatial transformation. Includes moving walls, integrated joinery detailing, and advanced lighting architecture.",
    } as Record<Tier, string>,
  },
  interiorFinishes: {
    title: "Interior Finishes",
    descriptions: {
      Budget: "Single-Source Selection. Materials selected from consolidated vendors. Optimizes design hours while ensuring a clean result.",
      Standard: "Cross-Supplier Curation. Textures matched across multiple specialized suppliers to create unique aesthetic depth.",
      Premium: "Unrestricted Sourcing. Global procurement scope. Includes rare natural materials, trade-only surfaces, and custom elements.",
    } as Record<Tier, string>,
  },
  furnishingDecor: {
    title: "Furnishing & Decor",
    descriptions: {
      Budget: "Retail Specification. Selection of ready-to-ship, in-stock items from major retailers. Focuses on budget control.",
      Standard: "Semi-Custom Mix. Blends retail items with semi-custom selections. Includes fabric matching and dimension checks.",
      Premium: "Bespoke Commissioning. Specification of trade-only brands. Includes exact sizing, custom upholstery, and made-to-measure detailing.",
    } as Record<Tier, string>,
  },
};

/**
 * Get translated service card content
 */
export const getServiceCardContent = (t: (key: string) => string) => ({
  spacePlanning: {
    title: t("service.spacePlanning"),
    descriptions: {
      Budget: t("service.spacePlanningBudget"),
      Standard: t("service.spacePlanningStandard"),
      Premium: t("service.spacePlanningPremium"),
    } as Record<Tier, string>,
  },
  interiorFinishes: {
    title: t("service.interiorFinishes"),
    descriptions: {
      Budget: t("service.interiorFinishesBudget"),
      Standard: t("service.interiorFinishesStandard"),
      Premium: t("service.interiorFinishesPremium"),
    } as Record<Tier, string>,
  },
  furnishingDecor: {
    title: t("service.furnishingDecor"),
    descriptions: {
      Budget: t("service.furnishingDecorBudget"),
      Standard: t("service.furnishingDecorStandard"),
      Premium: t("service.furnishingDecorPremium"),
    } as Record<Tier, string>,
  },
});
