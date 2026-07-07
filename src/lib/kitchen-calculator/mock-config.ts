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
    bottomCabinets: 50, // €/m²
    topCabinets: 50,
    tallCabinets: 50,
    worktop: 160,
  },
  structural: {
    carcassBoard: 50, // €/m² (18mm melamine-faced board)
    backPanel: 20, // €/m² (thin HDF)
    edgeBanding: 4, // €/lm
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
  runner: { unit: "per_pair", name: "Drawer runner", prices: [16, 36, 70] },
  hinge: { unit: "per_pair", name: "Hinge (soft-close at grade)", prices: [6, 14, 30] },
  handle: { unit: "per_unit", name: "Handle", prices: [8, 18, 40] },
  fixings: { unit: "per_set", name: "Cam-lock & dowel set", prices: [4, 6, 10] },
  shelfPin: { unit: "per_unit", name: "Shelf pin", prices: [0.4, 0.6, 1] },
  binSingle: { unit: "per_unit", name: "Single waste bin", prices: [50, 90, 180] },
  binDouble: { unit: "per_unit", name: "Double waste bin", prices: [80, 140, 280] },
  pullOut: { unit: "per_unit", name: "Pull-out shelf", prices: [60, 120, 240] },
  magicCorner: { unit: "per_unit", name: "Magic corner fitting", prices: [160, 280, 520] },
  lazySusan: { unit: "per_unit", name: "Lazy susan", prices: [100, 180, 360] },
  cutleryInsert: { unit: "per_unit", name: "Cutlery insert", prices: [20, 40, 80] },
  drawerDividers: { unit: "per_unit", name: "Drawer dividers", prices: [16, 30, 60] },
  sinkCutout: { unit: "per_unit", name: "Sink cutout", prices: [40, 60, 100] },
  hobCutout: { unit: "per_unit", name: "Hob cutout", prices: [40, 60, 100] },
  hoodCutout: { unit: "per_unit", name: "Hood cutout & ducting", prices: [40, 70, 120] },
  plinth: { unit: "per_lm", name: "Plinth", prices: [12, 20, 36] },
  cornice: { unit: "per_lm", name: "Cornice / pelmet", prices: [12, 20, 36] },
  lighting: { unit: "per_lm", name: "Under-cabinet lighting", prices: [24, 50, 90] },
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
