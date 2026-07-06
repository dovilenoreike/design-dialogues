/**
 * Kitchen Furniture Price Calculator — auto-fill algorithm (spec §Auto-Fill).
 *
 * Given a single kitchen length, place the default requirement units, greedily
 * fill the remaining base run with standard-width storage cabinets, and mirror
 * the base run with wall units. Pure — returns a fresh KitchenState.
 */

import type { CabinetUnit, GlobalSettings, HardwareGrade, KitchenState, UnitType } from "./types";
import { UNIT_CATEGORY, UNIT_LABELS } from "./units";

const STANDARD_WIDTHS = [1000, 800, 600, 500, 400, 300]; // mm, descending
const WALL_WIDTHS = [600]; // mm, spec mirrors base run with 600mm wall units

let idCounter = 0;
const uid = (): string => `u${++idCounter}`;

interface MakeOpts {
  width2?: number;
  isCustom?: boolean;
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
    occupiesWorktop: category === "base",
  };
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

/** Wall units filling a given span (600mm units + custom remainder). */
export function makeWallRun(spanMm: number): CabinetUnit[] {
  return greedyFill(spanMm, WALL_WIDTHS).map((fill) =>
    makeUnit("wall", fill.width, { isCustom: fill.isCustom }),
  );
}

const SINK_WIDTH = 600;
const HOB_OVEN_WIDTH = 600;
const FRIDGE_WIDTH = 600;

export function generateKitchen(
  lengthMm: number,
  settings: GlobalSettings,
  grade: HardwareGrade,
): KitchenState {
  const baseUnits: CabinetUnit[] = [
    makeUnit("sink", SINK_WIDTH),
    makeUnit("hobOven", HOB_OVEN_WIDTH),
  ];

  // Step 2: remaining base run after the requirement units (fridge is tall but
  // occupies floor footprint in the run).
  const remaining = lengthMm - SINK_WIDTH - HOB_OVEN_WIDTH - FRIDGE_WIDTH;

  // Step 3: fill remainder with storage cabinets.
  for (const fill of greedyFill(remaining, STANDARD_WIDTHS)) {
    baseUnits.push(makeUnit("storage", fill.width, { isCustom: fill.isCustom }));
  }

  // Fridge housing sits at the end of the base & tall list.
  baseUnits.push(makeUnit("fridge", FRIDGE_WIDTH));

  // Step 4: mirror the base-run length (base-category units only) with wall units.
  const baseRunLm = baseUnits
    .filter((u) => u.category === "base")
    .reduce((sum, u) => sum + u.width, 0);

  const wallUnits = makeWallRun(baseRunLm);

  return {
    lengthMm,
    settings,
    grade,
    baseUnits,
    wallUnits,
    islandUnits: [],
  };
}
