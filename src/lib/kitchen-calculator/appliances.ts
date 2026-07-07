/**
 * Kitchen Furniture Price Calculator — project appliance taxonomy.
 *
 * The declared set of appliances a kitchen includes (its intent). Pure engine
 * data so both the UI (ApplianceSelector) and the auto-fill generator can share
 * it: `generateKitchen` places a housing unit for every declared appliance, and
 * the UI flags any that end up without one. No React, no `@/` imports.
 */

export type ProjectAppliance = "fridge" | "oven" | "hob" | "hood" | "dishwasher" | "microwave";

export const APPLIANCE_ITEMS: { id: ProjectAppliance; label: string; default: boolean }[] = [
  { id: "fridge", label: "Fridge", default: true },
  { id: "oven", label: "Oven", default: true },
  { id: "hob", label: "Hob", default: true },
  { id: "hood", label: "Hood", default: true },
  { id: "dishwasher", label: "Dishwasher", default: true },
  { id: "microwave", label: "Microwave", default: false },
];

export const defaultAppliances = (): Set<ProjectAppliance> =>
  new Set(APPLIANCE_ITEMS.filter((a) => a.default).map((a) => a.id));

// Maps a unit's integrated-appliance id (UnitConfig) to the project appliances it
// fulfils. "Hob + oven" satisfies both hob and oven; sink/none satisfy nothing here.
const UNIT_APPLIANCE_TO_PROJECT: Record<string, ProjectAppliance[]> = {
  fridge: ["fridge"],
  oven: ["oven"],
  hob: ["hob"],
  hobOven: ["hob", "oven"],
  dishwasher: ["dishwasher"],
  microwave: ["microwave"],
  extractor: ["hood"],
  sink: [],
  none: [],
};

export const projectAppliancesFor = (unitApplianceId: string): ProjectAppliance[] =>
  UNIT_APPLIANCE_TO_PROJECT[unitApplianceId] ?? [];
