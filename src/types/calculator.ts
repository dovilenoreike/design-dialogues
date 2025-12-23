/**
 * Calculator type definitions
 */

export interface ServiceSelection {
  spacePlanning: boolean;
  interiorFinishes: boolean;
  furnishingDecor: boolean;
}

export interface FormData {
  area: number;
  isRenovation: boolean;
  services: ServiceSelection;
  kitchenLength: number;
  wardrobeLength: number;
}

// Re-export pricing configuration for backward compatibility
export {
  baseRates,
  designRates,
  kitchenRates,
  appliancePackages,
  wardrobeRates,
  renovationRate,
  furniturePercentage,
  priceVariance,
  roundToHundred,
  serviceCardContent,
} from "@/config/pricing";
