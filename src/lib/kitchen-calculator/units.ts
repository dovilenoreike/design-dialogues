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
  hobOven: "Hob / oven cabinet",
  storage: "Storage cabinet",
  cornerBase: "Corner base unit",
  fridge: "Fridge housing",
  ovenHousing: "Oven housing",
  larder: "Tall unit",
  wall: "Wall cabinet",
  cornerWall: "Corner wall unit",
  island: "Island unit",
};

/**
 * Default integrated appliance per unit type (UnitConfig appliance ids). Seeds
 * `CabinetUnit.appliance` at creation; the user can change it in the config.
 */
export const DEFAULT_APPLIANCE: Record<UnitType, string> = {
  sink: "sink",
  hobOven: "hobOven",
  storage: "none",
  cornerBase: "none",
  fridge: "fridge",
  ovenHousing: "oven",
  larder: "none",
  wall: "none",
  cornerWall: "none",
  island: "none",
};

export const UNIT_CATEGORY: Record<UnitType, UnitCategory> = {
  sink: "base",
  hobOven: "base",
  storage: "base",
  cornerBase: "base",
  fridge: "tall",
  ovenHousing: "tall",
  larder: "tall",
  wall: "wall",
  cornerWall: "wall",
  island: "island",
};

/**
 * Unit types selectable within each component-list section (for type-swap).
 * `ovenHousing` is intentionally omitted — a Tall unit (larder) covers it via
 * the appliance config (None = storage, Oven = oven housing). The type still
 * exists in the engine for when config drives the BOM.
 */
export const BASE_TALL_TYPES: UnitType[] = [
  "sink",
  "hobOven",
  "storage",
  "cornerBase",
  "fridge",
  "larder",
];
export const WALL_TYPES: UnitType[] = ["wall", "cornerWall"];
export const ISLAND_TYPES: UnitType[] = ["island"];

/**
 * The singleton "main appliance" units a kitchen normally has exactly one of.
 * (hobOven is the combined hob/oven unit.) Surfaced separately in the picker
 * and tracked for the missing-essentials notice.
 */
export const ESSENTIAL_TYPES: UnitType[] = ["sink", "hobOven", "fridge"];
