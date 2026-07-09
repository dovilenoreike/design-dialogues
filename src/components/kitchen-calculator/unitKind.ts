import {
  UNIT_CATEGORY,
  type CabinetUnit,
  type ProjectAppliance,
  type UnitCategory,
  type UnitType,
} from "@/lib/kitchen-calculator";

/**
 * A unit's coarse **carcass kind** — the only thing the row picker exposes.
 * Everything specific (which appliance, oven vs microwave…) lives in the unit's
 * `appliances` set and is chosen in the config, not here. Keeping the picker to
 * four kinds is what keeps the row simple.
 */
export type CarcassKind = "sink" | "storage" | "housing" | "corner";

export const KIND_LABELS: Record<CarcassKind, string> = {
  sink: "Sink",
  storage: "Storage",
  housing: "Appliance housing",
  corner: "Corner",
};

// Every engine type that is an appliance housing (generic-empty or appliance-specific).
const HOUSING_TYPES = new Set<UnitType>([
  "housing",
  "housingTall",
  "housingWall",
  "hob",
  "hobOven",
  "dishwasher",
  "fridge",
  "ovenHousing",
  "ovenMicrowave",
  "microwave",
  "hoodHousing",
  "microwaveWall",
]);

/** The kind a unit currently presents. Islands carry their appliance on the
 *  island carcass, so their kind is read from the appliance set, not the type. */
export function unitKind(unit: CabinetUnit): CarcassKind {
  if (unit.category === "island") return unit.appliances.length > 0 ? "housing" : "storage";
  const t = unit.type;
  if (t === "sink") return "sink";
  if (t === "cornerBase" || t === "cornerWall") return "corner";
  if (HOUSING_TYPES.has(t)) return "housing";
  return "storage"; // storage, larder, wall
}

/** Plain, appliance-free carcass for a category (the "Storage" kind). */
export function plainCarcass(category: UnitCategory): UnitType {
  switch (category) {
    case "base":
      return "storage";
    case "tall":
      return "larder";
    case "wall":
      return "wall";
    case "island":
      return "island";
  }
}

/** Generic empty appliance housing for a category (the "Appliance housing" kind
 *  before any appliance is assigned). Islands reuse the island carcass. */
export function emptyHousing(category: UnitCategory): UnitType {
  switch (category) {
    case "base":
      return "housing";
    case "tall":
      return "housingTall";
    case "wall":
      return "housingWall";
    case "island":
      return "island";
  }
}

/** Concrete carcass type for a plain kind (sink/storage/corner) in a category. */
export function typeForKind(kind: CarcassKind, category: UnitCategory): UnitType {
  switch (kind) {
    case "sink":
      return "sink";
    case "corner":
      return category === "wall" ? "cornerWall" : "cornerBase";
    case "housing":
      return emptyHousing(category);
    case "storage":
    default:
      return plainCarcass(category);
  }
}

/**
 * The engine type for a set of appliances in a housing. Islands stay `island`
 * (the appliance rides the carcass, drawn as an overlay); an empty set is the
 * generic housing; otherwise the specific housing type. Category may shift to
 * suit the appliance (a fridge is always tall) — the caller re-reads it.
 */
export function typeForAppliances(appliances: ProjectAppliance[], category: UnitCategory): UnitType {
  if (category === "island") return "island";
  if (appliances.length === 0) return emptyHousing(category);
  const has = (a: ProjectAppliance) => appliances.includes(a);
  if (has("hood")) return "hoodHousing";
  if (has("dishwasher")) return "dishwasher";
  if (has("fridge")) return "fridge";
  if (has("hob")) return has("oven") ? "hobOven" : "hob";
  if (has("oven")) return has("microwave") ? "ovenMicrowave" : "ovenHousing";
  if (has("microwave")) return category === "wall" ? "microwaveWall" : "microwave";
  return emptyHousing(category);
}

// Which appliance can join an existing single to form the other valid combo.
// Only two modeled pairs exist (hob+oven, oven+microwave) — see typeForAppliances.
const PAIR_PARTNERS: Partial<Record<ProjectAppliance, ProjectAppliance[]>> = {
  hob: ["oven"],
  oven: ["hob", "microwave"],
  microwave: ["oven"],
};

/**
 * Appliances the inline "+" can add to a unit to reach another *valid, modeled*
 * state, intersected with what's still assignable (declared, not placed
 * elsewhere). An empty housing/island → any assignable single; a pairable single
 * (hob/oven/microwave) → its free partner(s); a full pair, or a non-pairable
 * single (fridge/dishwasher/hood) → none.
 */
export function addableAppliances(
  current: readonly ProjectAppliance[],
  assignable: readonly ProjectAppliance[],
): ProjectAppliance[] {
  const candidates =
    current.length === 0
      ? assignable
      : current.length === 1
        ? (PAIR_PARTNERS[current[0]] ?? [])
        : [];
  return candidates.filter((a) => assignable.includes(a) && !current.includes(a));
}

export interface KindOption {
  /** Stable id: `${kind}-${category}`. */
  id: string;
  label: string;
  kind: CarcassKind;
  category: UnitCategory;
}

const mk = (kind: CarcassKind, category: UnitCategory, label = KIND_LABELS[kind]): KindOption => ({
  id: `${kind}-${category}`,
  label,
  kind,
  category,
});

// The kinds offered per category. Low (base) has the full set; tall drops sink
// and corner; wall reads "Wall cabinet" for its plain carcass; island is its own.
const OPTIONS_BY_CATEGORY: Record<UnitCategory, KindOption[]> = {
  base: [mk("storage", "base"), mk("sink", "base"), mk("housing", "base"), mk("corner", "base")],
  tall: [mk("storage", "tall"), mk("housing", "tall")],
  wall: [
    mk("storage", "wall", "Wall cabinet"),
    mk("housing", "wall"),
    mk("corner", "wall"),
  ],
  island: [mk("storage", "island", "Island"), mk("housing", "island")],
};

export const currentKindOptionId = (unit: CabinetUnit): string =>
  `${unitKind(unit)}-${unit.category}`;

export const kindOptionById = (id: string): KindOption | undefined =>
  Object.values(OPTIONS_BY_CATEGORY)
    .flat()
    .find((o) => o.id === id);

export interface KindGroup {
  label: string | null;
  items: KindOption[];
}

/**
 * Picker options for a section, grouped Low / Tall when it spans both (the
 * base+tall list); wall and island collapse to one unlabelled group.
 */
export function kindGroupsForCategories(categories: Set<UnitCategory>): KindGroup[] {
  const groups: KindGroup[] = [];
  if (categories.has("base")) groups.push({ label: "Low units", items: OPTIONS_BY_CATEGORY.base });
  if (categories.has("tall")) groups.push({ label: "Tall units", items: OPTIONS_BY_CATEGORY.tall });
  if (categories.has("wall")) groups.push({ label: null, items: OPTIONS_BY_CATEGORY.wall });
  if (categories.has("island")) groups.push({ label: null, items: OPTIONS_BY_CATEGORY.island });
  if (groups.length === 1) return [{ label: null, items: groups[0].items }];
  return groups;
}

/** The category a unit sits in, from its section's allowed types. */
export const categoriesOf = (typeOptions: UnitType[]): Set<UnitCategory> =>
  new Set(typeOptions.map((t) => UNIT_CATEGORY[t]));
