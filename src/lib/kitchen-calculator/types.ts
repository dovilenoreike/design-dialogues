/**
 * Kitchen Furniture Price Calculator — core types.
 *
 * Pure data model for the BOM-based pricing engine. No React, no side effects.
 * All linear dimensions are in **mm**; convert to metres (`/1000`) only when
 * computing area (m²) or linear-metre (lm) costs.
 *
 * See kitchen-calculator-spec.md for the source specification.
 */

// ---------------------------------------------------------------------------
// Material config (externally injected — mocked for V1)
// ---------------------------------------------------------------------------

/** Front-facing surface finish, keyed by cabinet position. €/m². */
export type SurfaceKey = "bottomCabinets" | "topCabinets" | "tallCabinets";

export interface SurfaceRates {
  bottomCabinets: number; // €/m² — door/drawer fronts for base units
  topCabinets: number; // €/m² — door/drawer fronts for wall units
  tallCabinets: number; // €/m² — door/drawer fronts for tall units
  worktop: number; // €/m² — worktop slab
}

export interface StructuralRates {
  carcassBoard: number; // €/m² — all structural carcass panels (sides/top/bottom)
  backPanel: number; // €/m² — back panels (thinner material)
  edgeBanding: number; // €/lm — all exposed edges
}

/** Flat, already-resolved prices. The real system will inject this per palette/tier. */
export interface MaterialConfig {
  surfaces: SurfaceRates;
  structural: StructuralRates;
}

// ---------------------------------------------------------------------------
// Hardware (product-database driven)
// ---------------------------------------------------------------------------

export type HardwareGrade = "basic" | "mid" | "premium";

export type HardwareUnit = "per_pair" | "per_unit" | "per_set" | "per_lm";

/**
 * Keys for every hardware item the calculator can consume. Each maps to exactly
 * one recommended product per grade in the HardwareDB.
 */
export type HardwareItem =
  | "runner"
  | "hinge"
  | "handle"
  | "fixings"
  | "shelfPin"
  | "binSingle"
  | "binDouble"
  | "pullOut"
  | "magicCorner"
  | "lazySusan"
  | "cutleryInsert"
  | "drawerDividers"
  | "sinkCutout"
  | "hobCutout"
  | "plinth"
  | "cornice"
  | "lighting";

export interface HardwareProduct {
  id: string;
  name: string;
  item: HardwareItem;
  grade: HardwareGrade;
  unitPrice: number; // €
  unit: HardwareUnit;
}

/** One recommended product per item, per grade. */
export type HardwareDB = Record<HardwareGrade, Record<HardwareItem, HardwareProduct>>;

// ---------------------------------------------------------------------------
// Global settings (user-configurable heights / depths, in mm)
// ---------------------------------------------------------------------------

export interface GlobalSettings {
  baseHeight: number; // all base cabinets
  wallHeight: number; // all wall cabinets
  tallHeight: number; // all tall cabinets
  baseDepth: number; // base + tall cabinets
  wallDepth: number; // wall cabinets
  islandDepth: number; // island cabinets
}

// ---------------------------------------------------------------------------
// Primitive parts (BOM building blocks)
// ---------------------------------------------------------------------------

export type Part =
  | { kind: "shell"; w: number; h: number; d: number }
  | { kind: "cornerShell"; w1: number; w2: number; h: number; d: number }
  | { kind: "shelf"; w: number; d: number }
  | { kind: "drawerBox"; w: number; d: number; hDrawer: number }
  | { kind: "doorFront"; w: number; h: number; surface: SurfaceKey }
  | { kind: "drawerFront"; w: number; h: number; surface: SurfaceKey }
  | { kind: "pullOut"; item: HardwareItem };

// ---------------------------------------------------------------------------
// Units and kitchen state
// ---------------------------------------------------------------------------

export type UnitCategory = "base" | "tall" | "wall" | "island";

export type UnitType =
  | "sink"
  | "hobOven"
  | "storage"
  | "cornerBase"
  | "fridge"
  | "ovenHousing"
  | "larder"
  | "wall"
  | "cornerWall"
  | "island";

export interface CabinetUnit {
  id: string;
  type: UnitType;
  category: UnitCategory;
  name: string; // English display name (i18n deferred to a later phase)
  width: number; // mm (primary run width W₁ for corners)
  width2?: number; // mm (return run W₂ for corners)
  isCustomWidth?: boolean; // flagged when snapped off standard widths
  /** True when the unit contributes to the base-run worktop above it. */
  occupiesWorktop: boolean;
}

export interface KitchenState {
  lengthMm: number;
  settings: GlobalSettings;
  grade: HardwareGrade;
  /** Base + tall units share the "Base & Tall" list in the UI. */
  baseUnits: CabinetUnit[];
  wallUnits: CabinetUnit[];
  islandUnits: CabinetUnit[]; // empty in Phase 1 (no island UI yet)
}

// ---------------------------------------------------------------------------
// Priced results
// ---------------------------------------------------------------------------

export interface PricedLine {
  label: string;
  amount: number; // €
}

export interface PricedBOM {
  lines: PricedLine[];
  subtotal: number; // €
}

export interface UnitPricing {
  id: string;
  name: string;
  subtotal: number;
}

export interface KitchenPricing {
  units: UnitPricing[];
  unitsTotal: number;
  worktop: number;
  islandWorktop: number;
  extras: number;
  total: number;
}

/** Everything the pricing functions need, passed in (never imported deep). */
export interface PricingContext {
  config: MaterialConfig;
  hardware: HardwareDB;
  grade: HardwareGrade;
  settings: GlobalSettings;
}
