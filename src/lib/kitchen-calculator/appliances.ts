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
  ovenMicrowave: ["oven", "microwave"],
  dishwasher: ["dishwasher"],
  microwave: ["microwave"],
  extractor: ["hood"],
  sink: [],
  none: [],
};

export const projectAppliancesFor = (unitApplianceId: string): ProjectAppliance[] =>
  UNIT_APPLIANCE_TO_PROJECT[unitApplianceId] ?? [];

const setKey = (a: readonly ProjectAppliance[]): string => [...a].sort().join(",");

/**
 * Reverse of {@link projectAppliancesFor}: the legacy single-appliance id for a
 * set of atomic project appliances ("none" | "hob" | "hobOven" | …). A bridge
 * while the UI still speaks the single-id language — a unit now stores the set
 * (`CabinetUnit.appliances`) and this collapses it back to the id the config /
 * identity layer expects. Empty set → "none".
 */
export const primaryApplianceId = (appliances: readonly ProjectAppliance[]): string => {
  if (appliances.length === 0) return "none";
  const key = setKey(appliances);
  for (const [id, projects] of Object.entries(UNIT_APPLIANCE_TO_PROJECT)) {
    if (projects.length > 0 && setKey(projects) === key) return id;
  }
  return appliances[0]; // unusual combo — fall back to the first appliance
};
