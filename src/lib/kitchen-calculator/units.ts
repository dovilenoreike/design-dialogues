/**
 * Kitchen Furniture Price Calculator — default unit assemblies.
 *
 * Each unit type decomposes into a list of primitive Parts using dimensions
 * from GlobalSettings. These are the Phase-1 *default* configurations (spec
 * §Standard Cabinet Units); per-unit zone editing is a later phase. No unit has
 * a hardcoded price — pricing is always sum(parts) via parts.ts.
 */

import type { CabinetUnit, GlobalSettings, Part, SurfaceKey, UnitCategory, UnitType } from "./types";

const DRAWER_HEIGHT = 180; // mm, spec Part 3 default
const OVEN_RECESS = 595; // mm, spec Oven Housing default
const CORNER_DOOR_W = 400; // mm, accessible-face door on corner units
const HOOD_HOUSING_HEIGHT = 380; // mm, short wall cabinet concealing an integrated hood

interface Dims {
  h: number;
  d: number;
  surface: SurfaceKey;
}

/** Resolve height, depth and front-surface rate key for a unit category. */
function dimsFor(category: UnitCategory, s: GlobalSettings): Dims {
  switch (category) {
    case "base":
      return { h: s.baseHeight, d: s.baseDepth, surface: "bottomCabinets" };
    case "tall":
      return { h: s.tallHeight, d: s.baseDepth, surface: "tallCabinets" };
    case "wall":
      return { h: s.wallHeight, d: s.wallDepth, surface: "topCabinets" };
    case "island":
      return { h: s.baseHeight, d: s.islandDepth, surface: "bottomCabinets" };
  }
}

type Builder = (unit: CabinetUnit, s: GlobalSettings) => Part[];

const builders: Record<UnitType, Builder> = {
  // --- BASE UNITS ---------------------------------------------------------
  sink: (u, s) => {
    const { h, d, surface } = dimsFor("base", s);
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width / 2, h, surface },
      { kind: "doorFront", w: u.width / 2, h, surface },
      { kind: "shelf", w: u.width, d }, // mid-height shelf, plumbing above
      { kind: "pullOut", item: "binSingle" },
    ];
  },

  hob: (u, s) => {
    const { h, d, surface } = dimsFor("base", s);
    // Hob on the worktop over a drawer stack — no oven below (that's hobOven).
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "drawerBox", w: u.width, d, hDrawer: DRAWER_HEIGHT },
      { kind: "drawerFront", w: u.width, h: DRAWER_HEIGHT, surface },
      { kind: "doorFront", w: u.width, h: Math.max(h - DRAWER_HEIGHT, 0), surface },
    ];
    // hob cutout added to the worktop at kitchen level
  },

  hobOven: (u, s) => {
    const { h, d, surface } = dimsFor("base", s);
    const doorH = Math.max(h - DRAWER_HEIGHT, 0); // oven access below the drawer
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "drawerBox", w: u.width, d, hDrawer: DRAWER_HEIGHT },
      { kind: "drawerFront", w: u.width, h: DRAWER_HEIGHT, surface },
      { kind: "doorFront", w: u.width, h: doorH, surface },
    ];
    // hob cutout added to the worktop at kitchen level
  },

  dishwasher: (u, s) => {
    const { h, surface } = dimsFor("base", s);
    // The dishwasher is freestanding and slides into the gap — the only joinery
    // is the decor front panel fixed to its door. No carcass, no shelf.
    return [{ kind: "doorFront", w: u.width, h, surface }];
    // hood/appliance integration work priced at kitchen level, not here
  },

  storage: (u, s) => {
    const { h, d, surface } = dimsFor("base", s);
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width / 2, h, surface },
      { kind: "doorFront", w: u.width / 2, h, surface },
      { kind: "shelf", w: u.width, d },
    ];
  },

  cornerBase: (u, s) => {
    const { h, d, surface } = dimsFor("base", s);
    const w2 = u.width2 ?? u.width;
    return [
      { kind: "cornerShell", w1: u.width, w2, h, d },
      { kind: "doorFront", w: Math.min(CORNER_DOOR_W, u.width), h, surface },
      { kind: "pullOut", item: "magicCorner" },
    ];
  },

  // --- TALL UNITS ---------------------------------------------------------
  fridge: (u, s) => {
    const { h, d, surface } = dimsFor("tall", s);
    const upper = 600; // door above fridge (default split)
    const lower = Math.max(h - upper, 0);
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width, h: lower, surface },
      { kind: "doorFront", w: u.width, h: upper, surface },
    ];
  },

  ovenHousing: (u, s) => {
    const { h, d, surface } = dimsFor("tall", s);
    const below = 720;
    const above = Math.max(h - OVEN_RECESS - below, 0);
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width, h: below, surface },
      { kind: "doorFront", w: u.width, h: above, surface },
      { kind: "shelf", w: u.width, d },
    ];
  },

  ovenMicrowave: (u, s) => {
    const { h, d, surface } = dimsFor("tall", s);
    // Tall tower stacking a microwave recess over an oven, with storage below.
    const third = Math.round(h / 3);
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width, h: third, surface },
      { kind: "doorFront", w: u.width, h: third, surface },
      { kind: "doorFront", w: u.width, h: Math.max(h - 2 * third, 0), surface },
      { kind: "shelf", w: u.width, d },
    ];
    // oven + microwave cutouts (integration work) priced at kitchen level
  },

  microwave: (u, s) => {
    const { h, d, surface } = dimsFor("tall", s);
    // Tall housing with a microwave recess up top and storage below.
    const below = h / 2;
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width, h: below, surface },
      { kind: "doorFront", w: u.width, h: Math.max(h - below, 0), surface },
      { kind: "shelf", w: u.width, d },
    ];
    // microwave cutout (integration work) priced at kitchen level
  },

  larder: (u, s) => {
    const { h, d, surface } = dimsFor("tall", s);
    const doorH = h / 2; // two stacked full-height doors
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width, h: doorH, surface },
      { kind: "doorFront", w: u.width, h: doorH, surface },
      { kind: "shelf", w: u.width, d },
      { kind: "shelf", w: u.width, d },
      { kind: "shelf", w: u.width, d },
      { kind: "shelf", w: u.width, d },
    ];
  },

  // --- WALL UNITS ---------------------------------------------------------
  wall: (u, s) => {
    const { h, d, surface } = dimsFor("wall", s);
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width / 2, h, surface },
      { kind: "doorFront", w: u.width / 2, h, surface },
      { kind: "shelf", w: u.width, d },
    ];
  },

  cornerWall: (u, s) => {
    const { h, d, surface } = dimsFor("wall", s);
    const w2 = u.width2 ?? u.width;
    return [
      { kind: "cornerShell", w1: u.width, w2, h, d },
      { kind: "doorFront", w: Math.min(CORNER_DOOR_W, u.width), h, surface },
    ];
  },

  hoodHousing: (u, s) => {
    const { d, surface } = dimsFor("wall", s);
    // Short wall cabinet that conceals an integrated hood behind a lift-up flap.
    // The hood cutout (integration work) is priced at kitchen level.
    const h = HOOD_HOUSING_HEIGHT;
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width, h, surface },
    ];
  },

  microwaveWall: (u, s) => {
    const { h, d, surface } = dimsFor("wall", s);
    // Wall cabinet housing an integrated microwave behind an appliance front.
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width, h, surface },
    ];
    // microwave cutout (integration work) priced at kitchen level
  },

  // --- ISLAND UNITS -------------------------------------------------------
  island: (u, s) => {
    const { h, d, surface } = dimsFor("island", s);
    return [
      { kind: "shell", w: u.width, h, d },
      { kind: "doorFront", w: u.width / 2, h, surface },
      { kind: "doorFront", w: u.width / 2, h, surface },
      { kind: "shelf", w: u.width, d },
    ];
  },
};

/** Decompose a unit into its default BOM parts. */
export function unitParts(unit: CabinetUnit, settings: GlobalSettings): Part[] {
  return builders[unit.type](unit, settings);
}

/** Default display name per unit type (English; i18n deferred). */
export const UNIT_LABELS: Record<UnitType, string> = {
  sink: "Sink cabinet",
  hob: "Hob cabinet",
  hobOven: "Hob / oven cabinet",
  dishwasher: "Dishwasher housing",
  storage: "Storage cabinet",
  cornerBase: "Corner base unit",
  fridge: "Fridge housing",
  ovenHousing: "Oven housing",
  ovenMicrowave: "Oven & microwave housing",
  microwave: "Microwave housing",
  larder: "Tall unit",
  wall: "Wall cabinet",
  hoodHousing: "Hood housing",
  microwaveWall: "Microwave cabinet",
  cornerWall: "Corner wall unit",
  island: "Island unit",
};

/**
 * Default integrated appliance per unit type (UnitConfig appliance ids). Seeds
 * `CabinetUnit.appliance` at creation; the user can change it in the config.
 */
export const DEFAULT_APPLIANCE: Record<UnitType, string> = {
  sink: "sink",
  hob: "hob",
  hobOven: "hobOven",
  dishwasher: "dishwasher",
  storage: "none",
  cornerBase: "none",
  fridge: "fridge",
  ovenHousing: "oven",
  ovenMicrowave: "ovenMicrowave",
  microwave: "microwave",
  larder: "none",
  wall: "none",
  hoodHousing: "extractor",
  microwaveWall: "microwave",
  cornerWall: "none",
  island: "none",
};

export const UNIT_CATEGORY: Record<UnitType, UnitCategory> = {
  sink: "base",
  hob: "base",
  hobOven: "base",
  dishwasher: "base",
  storage: "base",
  cornerBase: "base",
  fridge: "tall",
  ovenHousing: "tall",
  ovenMicrowave: "tall",
  microwave: "tall",
  larder: "tall",
  wall: "wall",
  hoodHousing: "wall",
  microwaveWall: "wall",
  cornerWall: "wall",
  island: "island",
};

/**
 * Unit types selectable within each component-list section (for type-swap and
 * the add-unit menu). Each appliance-bearing type appears so the picker can
 * offer it directly and the appliance config can retype to it (Oven → oven
 * housing, Microwave → microwave housing, and so on).
 */
export const BASE_TALL_TYPES: UnitType[] = [
  "sink",
  "hob",
  "hobOven",
  "dishwasher",
  "storage",
  "cornerBase",
  "fridge",
  "ovenHousing",
  "ovenMicrowave",
  "microwave",
  "larder",
];
export const WALL_TYPES: UnitType[] = ["wall", "hoodHousing", "microwaveWall", "cornerWall"];
export const ISLAND_TYPES: UnitType[] = ["island"];

/**
 * The singleton "main appliance" units a kitchen normally has exactly one of.
 * (hobOven is the combined hob/oven unit.) Surfaced separately in the picker
 * and tracked for the missing-essentials notice.
 */
export const ESSENTIAL_TYPES: UnitType[] = ["sink", "hobOven", "fridge"];
