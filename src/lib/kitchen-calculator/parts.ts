/**
 * Kitchen Furniture Price Calculator — primitive part pricing.
 *
 * Pure functions implementing spec §Pricing Formulas / §Primitive Parts. Each
 * returns a PricedBOM (itemised lines + subtotal). No hardcoded unit prices —
 * everything derives from material area × rate, edge-banding lm × rate, and
 * hardware product prices from the injected DB.
 */

import { hardwarePrice } from "./mock-config";
import type { Part, PricedBOM, PricedLine, PricingContext, SurfaceKey } from "./types";

/** mm → m */
const m = (mm: number): number => mm / 1000;
/** area in m² from two mm dimensions */
const areaM2 = (aMm: number, bMm: number): number => m(aMm) * m(bMm);

function bom(lines: PricedLine[]): PricedBOM {
  return { lines, subtotal: lines.reduce((s, l) => s + l.amount, 0) };
}

// --- Part 1: Cabinet Shell ------------------------------------------------

export function shellPrice(w: number, h: number, d: number, ctx: PricingContext): PricedBOM {
  const { carcassBoard, backPanel, edgeBanding } = ctx.config.structural;

  const carcassArea = 2 * areaM2(h, d) + 2 * areaM2(w, d); // 2 sides + top + bottom
  const backArea = areaM2(w, h);
  const ebLm = m(2 * h + 2 * w); // side front edges (2×H) + top + bottom front edges

  return bom([
    { label: "Carcass panels", amount: carcassArea * carcassBoard },
    { label: "Back panel", amount: backArea * backPanel },
    { label: "Edge banding", amount: ebLm * edgeBanding },
    { label: "Fixings set", amount: hardwarePrice(ctx.hardware, ctx.grade, "fixings") },
  ]);
}

// --- Corner Shell (variant of Cabinet Shell) ------------------------------

export function cornerShellPrice(
  w1: number,
  w2: number,
  h: number,
  d: number,
  ctx: PricingContext,
): PricedBOM {
  const { carcassBoard, backPanel, edgeBanding } = ctx.config.structural;

  // top and bottom are L-shaped: (W₁×D) + (W₂×D) − (D×D)
  const lTop = areaM2(w1, d) + areaM2(w2, d) - areaM2(d, d);
  const carcassArea = 2 * areaM2(h, d) + 2 * lTop; // 2 sides + L top + L bottom
  const backArea = areaM2(w1, h) + areaM2(w2, h);
  const ebLm = m(2 * h); // front-facing return edges of both sides

  return bom([
    { label: "Corner carcass panels", amount: carcassArea * carcassBoard },
    { label: "Back panels", amount: backArea * backPanel },
    { label: "Edge banding", amount: ebLm * edgeBanding },
    { label: "Fixings set", amount: hardwarePrice(ctx.hardware, ctx.grade, "fixings") },
  ]);
}

// --- Part 2: Shelf --------------------------------------------------------

export function shelfPrice(w: number, d: number, ctx: PricingContext): PricedBOM {
  const { carcassBoard, edgeBanding } = ctx.config.structural;
  return bom([
    { label: "Shelf panel", amount: areaM2(w, d) * carcassBoard },
    { label: "Shelf edge banding", amount: m(w) * edgeBanding },
    { label: "Shelf pins (×4)", amount: 4 * hardwarePrice(ctx.hardware, ctx.grade, "shelfPin") },
  ]);
}

// --- Part 3: Drawer Box ---------------------------------------------------

export function drawerBoxPrice(
  w: number,
  d: number,
  hDrawer: number,
  ctx: PricingContext,
): PricedBOM {
  const { carcassBoard, backPanel, edgeBanding } = ctx.config.structural;

  const carcassArea = 2 * areaM2(w, hDrawer) + 2 * areaM2(d, hDrawer); // front+back + 2 sides
  const baseArea = areaM2(w, d);
  const ebLm = m(2 * w + 2 * d); // top edges of front/back/sides

  return bom([
    { label: "Drawer box panels", amount: carcassArea * carcassBoard },
    { label: "Drawer base", amount: baseArea * backPanel },
    { label: "Drawer edge banding", amount: ebLm * edgeBanding },
    { label: "Runner pair", amount: hardwarePrice(ctx.hardware, ctx.grade, "runner") },
  ]);
}

// --- Part 4: Door / Drawer Front ------------------------------------------

function frontFace(w: number, h: number, surface: SurfaceKey, ctx: PricingContext): PricedLine[] {
  const { edgeBanding } = ctx.config.structural;
  const rate = ctx.config.surfaces[surface];
  const ebLm = m(2 * w + 2 * h); // all 4 edges
  return [
    { label: "Face panel", amount: areaM2(w, h) * rate },
    { label: "Front edge banding", amount: ebLm * edgeBanding },
  ];
}

export function doorFrontPrice(
  w: number,
  h: number,
  surface: SurfaceKey,
  ctx: PricingContext,
): PricedBOM {
  return bom([
    ...frontFace(w, h, surface, ctx),
    { label: "Hinge pair", amount: hardwarePrice(ctx.hardware, ctx.grade, "hinge") },
    { label: "Handle", amount: hardwarePrice(ctx.hardware, ctx.grade, "handle") },
  ]);
}

export function drawerFrontPrice(
  w: number,
  h: number,
  surface: SurfaceKey,
  ctx: PricingContext,
): PricedBOM {
  return bom([
    ...frontFace(w, h, surface, ctx),
    { label: "Handle", amount: hardwarePrice(ctx.hardware, ctx.grade, "handle") },
  ]);
}

// --- Part 5: Pull-out / internal fitting ----------------------------------

export function pullOutPrice(part: Extract<Part, { kind: "pullOut" }>, ctx: PricingContext): PricedBOM {
  const product = ctx.hardware[ctx.grade][part.item];
  return bom([{ label: product.name, amount: product.unitPrice }]);
}

// --- Dispatcher -----------------------------------------------------------

export function pricePart(part: Part, ctx: PricingContext): PricedBOM {
  switch (part.kind) {
    case "shell":
      return shellPrice(part.w, part.h, part.d, ctx);
    case "cornerShell":
      return cornerShellPrice(part.w1, part.w2, part.h, part.d, ctx);
    case "shelf":
      return shelfPrice(part.w, part.d, ctx);
    case "drawerBox":
      return drawerBoxPrice(part.w, part.d, part.hDrawer, ctx);
    case "doorFront":
      return doorFrontPrice(part.w, part.h, part.surface, ctx);
    case "drawerFront":
      return drawerFrontPrice(part.w, part.h, part.surface, ctx);
    case "pullOut":
      return pullOutPrice(part, ctx);
  }
}

/** Sum a list of parts into a single BOM subtotal. */
export function priceParts(parts: Part[], ctx: PricingContext): number {
  return parts.reduce((sum, part) => sum + pricePart(part, ctx).subtotal, 0);
}
