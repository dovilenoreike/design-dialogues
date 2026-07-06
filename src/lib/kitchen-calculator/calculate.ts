/**
 * Kitchen Furniture Price Calculator — top-level pricing (spec §Total).
 *
 *   total = sum(unit prices) + worktop + island worktop + extras
 *
 * Worktop and extras are computed here with the spec's defaults (extras all on)
 * so the Phase-1 total is accurate even though their toggles aren't yet exposed
 * in the UI.
 */

import { hardwarePrice } from "./mock-config";
import { priceParts } from "./parts";
import type {
  CabinetUnit,
  ExtraCost,
  ExtraRole,
  HardwareDB,
  HardwareGrade,
  KitchenPricing,
  KitchenState,
  MaterialConfig,
  PricingContext,
  UnitPricing,
} from "./types";
import { unitParts } from "./units";

/**
 * Auto-derived quote lines as a share of the furniture cost (mock defaults —
 * precise per-maker rates come later). Installation 15%, design 10%.
 */
export const AUTO_EXTRA_PCT: Partial<Record<ExtraRole, number>> = {
  installation: 0.15,
  design: 0.1,
};

/** Effective € for a line: an auto installation/design follows its %, else the typed amount. */
export function effectiveExtraAmount(cost: ExtraCost, furnitureSubtotal: number): number {
  if (cost.auto && cost.role && AUTO_EXTRA_PCT[cost.role] !== undefined) {
    // Rounded to the nearest €10 — these are placeholder defaults, to be refined.
    return Math.round((furnitureSubtotal * (AUTO_EXTRA_PCT[cost.role] as number)) / 10) * 10;
  }
  return cost.amount;
}

const m = (mm: number): number => mm / 1000;
const WORKTOP_DEPTH_M = 0.6; // spec: not configurable in V1

function sumWidths(units: CabinetUnit[]): number {
  return units.reduce((sum, u) => sum + u.width * u.quantity, 0);
}

/** Total count of a given unit type across a list (respecting quantity). */
function countOfType(units: CabinetUnit[], type: CabinetUnit["type"]): number {
  return units.filter((u) => u.type === type).reduce((sum, u) => sum + u.quantity, 0);
}

/** Base + tall units across every run. */
function allBaseUnits(state: KitchenState): CabinetUnit[] {
  return state.runs.flatMap((r) => r.baseUnits);
}

/** Wall units across every run. */
function allWallUnits(state: KitchenState): CabinetUnit[] {
  return state.runs.flatMap((r) => r.wallUnits);
}

function priceUnit(unit: CabinetUnit, ctx: PricingContext): UnitPricing {
  return {
    id: unit.id,
    name: unit.name,
    subtotal: priceParts(unitParts(unit, ctx.settings), ctx) * unit.quantity,
  };
}

// --- Worktop (all runs) ---------------------------------------------------

function worktopPrice(state: KitchenState, ctx: PricingContext): number {
  const base = allBaseUnits(state);
  const baseRunLm = m(sumWidths(base.filter((u) => u.category === "base")));
  const { worktop } = ctx.config.surfaces;
  const { edgeBanding } = ctx.config.structural;

  let price = baseRunLm * WORKTOP_DEPTH_M * worktop + baseRunLm * edgeBanding;

  price += countOfType(base, "sink") * hardwarePrice(ctx.hardware, ctx.grade, "sinkCutout");
  price += countOfType(base, "hobOven") * hardwarePrice(ctx.hardware, ctx.grade, "hobCutout");
  return price;
}

// --- Worktop (island) -----------------------------------------------------

function islandWorktopPrice(state: KitchenState, ctx: PricingContext): number {
  if (state.islandUnits.length === 0) return 0;
  const widthLm = m(sumWidths(state.islandUnits));
  const depthM = m(ctx.settings.islandDepth);
  const { worktop } = ctx.config.surfaces;
  const { edgeBanding } = ctx.config.structural;
  const exposedEdgeLm = widthLm + 2 * depthM; // front + both ends
  return widthLm * depthM * worktop + exposedEdgeLm * edgeBanding;
}

// --- Extras (spec §Extras — all defaulted on) -----------------------------

function panelEndPrice(ctx: PricingContext): number {
  const panelH = m(ctx.settings.baseHeight);
  const panelD = m(ctx.settings.baseDepth);
  const { bottomCabinets } = ctx.config.surfaces;
  const { edgeBanding } = ctx.config.structural;
  return panelH * panelD * bottomCabinets + (2 * panelH + 2 * panelD) * edgeBanding;
}

function extrasPrice(state: KitchenState, ctx: PricingContext): number {
  const baseRunLm = m(sumWidths(allBaseUnits(state).filter((u) => u.category === "base")));
  const wallRunLm = m(sumWidths(allWallUnits(state)));
  const hp = (item: Parameters<typeof hardwarePrice>[2]) =>
    hardwarePrice(ctx.hardware, ctx.grade, item);

  const plinth = baseRunLm * hp("plinth");
  const cornice = wallRunLm * hp("cornice");
  const lighting = wallRunLm * hp("lighting");
  const panelEndsCount = 2; // main run default
  const panelEnds = panelEndsCount * panelEndPrice(ctx);

  return plinth + cornice + lighting + panelEnds;
}

// --- Public API -----------------------------------------------------------

export function buildContext(
  state: KitchenState,
  config: MaterialConfig,
  hardware: HardwareDB,
): PricingContext {
  return { config, hardware, grade: state.grade, settings: state.settings };
}

export function priceKitchen(
  state: KitchenState,
  config: MaterialConfig,
  hardware: HardwareDB,
): KitchenPricing {
  const ctx = buildContext(state, config, hardware);

  const units = [...allBaseUnits(state), ...allWallUnits(state), ...state.islandUnits].map((u) =>
    priceUnit(u, ctx),
  );
  const unitsTotal = units.reduce((sum, u) => sum + u.subtotal, 0);
  const worktop = worktopPrice(state, ctx);
  const islandWorktop = islandWorktopPrice(state, ctx);
  const extras = extrasPrice(state, ctx);

  // Installation/design % are taken on the furniture cost (everything but the lines themselves).
  const furniture = unitsTotal + worktop + islandWorktop + extras;
  const additional = (state.extraCosts ?? []).reduce(
    (sum, c) => sum + effectiveExtraAmount(c, furniture),
    0,
  );

  return {
    units,
    unitsTotal,
    worktop,
    islandWorktop,
    extras,
    additional,
    total: unitsTotal + worktop + islandWorktop + extras + additional,
  };
}

/** Re-export the grade type for consumers that only import from this module. */
export type { HardwareGrade };
