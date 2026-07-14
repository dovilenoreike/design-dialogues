/**
 * Kitchen Furniture Price Calculator — auto-fill algorithm (spec §Auto-Fill).
 *
 * Given a kitchen layout and one wall length per leg, place the default
 * requirement units (in the first run), greedily fill each run with standard-
 * width storage cabinets, auto-place corner units at junctions, and mirror each
 * run's base cabinets with wall units. Pure — returns a fresh KitchenState.
 */

import type { ProjectAppliance } from "./appliances";
import { defaultAppliances } from "./appliances";
import type {
  CabinetUnit,
  ExtraCost,
  ExtraRole,
  GlobalSettings,
  HardwareGrade,
  KitchenLayout,
  KitchenState,
  Run,
  UnitType,
} from "./types";
import { DEFAULT_APPLIANCES, UNIT_CATEGORY, UNIT_LABELS } from "./units";

/** Number of runs (legs) per layout. */
export const LAYOUT_RUN_COUNT: Record<KitchenLayout, number> = {
  line: 1,
  l: 2,
  u: 3,
  galley: 2,
};

/** Number of corner junctions per layout (galley's two runs are parallel). */
export const LAYOUT_CORNER_JUNCTIONS: Record<KitchenLayout, number> = {
  line: 0,
  l: 1,
  u: 2,
  galley: 0,
};

const RUN_LABELS = ["Run A", "Run B", "Run C", "Run D"];
const CORNER_WIDTH = 900; // mm, default corner cabinet footprint per leg (W₁ = W₂)

const STANDARD_WIDTHS = [1000, 800, 600, 500, 400, 300]; // mm, descending
const WALL_WIDTHS = [600]; // mm, spec mirrors base run with 600mm wall units
const MAX_UNIT_WIDTH = 1000; // mm — no auto-generated cabinet exceeds this

let idCounter = 0;
/** Fresh unique unit id (also used when duplicating an existing unit). */
export const nextUnitId = (): string => `u${++idCounter}`;

interface MakeOpts {
  width2?: number;
  isCustom?: boolean;
  quantity?: number;
  /** Override the integrated appliances (else the type's defaults). */
  appliances?: ProjectAppliance[];
}

export function makeUnit(type: UnitType, width: number, opts: MakeOpts = {}): CabinetUnit {
  const category = UNIT_CATEGORY[type];
  return {
    id: nextUnitId(),
    type,
    category,
    name: UNIT_LABELS[type],
    width,
    width2: opts.width2,
    isCustomWidth: opts.isCustom ?? false,
    quantity: opts.quantity ?? 1,
    occupiesWorktop: category === "base",
    appliances: opts.appliances ?? [...DEFAULT_APPLIANCES[type]],
  };
}

/**
 * Merge consecutive identical units (same type/width/return/custom) into a
 * single line whose `quantity` is their sum — so a run of six matching wall
 * cabinets shows as one "× 6" line. Order is preserved; only adjacent matches
 * merge, so a differing unit between two identical ones keeps them apart.
 */
const sameAppliances = (a: ProjectAppliance[], b: ProjectAppliance[]): boolean =>
  a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

export function collapseAdjacent(units: CabinetUnit[]): CabinetUnit[] {
  const out: CabinetUnit[] = [];
  for (const u of units) {
    const last = out[out.length - 1];
    const same =
      last &&
      last.type === u.type &&
      last.width === u.width &&
      (last.width2 ?? null) === (u.width2 ?? null) &&
      last.isCustomWidth === u.isCustomWidth &&
      (last.frontMaterial ?? null) === (u.frontMaterial ?? null) &&
      // Island units share the "island" type, so their contents must match too.
      sameAppliances(last.appliances, u.appliances) &&
      !!last.sink === !!u.sink;
    if (same) out[out.length - 1] = { ...last, quantity: last.quantity + u.quantity };
    else out.push(u);
  }
  return out;
}

/**
 * Swap a unit's type in place, preserving id and width. Category, display name
 * and worktop participation follow the new type.
 */
export function retypeUnit(unit: CabinetUnit, type: UnitType): CabinetUnit {
  const category = UNIT_CATEGORY[type];
  return {
    ...unit,
    type,
    category,
    name: UNIT_LABELS[type],
    occupiesWorktop: category === "base",
    // A type swap resets the appliances to the new type's defaults.
    appliances: [...DEFAULT_APPLIANCES[type]],
    // …and clears the interior config so it re-defaults for the new type
    // (a 1-door front on a wide housing wouldn't make sense).
    front: undefined,
    shelves: undefined,
    accessories: undefined,
  };
}

interface Fill {
  width: number;
  isCustom: boolean;
}

/**
 * Greedy descending fit. A leftover under the smallest width is absorbed into the
 * last cabinet — but never past MAX_UNIT_WIDTH: if absorbing would make it too
 * wide, the combined span is split into two balanced units instead (so a 1200mm
 * leftover becomes 2×600, not a single 1200mm cabinet).
 */
function greedyFill(lengthMm: number, widths: number[]): Fill[] {
  const out: Fill[] = [];
  const min = Math.min(...widths);
  let remaining = Math.max(lengthMm, 0);

  while (remaining >= min) {
    const w = widths.find((x) => x <= remaining) ?? min;
    out.push({ width: w, isCustom: false });
    remaining -= w;
  }

  if (remaining > 0) {
    if (out.length === 0) {
      out.push({ width: remaining, isCustom: true });
    } else {
      const last = out[out.length - 1];
      const combined = last.width + remaining;
      if (combined <= MAX_UNIT_WIDTH) {
        last.width = combined;
        last.isCustom = !widths.includes(combined);
      } else {
        // Balance the oversized span across two units, snapping to standard widths.
        const first = widths.find((w) => w <= combined / 2) ?? Math.round(combined / 2);
        const second = combined - first;
        last.width = first;
        last.isCustom = !widths.includes(first);
        out.push({ width: second, isCustom: !widths.includes(second) });
      }
    }
  }

  return out;
}

/** Wall units filling a given span (600mm units + custom remainder), collapsed. */
export function makeWallRun(spanMm: number): CabinetUnit[] {
  return collapseAdjacent(
    greedyFill(spanMm, WALL_WIDTHS).map((fill) =>
      makeUnit("wall", fill.width, { isCustom: fill.isCustom }),
    ),
  );
}

/** Island cabinets filling a given footprint length (standard widths), collapsed. */
export function makeIslandRun(lengthMm: number): CabinetUnit[] {
  return collapseAdjacent(
    greedyFill(lengthMm, STANDARD_WIDTHS).map((fill) =>
      makeUnit("island", fill.width, { isCustom: fill.isCustom }),
    ),
  );
}

const ISLAND_FIXTURE_WIDTH = 600; // mm — a fixture/appliance cabinet on the island

/**
 * Island cabinets for a footprint, seating the sink and any appliances assigned
 * to the island (each rides an island carcass, as the island UI models them),
 * then filling the rest with storage.
 */
function fillIsland(
  lengthMm: number,
  appliances: Set<ProjectAppliance>,
  hasSink: boolean,
): CabinetUnit[] {
  const units: CabinetUnit[] = [];
  const has = (a: ProjectAppliance) => appliances.has(a);
  const carry = (apps: ProjectAppliance[]) =>
    units.push(makeUnit("island", ISLAND_FIXTURE_WIDTH, { appliances: apps }));

  if (hasSink) {
    const sinkUnit = makeUnit("island", ISLAND_FIXTURE_WIDTH);
    sinkUnit.sink = true;
    units.push(sinkUnit);
  }
  if (has("dishwasher")) carry(["dishwasher"]);
  if (has("hob") && has("oven")) carry(["hob", "oven"]);
  else if (has("hob")) carry(["hob"]);
  else if (has("oven")) carry(["oven"]);
  if (has("fridge")) carry(["fridge"]);
  if (has("microwave")) carry(["microwave"]);
  if (has("hood")) carry(["hood"]);

  const used = units.reduce((sum, u) => sum + u.width, 0);
  for (const fill of greedyFill(Math.max(lengthMm - used, 0), STANDARD_WIDTHS)) {
    units.push(makeUnit("island", fill.width, { isCustom: fill.isCustom }));
  }
  return collapseAdjacent(units);
}

const SINK_WIDTH = 600;
const HOB_WIDTH = 600;
const HOB_OVEN_WIDTH = 600;
const FRIDGE_WIDTH = 600;
const DISHWASHER_WIDTH = 600;
const OVEN_HOUSING_WIDTH = 600;
const HOOD_WIDTH = 600;
const MICROWAVE_WIDTH = 600;

let runCounter = 0;
const runId = (): string => `r${++runCounter}`;

let extraCounter = 0;
/** A quote line (delivery, installation, custom work…). */
export function makeExtraCost(
  label = "",
  amount = 0,
  role: ExtraRole = "custom",
  auto = false,
): ExtraCost {
  return { id: `x${++extraCounter}`, label, amount, role, auto };
}

/** An empty straight run of a given wall length (for auto-fill and "Add run"). */
export function makeRun(label: string, lengthMm: number): Run {
  return {
    id: runId(),
    label,
    lengthMm,
    baseUnits: [],
    wallUnits: [],
    worktop: true,
    worktopLengthMm: null,
    backsplash: true,
  };
}

/** Sum of widths of the base cabinets (base category) in a unit list. */
function baseSpan(units: CabinetUnit[]): number {
  return units.filter((u) => u.category === "base").reduce((sum, u) => sum + u.width, 0);
}

/**
 * A sink (the always-present fixture) or a declared appliance — anything the
 * setup step lets the user assign to a specific run before generating.
 */
export type AssignableFixture = ProjectAppliance | "sink";

/** Where a fixture goes: a 0-based run index, or the island. */
export type RunTarget = number | "island";

/** Which run (or the island) each fixture goes to. A missing entry defaults to run 0. */
export type RunAssignment = Partial<Record<AssignableFixture, RunTarget>>;

/**
 * The run (or island) a fixture ends up in, clamped to what's available. The hood
 * hangs above the hob, so it always follows the hob's run when a hob is declared.
 * The oven is *independent*: it defaults to the hob's run (built under it as one
 * unit), but the user can send it elsewhere to get a standalone oven tower. An
 * "island" target falls back to run 0 when the kitchen has no island.
 */
export function effectiveRunFor(
  key: AssignableFixture,
  assignments: RunAssignment,
  declared: Set<ProjectAppliance>,
  runCount: number,
  hasIsland = false,
): RunTarget {
  if (key === "hood" && declared.has("hob")) {
    return effectiveRunFor("hob", assignments, declared, runCount, hasIsland);
  }
  const raw = assignments[key] ?? 0;
  if (raw === "island") return hasIsland ? "island" : 0;
  return Math.min(Math.max(raw, 0), Math.max(runCount - 1, 0));
}

/**
 * Auto-fill one leg. Each run seats the appliances (and sink) assigned to it: a
 * housing unit for every appliance in this run's set — hob (or an oven-only
 * tower), fridge, dishwasher and an integrated hood above the hob — plus the
 * sink if it lives here. Storage cabinets fill the remaining length; a corner is
 * added if the leg turns into the next.
 */
function fillRun(
  label: string,
  lengthMm: number,
  {
    hasSink,
    hasCorner,
    appliances,
  }: { hasSink: boolean; hasCorner: boolean; appliances: Set<ProjectAppliance> },
): Run {
  const run = makeRun(label, lengthMm);
  const has = (a: ProjectAppliance) => appliances.has(a);

  // The sink is a fixture (not a declared appliance) — placed in its assigned run.
  if (hasSink) run.baseUnits.push(makeUnit("sink", SINK_WIDTH));
  if (has("dishwasher")) run.baseUnits.push(makeUnit("dishwasher", DISHWASHER_WIDTH));
  // Hob + oven in the same run share one built-under unit; split across runs they
  // become a hob-only base unit and a standalone oven tower.
  if (has("hob") && has("oven")) run.baseUnits.push(makeUnit("hobOven", HOB_OVEN_WIDTH));
  else if (has("hob")) run.baseUnits.push(makeUnit("hob", HOB_WIDTH));
  else if (has("oven")) run.baseUnits.push(makeUnit("ovenHousing", OVEN_HOUSING_WIDTH));

  const wantsFridge = has("fridge");
  const used =
    run.baseUnits.reduce((sum, u) => sum + u.width, 0) +
    (wantsFridge ? FRIDGE_WIDTH : 0) +
    (hasCorner ? CORNER_WIDTH : 0);

  for (const fill of greedyFill(lengthMm - used, STANDARD_WIDTHS)) {
    run.baseUnits.push(makeUnit("storage", fill.width, { isCustom: fill.isCustom }));
  }

  if (wantsFridge) run.baseUnits.push(makeUnit("fridge", FRIDGE_WIDTH));

  // Wall units mirror the straight base cabinets; the hood and the microwave each
  // take one 600mm wall slot, and the corner gets a corner wall.
  const wantsHood = has("hood");
  const wantsMicrowave = has("microwave");
  const reservedWall = (wantsHood ? HOOD_WIDTH : 0) + (wantsMicrowave ? MICROWAVE_WIDTH : 0);
  run.wallUnits = makeWallRun(Math.max(baseSpan(run.baseUnits) - reservedWall, 0));
  if (wantsMicrowave) run.wallUnits.unshift(makeUnit("microwaveWall", MICROWAVE_WIDTH));
  if (wantsHood) run.wallUnits.unshift(makeUnit("hoodHousing", HOOD_WIDTH));

  if (hasCorner) {
    run.baseUnits.push(makeUnit("cornerBase", CORNER_WIDTH, { width2: CORNER_WIDTH }));
    run.wallUnits.push(makeUnit("cornerWall", CORNER_WIDTH, { width2: CORNER_WIDTH }));
  }

  // Collapse runs of identical cabinets into single ×count lines.
  run.baseUnits = collapseAdjacent(run.baseUnits);
  run.wallUnits = collapseAdjacent(run.wallUnits);

  return run;
}

export function generateKitchen(
  layout: KitchenLayout,
  legLengthsMm: number[],
  settings: GlobalSettings,
  grade: HardwareGrade,
  appliances: Set<ProjectAppliance> = defaultAppliances(),
  assignments: RunAssignment = {},
  islandLengthMm = 0,
): KitchenState {
  const runCount = LAYOUT_RUN_COUNT[layout];
  const junctions = LAYOUT_CORNER_JUNCTIONS[layout];
  const hasIsland = islandLengthMm > 0;

  const runFor = (key: AssignableFixture) =>
    effectiveRunFor(key, assignments, appliances, runCount, hasIsland);

  const runs: Run[] = [];
  for (let i = 0; i < runCount; i++) {
    // The appliances (and sink) the user assigned to this run.
    const runAppliances = new Set([...appliances].filter((a) => runFor(a) === i));
    runs.push(
      fillRun(RUN_LABELS[i] ?? `Run ${i + 1}`, legLengthsMm[i] ?? 0, {
        hasSink: runFor("sink") === i,
        hasCorner: i < junctions, // runs 0..junctions-1 turn into the next leg
        appliances: runAppliances,
      }),
    );
  }

  // Default quote lines. Delivery is flat; installation/design follow a % of the
  // furniture cost until the maker overrides them (see AUTO_EXTRA_PCT).
  const extraCosts = [
    makeExtraCost("Design & technical project", 0, "design", true),
    makeExtraCost("Installation", 0, "installation", true),
    makeExtraCost("Delivery", 100, "delivery"),
  ];
  // The island seats whatever the user assigned to it, then fills with storage.
  const islandUnits = hasIsland
    ? fillIsland(
        islandLengthMm,
        new Set([...appliances].filter((a) => runFor(a) === "island")),
        runFor("sink") === "island",
      )
    : [];
  return { layout, settings, grade, runs, islandUnits, extraCosts };
}

/** Next run label for a manually added run (continues the A/B/C… sequence). */
export function nextRunLabel(count: number): string {
  return RUN_LABELS[count] ?? `Run ${count + 1}`;
}
