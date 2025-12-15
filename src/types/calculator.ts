export type ProjectScope = 'space-planning' | 'interior-finishes' | 'full-interior';

export interface FormData {
  area: number;
  isRenovation: boolean;
  projectScope: ProjectScope;
  kitchenLength: number;
  wardrobeLength: number;
}

export const scopeMultipliers: Record<ProjectScope, number> = {
  'space-planning': 0.3,
  'interior-finishes': 0.6,
  'full-interior': 1.0,
};

export const scopeOptions: { value: ProjectScope; label: string }[] = [
  { value: 'space-planning', label: 'Space Planning' },
  { value: 'interior-finishes', label: 'Interior Finishes' },
  { value: 'full-interior', label: 'Full Interior' },
];

// Base rates per m² by tier
export const baseRates = {
  Budget: 350,
  Standard: 550,
  Premium: 900,
};

// Interior Design Project rates per m² by tier
export const designRates = {
  Budget: 30,
  Standard: 50,
  Premium: 80,
};

// Kitchen & Joinery rates per linear meter
export const kitchenRates = {
  Budget: 800,
  Standard: 1200,
  Premium: 2000,
};

// Home Appliances package (fixed amount per tier)
export const appliancePackages = {
  Budget: 3000,
  Standard: 6000,
  Premium: 12000,
};

// Built-in Wardrobes rates per linear meter
export const wardrobeRates = {
  Budget: 400,
  Standard: 650,
  Premium: 1000,
};

// Renovation prep cost per m²
export const renovationRate = 150;

// Furniture estimate as percentage of subtotal
export const furniturePercentage = 0.20;

// Price range variance (±15%)
export const priceVariance = 0.15;

// Round to nearest hundred for cleaner estimates
export const roundToHundred = (value: number): number => Math.round(value / 100) * 100;
