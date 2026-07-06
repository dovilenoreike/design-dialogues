/**
 * Kitchen Furniture Price Calculator — auto-fill algorithm (spec §Auto-Fill).
 *
 * Given a kitchen layout and one wall length per leg, place the default
 * requirement units (in the first run), greedily fill each run with standard-
 * width storage cabinets, auto-place corner units at junctions, and mirror each
 * run's base cabinets with wall units. Pure — returns a fresh KitchenState.
 */

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
import { UNIT_CATEGORY, UNIT_LABELS } from "./units";

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

let idCounter = 0;
const uid = (): string => `u${++idCounter}`;

interface MakeOpts {
  width2?: number;
  isCustom?: boolean;
  quantity?: number;
}

export function makeUnit(type: UnitType, width: number, opts: MakeOpts = {}): CabinetUnit {
  const category = UNIT_CATEGORY[type];
  return {
    id: uid(),
    type,
    category,
    name: UNIT_LABELS[type],
    width,
    width2: opts.width2,
    isCustomWidth: opts.isCustom ?? false,
    quantity: opts.quantity ?? 1,
    occupiesWorktop: category === "base",
  };
}

/**
 * Merge consecutive identical units (same type/width/return/custom) into a
 * single line whose `quantity` is their sum — so a run of six matching wall
 * cabinets shows as one "× 6" line. Order is preserved; only adjacent matches
 * merge, so a differing unit between two identical ones keeps them apart.
 */
export function collapseAdjacent(units: CabinetUnit[]): CabinetUnit[] {
  const out: CabinetUnit[] = [];
  for (const u of units) {
    const last = out[out.length - 1];
    const same =
      last &&
      last.type === u.type &&
      last.width === u.width &&
      (last.width2 ?? null) === (u.width2 ?? null) &&
      last.isCustomWidth === u.isCustomWidth;
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
  };
}

interface Fill {
  width: number;
  isCustom: boolean;
}

/** Greedy descending fit; leftover under the smallest width is absorbed as a custom size. */
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
    if (out.length > 0) {
      const last = out[out.length - 1];
      last.width += remaining;
      last.isCustom = true;
    } else {
      out.push({ width: remaining, isCustom: true });
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

const SINK_WIDTH = 600;
const HOB_OVEN_WIDTH = 600;
const FRIDGE_WIDTH = 600;

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
  return { id: runId(), label, lengthMm, baseUnits: [], wallUnits: [], backsplash: true };
}

/** Sum of widths of the base cabinets (base category) in a unit list. */
function baseSpan(units: CabinetUnit[]): number {
  return units.filter((u) => u.category === "base").reduce((sum, u) => sum + u.width, 0);
}

/** Auto-fill one leg: optional essentials + storage, and (if it turns) a corner. */
function fillRun(
  label: string,
  lengthMm: number,
  { withEssentials, hasCorner }: { withEssentials: boolean; hasCorner: boolean },
): Run {
  const run = makeRun(label, lengthMm);

  if (withEssentials) {
    run.baseUnits.push(makeUnit("sink", SINK_WIDTH), makeUnit("hobOven", HOB_OVEN_WIDTH));
  }

  const used =
    run.baseUnits.reduce((sum, u) => sum + u.width, 0) +
    (withEssentials ? FRIDGE_WIDTH : 0) +
    (hasCorner ? CORNER_WIDTH : 0);

  for (const fill of greedyFill(lengthMm - used, STANDARD_WIDTHS)) {
    run.baseUnits.push(makeUnit("storage", fill.width, { isCustom: fill.isCustom }));
  }

  if (withEssentials) run.baseUnits.push(makeUnit("fridge", FRIDGE_WIDTH));

  // Wall units mirror the straight base cabinets; the corner gets a corner wall.
  run.wallUnits = makeWallRun(baseSpan(run.baseUnits));

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
): KitchenState {
  const runCount = LAYOUT_RUN_COUNT[layout];
  const junctions = LAYOUT_CORNER_JUNCTIONS[layout];

  const runs: Run[] = [];
  for (let i = 0; i < runCount; i++) {
    runs.push(
      fillRun(RUN_LABELS[i] ?? `Run ${i + 1}`, legLengthsMm[i] ?? 0, {
        withEssentials: i === 0,
        hasCorner: i < junctions, // runs 0..junctions-1 turn into the next leg
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
  return { layout, settings, grade, runs, islandUnits: [], extraCosts };
}

/** Next run label for a manually added run (continues the A/B/C… sequence). */
export function nextRunLabel(count: number): string {
  return RUN_LABELS[count] ?? `Run ${count + 1}`;
}
