import { type CabinetUnit, type UnitType } from "@/lib/kitchen-calculator";

/**
 * Programmatic line-drawing SVG icon for a cabinet unit.
 *
 * Icons are generated from the unit's type — never static assets — so they
 * update reactively whenever the type changes. Per kitchen-calculator-spec-icons.md.
 *
 * Zones are currently *derived* from the unit type (interior zone editing is a
 * later phase). When per-unit zone data lands, feed real zones into `SPECS`
 * and the geometry below renders unchanged.
 */

type ZoneKind = "drawer" | "door_single" | "door_pair" | "open" | "oven";
type Frame = "base" | "tall" | "wall";

interface IconSpec {
  frame: Frame;
  zones: ZoneKind[];
  worktop?: "sink" | "hob";
  corner?: boolean;
  island?: boolean;
  empty?: boolean; // no zones — single open interior (fridge)
  dashed?: boolean; // undefined/placeholder outline (empty appliance housing)
}

/**
 * Zone configuration per unit type. Appliance housings are intentionally plain
 * boxes — the appliance glyph badge carries the "what's inside" meaning, so the
 * carcass icon stays a minimalist outline (dashed while still empty). Only the
 * non-appliance carcasses (storage drawers, sink, corners) keep interior detail.
 */
const SPECS: Record<UnitType, IconSpec> = {
  sink: { frame: "base", zones: ["door_pair"], worktop: "sink" },
  hob: { frame: "base", zones: [] },
  hobOven: { frame: "base", zones: [] },
  dishwasher: { frame: "base", zones: [] },
  storage: { frame: "base", zones: ["drawer", "drawer"] },
  housing: { frame: "base", zones: [], dashed: true },
  housingTall: { frame: "tall", zones: [], dashed: true },
  housingWall: { frame: "wall", zones: [], dashed: true },
  cornerBase: { frame: "base", zones: ["door_single"], corner: true },
  fridge: { frame: "tall", zones: [] },
  ovenHousing: { frame: "tall", zones: [] },
  ovenMicrowave: { frame: "tall", zones: [] },
  microwave: { frame: "tall", zones: [] },
  larder: { frame: "tall", zones: ["door_pair", "door_pair"] },
  wall: { frame: "wall", zones: ["door_pair"] },
  hoodHousing: { frame: "wall", zones: [] },
  microwaveWall: { frame: "wall", zones: [] },
  cornerWall: { frame: "wall", zones: ["door_single"], corner: true },
  island: { frame: "base", zones: ["drawer", "drawer"], island: true },
};

// Geometry, in the fixed 80×80 viewbox (type/config only — not to scale).
const VB = 80;
const PAD = 6;
const SW = 1.5;
const R = 3;
const LEG_W = 6;
const LEG_H = 4;
const CX = VB / 2;
// Body width per frame: tall units are drawn narrow (a portrait silhouette),
// low and wall units wide (landscape) — so shape alone reads as tall vs low.
const TALL_BODY_W = 34;
const WIDE_BODY_W = VB - 2 * PAD;

interface Bounds {
  shellTop: number;
  shellBottom: number;
}

// Vertical extents per frame — a minimalist box positioned so the silhouette
// alone reads as low vs tall: a low unit is a short box on the floor, a tall
// unit fills the height, a wall unit is a short box hung near the top.
const FLOOR = 72;
function bounds(frame: Frame): Bounds {
  if (frame === "wall") return { shellTop: 8, shellBottom: 38 };
  if (frame === "tall") return { shellTop: 8, shellBottom: FLOOR };
  return { shellTop: 42, shellBottom: FLOOR }; // base (low)
}

interface UnitTypeIconProps {
  type: UnitType;
  label?: string; // accessible label; falls back to the type
  size?: number; // rendered px, default 48
  className?: string;
}

/** Small SVG icon for a unit type's carcass (the appliance is shown as a badge). */
export function UnitTypeIcon({ type, label, size = 48, className }: UnitTypeIconProps) {
  const spec = SPECS[type];
  const b = bounds(spec.frame);
  // EXPERIMENT: all frames drawn at the narrow (tall) width, so every icon shares
  // one width and low vs tall reads by height alone. Revert to
  // `spec.frame === "tall" ? TALL_BODY_W : WIDE_BODY_W` for the landscape/portrait look.
  const innerW = TALL_BODY_W;
  const left = (VB - innerW) / 2;
  const right = left + innerW;
  const els: JSX.Element[] = [];
  let k = 0;
  const key = () => `e${k++}`;

  const line = (x1: number, y1: number, x2: number, y2: number) => (
    <line key={key()} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />
  );
  const rect = (x: number, y: number, w: number, h: number, rx = R) => (
    <rect key={key()} x={x} y={y} width={w} height={h} rx={rx} ry={rx} fill="none" />
  );

  // Shell — a plain box; dashed for an undefined/placeholder housing.
  els.push(
    <rect
      key={key()}
      x={left}
      y={b.shellTop}
      width={innerW}
      height={b.shellBottom - b.shellTop}
      rx={R}
      ry={R}
      fill="none"
      strokeDasharray={spec.dashed ? "3 2.5" : undefined}
    />,
  );

  // Sink basin — a simple oval set into the top edge of the box.
  if (spec.worktop === "sink") {
    els.push(<ellipse key={key()} cx={CX} cy={b.shellTop + 3.5} rx={10} ry={2.4} fill="none" />);
  }

  // Island side panels — an inset vertical line on each edge.
  if (spec.island) {
    els.push(line(left + 3, b.shellTop + 3, left + 3, b.shellBottom - 3));
    els.push(line(right - 3, b.shellTop + 3, right - 3, b.shellBottom - 3));
  }

  // Zones + handles (skipped for an empty interior like a fridge).
  if (!spec.empty && spec.zones.length > 0) {
    const zh = (b.shellBottom - b.shellTop) / spec.zones.length;
    spec.zones.forEach((zone, i) => {
      const zTop = b.shellTop + i * zh;
      const zBottom = zTop + zh;
      const zMid = zTop + zh / 2;
      if (i > 0) els.push(line(left, zTop, right, zTop)); // divider between zones

      if (zone === "drawer") {
        const hw = innerW * 0.6;
        els.push(line(CX - hw / 2, zMid, CX + hw / 2, zMid));
      } else if (zone === "door_single") {
        const hw = innerW * 0.3;
        els.push(line(CX - hw / 2, zMid, CX + hw / 2, zMid));
      } else if (zone === "door_pair") {
        els.push(line(CX, zTop + 3, CX, zBottom - 3)); // centre divider
        const half = innerW / 2;
        const hw = half * 0.4;
        const leftC = left + half / 2;
        const rightC = right - half / 2;
        els.push(line(leftC - hw / 2, zMid, leftC + hw / 2, zMid));
        els.push(line(rightC - hw / 2, zMid, rightC + hw / 2, zMid));
      } else if (zone === "open") {
        els.push(line(left + 3, zMid, right - 3, zMid)); // shelf line
      } else if (zone === "oven") {
        const ox = left + 5;
        const oy = zTop + 4;
        const ow = innerW - 10;
        const oh = Math.max(zh - 8, 4);
        els.push(rect(ox, oy, ow, oh, 2));
        els.push(line(CX - 7, oy + 4, CX + 7, oy + 4)); // oven handle
      }
    });
  }

  // Corner return — angled line across the top-right of the shell.
  if (spec.corner) {
    const c = 14;
    els.push(line(right - c, b.shellTop, right, b.shellTop + c));
  }

  // Little legs on floor-standing units (base + tall; wall cabinets are hung).
  if (spec.frame !== "wall") {
    els.push(rect(left + 2, b.shellBottom, LEG_W, LEG_H, 1));
    els.push(rect(right - 2 - LEG_W, b.shellBottom, LEG_W, LEG_H, 1));
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={SW}
      className={className}
      role="img"
      aria-label={label ?? type}
    >
      {els}
    </svg>
  );
}

interface UnitIconProps {
  unit: CabinetUnit;
  size?: number;
  className?: string;
}

/** Small SVG icon for a placed cabinet unit — its carcass outline (the
 *  appliances it holds are shown as glyph badges alongside it). */
export function UnitIcon({ unit, size, className }: UnitIconProps) {
  return <UnitTypeIcon type={unit.type} label={unit.name} size={size} className={className} />;
}
