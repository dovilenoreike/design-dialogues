/**
 * Kitchen Furniture Price Calculator — core types.
 *
 * Pure data model for the BOM-based pricing engine. No React, no side effects.
 * All linear dimensions are in **mm**; convert to metres (`/1000`) only when
 * computing area (m²) or linear-metre (lm) costs.
 *
 * See kitchen-calculator-spec.md for the source specification.
 */

import type { ProjectAppliance } from "./appliances";

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
  | "hoodCutout"
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
  // base
  | "sink"
  | "hob"
  | "hobOven"
  | "dishwasher"
  | "storage"
  | "housing" // generic appliance housing, no appliance assigned yet
  | "cornerBase"
  // tall
  | "fridge"
  | "ovenHousing"
  | "ovenMicrowave"
  | "microwave"
  | "housingTall" // generic empty appliance housing (tall)
  | "larder"
  // wall
  | "wall"
  | "hoodHousing"
  | "microwaveWall"
  | "housingWall" // generic empty appliance housing (wall)
  | "cornerWall"
  // island
  | "island";

/**
 * How a cabinet front is composed — a body (doors / appliance facade / none)
 * plus an optional stack of drawers on top. Picking Doors + drawers reads as a
 * combo; Appliance + drawers as an appliance with drawer(s) above. Visual/mock —
 * not priced yet.
 */
export type FrontBody = "doors" | "appliance" | "none";

export interface FrontConfig {
  body: FrontBody;
  /** Number of doors (1–2) — used when body is "doors". */
  doors: number;
  /** Drawers stacked on top; the whole front when body is "none". */
  drawers: number;
}

export interface CabinetUnit {
  id: string;
  type: UnitType;
  category: UnitCategory;
  name: string; // English display name (i18n deferred to a later phase)
  width: number; // mm (primary run width W₁ for corners)
  width2?: number; // mm (return run W₂ for corners)
  isCustomWidth?: boolean; // flagged when snapped off standard widths
  /** Count of identical units this line represents (default 1). */
  quantity: number;
  /** True when the unit contributes to the base-run worktop above it. */
  occupiesWorktop: boolean;
  /**
   * The atomic project appliances integrated in this unit (e.g. `["hob","oven"]`
   * for a hob/oven cabinet, `[]` for plain storage). Seeded from the unit type;
   * drives the project appliance tracker. Not yet priced.
   */
  appliances: ProjectAppliance[];
  /**
   * Per-unit interior configuration (front layout / shelf count / accessories).
   * Visual-only for now (not priced), but persisted on the unit so it survives
   * duplication and reordering. `undefined` means "use the type default"; a type
   * swap clears these back to undefined so they re-default. The shape of `front`
   * and the accessory ids are owned by the UI layer (`UnitConfig`).
   */
  front?: FrontConfig;
  shelves?: number;
  accessories?: string[];
  /**
   * A sink cutout riding this carcass. The dedicated `"sink"` *type* is a plain
   * low base sink cabinet; this flag lets a sink also sit on a corner or island
   * carcass without replacing its type (mirrors how an island carries its
   * appliance). Use `unitHasSink()` to test "has a sink" across both forms.
   */
  sink?: boolean;
}

/** The persisted, row-editable slice of a unit (front/shelves/accessories +
 *  the sink fixture) — set directly from the row and spread onto the unit. */
export type UnitFinish = Pick<CabinetUnit, "front" | "shelves" | "accessories" | "sink">;

/** Kitchen shape. Islands are orthogonal (their own section), not a layout. */
export type KitchenLayout = "line" | "l" | "u" | "galley";

/**
 * One leg of the kitchen. A Line has one run; L/galley two; U three. Corners
 * (cornerBase/cornerWall units) live inside the run that turns into the next.
 */
export interface Run {
  id: string;
  label: string; // "Run A", "Run B", "Run C"
  lengthMm: number; // this leg's wall length
  /** Base + tall units for this leg (shown in the "Base & tall" list). */
  baseUnits: CabinetUnit[];
  wallUnits: CabinetUnit[];
  /** Whether this run's worktop is part of the quote (off = supplied elsewhere). */
  worktop: boolean;
  /** Worktop length override in mm; null = follow the bottom cabinets. */
  worktopLengthMm: number | null;
  /** Worktop material also runs up the backsplash (same length). */
  backsplash: boolean;
}

export type ExtraRole = "delivery" | "installation" | "design" | "custom";

/** A line on the quote — delivery, installation, discount, custom work… */
export interface ExtraCost {
  id: string;
  label: string;
  amount: number; // € — may be negative (e.g. a discount)
  role?: ExtraRole;
  /** Installation/design: amount follows a % of furniture until the maker overrides it. */
  auto?: boolean;
}

export interface KitchenState {
  layout: KitchenLayout;
  settings: GlobalSettings;
  grade: HardwareGrade;
  runs: Run[];
  islandUnits: CabinetUnit[];
  extraCosts: ExtraCost[];
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
  additional: number; // sum of manual ExtraCost lines
  total: number;
}

/** Everything the pricing functions need, passed in (never imported deep). */
export interface PricingContext {
  config: MaterialConfig;
  hardware: HardwareDB;
  grade: HardwareGrade;
  settings: GlobalSettings;
}
