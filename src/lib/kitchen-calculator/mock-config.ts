/**
 * Kitchen Furniture Price Calculator — MOCKED config (V1 injection seam).
 *
 * Per spec, material prices and the hardware product database are resolved
 * externally and injected. For V1 (hidden validation page) we hardcode plausible
 * mock values here. This is the single place a future real-pricing backend / the
 * material-matching system plugs in — replace these exports, not the engine.
 *
 * Rate style mirrors src/config/pricing.ts (€/m², €/lm).
 */

import type {
  GlobalSettings,
  HardwareDB,
  HardwareGrade,
  HardwareItem,
  MaterialConfig,
} from "./types";

// ---------------------------------------------------------------------------
// Default global settings (spec §Global Settings)
// ---------------------------------------------------------------------------

export const defaultSettings: GlobalSettings = {
  baseHeight: 720,
  wallHeight: 720,
  tallHeight: 2100,
  baseDepth: 560,
  wallDepth: 300,
  islandDepth: 900,
};

// ---------------------------------------------------------------------------
// Mock material config (prices injected externally in production)
// ---------------------------------------------------------------------------

export const mockMaterialConfig: MaterialConfig = {
  surfaces: {
    bottomCabinets: 65, // €/m²
    topCabinets: 60,
    tallCabinets: 65,
    worktop: 120,
  },
  structural: {
    carcassBoard: 25, // €/m² (18mm melamine-faced board)
    backPanel: 10, // €/m² (thin HDF)
    edgeBanding: 2, // €/lm
  },
};

// ---------------------------------------------------------------------------
// Mock hardware database — one recommended product per item, per grade
// ---------------------------------------------------------------------------

/** Compact table of [basic, mid, premium] unit prices in € for each item. */
const HARDWARE_PRICES: Record<
  HardwareItem,
  { unit: "per_pair" | "per_unit" | "per_set" | "per_lm"; name: string; prices: [number, number, number] }
> = {
  runner: { unit: "per_pair", name: "Drawer runner", prices: [8, 18, 35] },
  hinge: { unit: "per_pair", name: "Hinge (soft-close at grade)", prices: [3, 7, 15] },
  handle: { unit: "per_unit", name: "Handle", prices: [4, 9, 20] },
  fixings: { unit: "per_set", name: "Cam-lock & dowel set", prices: [2, 3, 5] },
  shelfPin: { unit: "per_unit", name: "Shelf pin", prices: [0.2, 0.3, 0.5] },
  binSingle: { unit: "per_unit", name: "Single waste bin", prices: [25, 45, 90] },
  binDouble: { unit: "per_unit", name: "Double waste bin", prices: [40, 70, 140] },
  pullOut: { unit: "per_unit", name: "Pull-out shelf", prices: [30, 60, 120] },
  magicCorner: { unit: "per_unit", name: "Magic corner fitting", prices: [80, 140, 260] },
  lazySusan: { unit: "per_unit", name: "Lazy susan", prices: [50, 90, 180] },
  cutleryInsert: { unit: "per_unit", name: "Cutlery insert", prices: [10, 20, 40] },
  drawerDividers: { unit: "per_unit", name: "Drawer dividers", prices: [8, 15, 30] },
  sinkCutout: { unit: "per_unit", name: "Sink cutout", prices: [20, 30, 50] },
  hobCutout: { unit: "per_unit", name: "Hob cutout", prices: [20, 30, 50] },
  plinth: { unit: "per_lm", name: "Plinth", prices: [6, 10, 18] },
  cornice: { unit: "per_lm", name: "Cornice / pelmet", prices: [6, 10, 18] },
  lighting: { unit: "per_lm", name: "Under-cabinet lighting", prices: [12, 25, 45] },
};

const GRADE_INDEX: Record<HardwareGrade, 0 | 1 | 2> = {
  basic: 0,
  mid: 1,
  premium: 2,
};

function buildGrade(grade: HardwareGrade): HardwareDB[HardwareGrade] {
  const idx = GRADE_INDEX[grade];
  const entries = Object.entries(HARDWARE_PRICES) as [
    HardwareItem,
    (typeof HARDWARE_PRICES)[HardwareItem],
  ][];
  const out = {} as HardwareDB[HardwareGrade];
  for (const [item, def] of entries) {
    out[item] = {
      id: `${item}-${grade}`,
      name: def.name,
      item,
      grade,
      unitPrice: def.prices[idx],
      unit: def.unit,
    };
  }
  return out;
}

export const mockHardwareDB: HardwareDB = {
  basic: buildGrade("basic"),
  mid: buildGrade("mid"),
  premium: buildGrade("premium"),
};

/** Convenience lookup: unit price of a hardware item at a grade. */
export function hardwarePrice(db: HardwareDB, grade: HardwareGrade, item: HardwareItem): number {
  return db[grade][item].unitPrice;
}
