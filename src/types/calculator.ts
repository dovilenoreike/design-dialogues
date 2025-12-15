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

// Service card content with tier-aware descriptions
export const serviceCardContent = {
  spacePlanning: {
    title: "Space Planning",
    descriptions: {
      Budget: "Standardized Efficiency. Application of universal ergonomic principles. Focuses on standard layouts to minimize complexity.",
      Standard: "Tailored Logic. Flow optimized for specific lifestyle habits. Involves custom zoning and solving specific spatial challenges.",
      Premium: "Architectural Restructuring. Comprehensive spatial re-imagining. Includes wall reconfiguration, advanced joinery integration, and complex systems.",
    },
  },
  interiorFinishes: {
    title: "Interior Finishes",
    descriptions: {
      Budget: "Single-Source Selection. Materials selected from consolidated vendors. Optimizes design hours while ensuring a clean result.",
      Standard: "Cross-Supplier Curation. Textures matched across multiple specialized suppliers to create unique aesthetic depth.",
      Premium: "Unrestricted Sourcing. Global procurement scope. Includes rare natural materials, trade-only surfaces, and custom elements.",
    },
  },
  furnishingDecor: {
    title: "Furnishing & Decor",
    descriptions: {
      Budget: "Retail Specification. Selection of ready-to-ship, in-stock items from major retailers. Focuses on budget control.",
      Standard: "Semi-Custom Mix. Blends retail items with semi-custom selections. Includes fabric matching and dimension checks.",
      Premium: "Bespoke Commissioning. Specification of trade-only brands. Includes exact sizing, custom upholstery, and made-to-measure detailing.",
    },
  },
};
