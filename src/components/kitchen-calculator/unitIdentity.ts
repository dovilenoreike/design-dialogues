import {
  UNIT_CATEGORY,
  UNIT_LABELS,
  type CabinetUnit,
  type UnitCategory,
  type UnitType,
} from "@/lib/kitchen-calculator";

/**
 * A **unit identity** is what the row's picker (and label + icon) present: the
 * combination of a carcass `type` and its integrated `appliance`, named as one
 * thing the user recognises ("Oven housing", "Hob cabinet", "Microwave").
 *
 * The engine keeps two fields — `type` (carcass, drives category/BOM) and
 * `appliance` (the integrated device, drives the project tracker) — because a
 * carcass and its appliance aren't 1:1 (an oven is a base recess or a tall
 * tower; a hob sits over drawers). This module resolves the pair to a single
 * display identity so the UI reflects the appliance, not just the carcass, and
 * lets the picker offer every appliance variant (not only the raw carcass types).
 *
 * `appliance` is the identity driver: two identities can share a carcass `type`
 * (Storage / Hob / Oven all sit on a base carcass) and are told apart by the
 * appliance. When an identity is chosen, both fields are written back together.
 */
export interface UnitIdentity {
  /** Stable key for the picker + resolution. */
  id: string;
  label: string;
  /** Carcass type — sets category and (later) the BOM. */
  type: UnitType;
  /** Integrated appliance id (UnitConfig ids). */
  appliance: string;
}

// Ordered per category; the picker groups them by the carcass's shape (base/tall).
export const UNIT_IDENTITIES: UnitIdentity[] = [
  // --- base -------------------------------------------------------------
  { id: "storage", type: "storage", appliance: "none", label: "Storage cabinet" },
  { id: "sink", type: "sink", appliance: "sink", label: "Sink cabinet" },
  { id: "hob", type: "hob", appliance: "hob", label: "Hob cabinet" },
  { id: "hobOven", type: "hobOven", appliance: "hobOven", label: "Hob / oven cabinet" },
  { id: "dishwasher", type: "dishwasher", appliance: "dishwasher", label: "Dishwasher housing" },
  { id: "cornerBase", type: "cornerBase", appliance: "none", label: "Corner base unit" },
  // --- tall -------------------------------------------------------------
  { id: "fridge", type: "fridge", appliance: "fridge", label: "Fridge housing" },
  { id: "ovenHousing", type: "ovenHousing", appliance: "oven", label: "Oven housing" },
  {
    id: "ovenMicrowave",
    type: "ovenMicrowave",
    appliance: "ovenMicrowave",
    label: "Oven & microwave housing",
  },
  { id: "microwave", type: "microwave", appliance: "microwave", label: "Microwave housing" },
  { id: "larder", type: "larder", appliance: "none", label: "Tall unit" },
  // --- wall -------------------------------------------------------------
  { id: "wall", type: "wall", appliance: "none", label: "Wall cabinet" },
  { id: "hood", type: "hoodHousing", appliance: "extractor", label: "Hood housing" },
  { id: "microwaveWall", type: "microwaveWall", appliance: "microwave", label: "Microwave cabinet" },
  { id: "cornerWall", type: "cornerWall", appliance: "none", label: "Corner wall unit" },
  // --- island -----------------------------------------------------------
  { id: "island", type: "island", appliance: "none", label: "Island unit" },
  { id: "islandSink", type: "island", appliance: "sink", label: "Island with sink" },
  { id: "islandHob", type: "island", appliance: "hob", label: "Island with hob" },
  { id: "islandHobOven", type: "island", appliance: "hobOven", label: "Island with hob + oven" },
];

const identityCategory = (i: UnitIdentity): UnitCategory => UNIT_CATEGORY[i.type];

export const identityById = (id: string): UnitIdentity | undefined =>
  UNIT_IDENTITIES.find((i) => i.id === id);

/**
 * The identity a unit currently presents. The appliance leads (a stored oven
 * reads as an oven housing even if its carcass field lags), disambiguated by
 * category; a unit with no appliance falls back to its carcass type. Always
 * returns something — an unmatched pair yields a synthetic type-only identity.
 */
export function resolveIdentity(unit: CabinetUnit): UnitIdentity {
  if (unit.appliance && unit.appliance !== "none") {
    const byAppliance = UNIT_IDENTITIES.find(
      (i) => i.appliance === unit.appliance && identityCategory(i) === unit.category,
    );
    if (byAppliance) return byAppliance;
  }
  const byType = UNIT_IDENTITIES.find((i) => i.type === unit.type && i.appliance === "none");
  if (byType) return byType;
  return { id: unit.type, type: unit.type, appliance: "none", label: UNIT_LABELS[unit.type] };
}

/** Display label for a placed unit — its resolved identity's name. */
export const unitLabel = (unit: CabinetUnit): string => resolveIdentity(unit).label;

/**
 * The identity to retype a unit *into* when its appliance changes — this is how
 * the appliance drives the cabinet type (none → storage, oven → oven housing,
 * hob → hob cabinet…). Prefers an identity in the unit's current category (so an
 * island keeps its carcass and only gains the appliance), else takes the
 * appliance's canonical home (e.g. oven → the tall oven housing, even from a
 * base cabinet). `none` falls back to the category's plain carcass.
 */
export function identityForAppliance(appliance: string, category: UnitCategory): UnitIdentity {
  const inCategory = (i: UnitIdentity) => identityCategory(i) === category;
  if (!appliance || appliance === "none") {
    return UNIT_IDENTITIES.find((i) => i.appliance === "none" && inCategory(i)) ?? UNIT_IDENTITIES[0];
  }
  return (
    UNIT_IDENTITIES.find((i) => i.appliance === appliance && inCategory(i)) ??
    UNIT_IDENTITIES.find((i) => i.appliance === appliance) ??
    UNIT_IDENTITIES.find((i) => i.appliance === "none" && inCategory(i)) ??
    UNIT_IDENTITIES[0]
  );
}

/** Identities selectable in a section, by the carcass categories it allows. */
export const identitiesForCategories = (categories: Set<UnitCategory>): UnitIdentity[] =>
  UNIT_IDENTITIES.filter((i) => categories.has(identityCategory(i)));

export interface IdentityGroup {
  /** Section header; null renders a flat, unlabelled group. */
  label: string | null;
  items: UnitIdentity[];
}

/**
 * Group a section's identities by carcass shape — Base vs Tall units — mirroring
 * `buildTypeGroups`. Wall- and island-only sections collapse to one flat group.
 */
export function buildIdentityGroups(identities: UnitIdentity[]): IdentityGroup[] {
  const base = identities.filter((i) => identityCategory(i) === "base");
  const tall = identities.filter((i) => identityCategory(i) === "tall");
  const other = identities.filter(
    (i) => identityCategory(i) !== "base" && identityCategory(i) !== "tall",
  );

  const groups: IdentityGroup[] = [];
  if (base.length) groups.push({ label: "Base units", items: base });
  if (tall.length) groups.push({ label: "Tall units", items: tall });
  if (other.length) groups.push({ label: null, items: other });

  if (groups.length === 1) return [{ label: null, items: groups[0].items }];
  return groups;
}
