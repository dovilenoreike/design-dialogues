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
  numberOfAdults: number;
  numberOfChildren: number;
  isRenovation: boolean;
  isUrgent: boolean;
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
  furnitureRates,
  priceVariance,
  roundToHundred,
  serviceCardContent,
} from "@/config/pricing";
