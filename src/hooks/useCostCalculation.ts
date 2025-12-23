/**
 * Custom hook for cost calculation logic
 */

import { useMemo } from "react";
import type { ServiceSelection } from "@/types/calculator";
import type { Tier } from "@/config/tiers";
import {
  baseRates,
  designRates,
  kitchenRates,
  appliancePackages,
  wardrobeRates,
  renovationRate,
  furniturePercentage,
  priceVariance,
  roundToHundred,
} from "@/config/pricing";

export interface CostLineItem {
  label: string;
  value: number;
  tooltip: string;
}

export interface CostGroup {
  header: string;
  items: CostLineItem[];
}

export interface CostCalculation {
  total: number;
  lowEstimate: number;
  highEstimate: number;
  groupedLineItems: CostGroup[];
  renovationCost: number;
}

interface UseCostCalculationParams {
  area: number;
  isRenovation: boolean;
  services: ServiceSelection;
  kitchenLength: number;
  wardrobeLength: number;
  selectedTier: Tier;
}

/**
 * Tier-aware tooltips explaining why prices differ
 */
const tierTooltips: Record<string, Record<Tier, string>> = {
  "Interior Design Project": {
    Budget: "Functional layouts with basic lighting — one pendant per room and standard ergonomics",
    Standard: "Detailed plans with layered lighting zones, optimized circulation, and custom details",
    Premium: "Full 3D visualization, bespoke lighting design, premium ergonomics, and meticulous detailing",
  },
  "Construction & Finish": {
    Budget: "Standard finishes, basic plastering, and cost-effective flooring installation",
    Standard: "Quality workmanship, smooth finishes, and precise detailing throughout",
    Premium: "Artisan-level craftsmanship, seamless finishes, and premium installation techniques",
  },
  "Built-in Products & Materials": {
    Budget: "Practical materials — laminate flooring, standard tiles, and basic fixtures",
    Standard: "Quality mid-range — engineered wood, porcelain tiles, and branded fixtures",
    Premium: "Luxury selection — natural stone, hardwood, designer fixtures, and premium hardware",
  },
  "Kitchen & Joinery": {
    Budget: "MDF carcasses with laminate finish, standard hardware, and practical worktops",
    Standard: "Solid wood frames, soft-close mechanisms, and engineered stone surfaces",
    Premium: "Solid timber construction, premium hardware, natural stone worktops, and bespoke details",
  },
  "Home Appliances": {
    Budget: "Reliable brands covering essential functions — practical and efficient",
    Standard: "Premium brands with advanced features — better performance and longevity",
    Premium: "Top-tier brands — professional-grade performance, smart features, and integrated design",
  },
  "Built-in Wardrobes": {
    Budget: "Melamine finish with basic internal layout and standard fittings",
    Standard: "Painted MDF, customized internals, soft-close doors, and quality accessories",
    Premium: "Lacquered or veneer finish, LED lighting, premium fittings, and bespoke organization",
  },
  "Furniture (est.)": {
    Budget: "Functional basics — mix of ready-made pieces from reliable brands",
    Standard: "Quality mid-range — coordinated selection from established furniture brands",
    Premium: "Designer pieces, custom upholstery, and investment furniture built to last decades",
  },
};

export function useCostCalculation({
  area,
  isRenovation,
  services,
  kitchenLength,
  wardrobeLength,
  selectedTier,
}: UseCostCalculationParams): CostCalculation {
  return useMemo(() => {
    const tier = selectedTier;

    // Calculate costs based on selected services
    // Space Planning affects Interior Design cost
    const interiorDesign = services.spacePlanning
      ? roundToHundred(area * designRates[tier])
      : 0;

    // Interior Finishes affects Construction & Finish, Materials, Kitchen, Wardrobes, Appliances
    const constructionFinish = services.interiorFinishes
      ? roundToHundred(area * baseRates[tier] * 0.6)
      : 0;

    const builtInProducts = services.interiorFinishes
      ? roundToHundred(area * baseRates[tier] * 0.4)
      : 0;

    const kitchenJoinery = services.interiorFinishes
      ? roundToHundred(kitchenLength * kitchenRates[tier])
      : 0;

    const appliances = services.interiorFinishes
      ? roundToHundred(appliancePackages[tier])
      : 0;

    const wardrobes = services.interiorFinishes
      ? roundToHundred(wardrobeLength * wardrobeRates[tier])
      : 0;

    // Renovation Prep (if applicable)
    const renovationCost = isRenovation
      ? roundToHundred(area * renovationRate)
      : 0;

    // Subtotal before furniture
    const subtotal =
      interiorDesign +
      constructionFinish +
      builtInProducts +
      kitchenJoinery +
      appliances +
      wardrobes +
      renovationCost;

    // Furnishing & Decor affects Furniture cost
    const furniture = services.furnishingDecor
      ? roundToHundred(subtotal * furniturePercentage)
      : 0;

    // Total
    const total = subtotal + furniture;

    // Calculate ±15% range for total (also rounded)
    const lowEstimate = roundToHundred(total * (1 - priceVariance));
    const highEstimate = roundToHundred(total * (1 + priceVariance));

    // Build grouped line items, filtering out zero-value items
    const groupedLineItems: CostGroup[] = [
      {
        header: "PROJECT & SHELL",
        items: [
          ...(interiorDesign > 0
            ? [
                {
                  label: "Interior Design",
                  value: interiorDesign,
                  tooltip: tierTooltips["Interior Design Project"][tier],
                },
              ]
            : []),
          {
            label: "Construction & Finish",
            value: constructionFinish,
            tooltip: tierTooltips["Construction & Finish"][tier],
          },
          ...(builtInProducts > 0
            ? [
                {
                  label: "Materials",
                  value: builtInProducts,
                  tooltip: tierTooltips["Built-in Products & Materials"][tier],
                },
              ]
            : []),
        ].filter((item) => item.value > 0),
      },
      {
        header: "FIXED JOINERY",
        items: [
          {
            label: "Kitchen",
            value: kitchenJoinery,
            tooltip: tierTooltips["Kitchen & Joinery"][tier],
          },
          {
            label: "Wardrobes",
            value: wardrobes,
            tooltip: tierTooltips["Built-in Wardrobes"][tier],
          },
        ].filter((item) => item.value > 0),
      },
      {
        header: "MOVABLES & TECH",
        items: [
          {
            label: "Appliances",
            value: appliances,
            tooltip: tierTooltips["Home Appliances"][tier],
          },
          ...(furniture > 0
            ? [
                {
                  label: "Furniture",
                  value: furniture,
                  tooltip: tierTooltips["Furniture (est.)"][tier],
                },
              ]
            : []),
        ].filter((item) => item.value > 0),
      },
    ].filter((group) => group.items.length > 0);

    return { total, lowEstimate, highEstimate, groupedLineItems, renovationCost };
  }, [area, isRenovation, services, kitchenLength, wardrobeLength, selectedTier]);
}
