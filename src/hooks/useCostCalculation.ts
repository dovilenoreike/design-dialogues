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
  // Group totals for percentage display
  designTotal: number;
  shellTotal: number;
  joineryTotal: number;
  equipTotal: number;
}

interface UseCostCalculationParams {
  area: number;
  isRenovation: boolean;
  services: ServiceSelection;
  kitchenLength: number;
  wardrobeLength: number;
  selectedTier: Tier;
  t: (key: string) => string;
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
  t,
}: UseCostCalculationParams): CostCalculation {
  return useMemo(() => {
    const tier = selectedTier;

    // Calculate costs based on selected services
    // Interior Design cost scales with scope (each service adds to the design fee)
    // spacePlanning = 50%, interiorFinishes = 30%, furnishingDecor = 20%
    const scopeMultiplier =
      (services.spacePlanning ? 0.5 : 0) +
      (services.interiorFinishes ? 0.3 : 0) +
      (services.furnishingDecor ? 0.2 : 0);
    const interiorDesign = scopeMultiplier > 0
      ? roundToHundred(area * designRates[tier] * scopeMultiplier)
      : 0;

    // Construction & Finish: 60/40 split between services
    // Rough Labor (60%) = wiring, plumbing, structural → Space Planning
    // Finish Labor (40%) = painting, tiling, trim → Interior Finishes
    const totalConstructionBase = area * baseRates[tier];
    const roughLabor = services.spacePlanning
      ? roundToHundred(totalConstructionBase * 0.6)
      : 0;
    const finishLabor = services.interiorFinishes
      ? roundToHundred(totalConstructionBase * 0.4)
      : 0;
    const constructionFinish = roughLabor + finishLabor;

    const kitchenJoinery = services.interiorFinishes
      ? roundToHundred(kitchenLength * kitchenRates[tier])
      : 0;

    // Interior Finishes controls Appliances
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
        header: t("cost.designProject"),
        items: [
          {
            label: t("cost.interiorDesign"),
            value: interiorDesign,
            tooltip: tierTooltips["Interior Design Project"][tier],
          },
        ].filter((item) => item.value > 0),
      },
      {
        header: t("cost.shellFinishes"),
        items: [
          {
            label: t("cost.constructionFinish"),
            value: constructionFinish,
            tooltip: tierTooltips["Construction & Finish"][tier],
          },
          ...(renovationCost > 0
            ? [
                {
                  label: t("cost.prepWork"),
                  value: renovationCost,
                  tooltip: t("cost.prepWorkTooltip"),
                },
              ]
            : []),
        ].filter((item) => item.value > 0),
      },
      {
        header: t("cost.fixedJoinery"),
        items: [
          {
            label: t("cost.kitchen"),
            value: kitchenJoinery,
            tooltip: tierTooltips["Kitchen & Joinery"][tier],
          },
          {
            label: t("cost.wardrobes"),
            value: wardrobes,
            tooltip: tierTooltips["Built-in Wardrobes"][tier],
          },
          {
            label: t("cost.appliances"),
            value: appliances,
            tooltip: tierTooltips["Home Appliances"][tier],
          },
        ].filter((item) => item.value > 0),
      },
      {
        header: t("cost.movablesTech"),
        items: [
          {
            label: t("cost.furniture"),
            value: furniture,
            tooltip: tierTooltips["Furniture (est.)"][tier],
          },
        ].filter((item) => item.value > 0),
      },
    ].filter((group) => group.items.length > 0);

    // Calculate group totals for percentage display
    const designTotal = interiorDesign;
    const shellTotal = constructionFinish + renovationCost;
    const joineryTotal = kitchenJoinery + wardrobes + appliances;
    const equipTotal = furniture;

    return {
      total,
      lowEstimate,
      highEstimate,
      groupedLineItems,
      renovationCost,
      designTotal,
      shellTotal,
      joineryTotal,
      equipTotal,
    };
  }, [area, isRenovation, services, kitchenLength, wardrobeLength, selectedTier, t]);
}
