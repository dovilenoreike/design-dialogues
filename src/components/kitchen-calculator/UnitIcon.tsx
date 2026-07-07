import type { CabinetUnit, UnitType } from "@/lib/kitchen-calculator";

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
}

/** Default zone configuration per unit type. */
const SPECS: Record<UnitType, IconSpec> = {
  sink: { frame: "base", zones: ["door_pair"], worktop: "sink" },
  hobOven: { frame: "base", zones: ["oven"], worktop: "hob" },
  dishwasher: { frame: "base", zones: ["door_single"] },
  storage: { frame: "base", zones: ["drawer", "drawer"] },
  cornerBase: { frame: "base", zones: ["door_single"], corner: true },
  fridge: { frame: "tall", zones: [], empty: true },
  ovenHousing: { frame: "tall", zones: ["oven", "drawer"] },
  larder: { frame: "tall", zones: ["door_pair", "door_pair"] },
  wall: { frame: "wall", zones: ["door_pair"] },
  hoodHousing: { frame: "wall", zones: ["door_single"] },
  cornerWall: { frame: "wall", zones: ["door_single"], corner: true },
  island: { frame: "base", zones: ["drawer", "drawer"], island: true },
};

// Geometry, in the fixed 80×80 viewbox (type/config only — not to scale).
const VB = 80;
const PAD = 6;
const SW = 1.5;
const R = 3;
const WORKTOP_H = 7;
const PLINTH_H = 5;
const LEG_H = 4;
const LEG_W = 6;
const GAP = 2;
const LEFT = PAD;
const RIGHT = VB - PAD;
const INNER_W = RIGHT - LEFT;
const CX = VB / 2;

interface Bounds {
  worktopTop: number | null;
  shellTop: number;
  shellBottom: number;
  plinthTop: number | null;
  hasLegs: boolean;
}

function bounds(frame: Frame): Bounds {
  const legTop = VB - PAD - LEG_H;
  const plinthBottom = legTop;
  const plinthTop = plinthBottom - PLINTH_H;
  if (frame === "wall") {
    return { worktopTop: null, shellTop: PAD, shellBottom: VB - PAD, plinthTop: null, hasLegs: false };
  }
  if (frame === "tall") {
    return { worktopTop: null, shellTop: PAD, shellBottom: plinthTop, plinthTop, hasLegs: true };
  }
  // base
  return {
    worktopTop: PAD,
    shellTop: PAD + WORKTOP_H + GAP,
    shellBottom: plinthTop,
    plinthTop,
    hasLegs: true,
  };
}

interface UnitTypeIconProps {
  type: UnitType;
  label?: string; // accessible label; falls back to the type
  size?: number; // rendered px, default 48
  className?: string;
}

/** Small SVG icon for a unit *type* (used in the type dropdown). */
export function UnitTypeIcon({ type, label, size = 48, className }: UnitTypeIconProps) {
  const spec = SPECS[type];
  const b = bounds(spec.frame);
  const els: JSX.Element[] = [];
  let k = 0;
  const key = () => `e${k++}`;

  const line = (x1: number, y1: number, x2: number, y2: number) => (
    <line key={key()} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />
  );
  const rect = (x: number, y: number, w: number, h: number, rx = R) => (
    <rect key={key()} x={x} y={y} width={w} height={h} rx={rx} ry={rx} fill="none" />
  );

  // Worktop bar (base units only).
  if (b.worktopTop !== null) {
    els.push(rect(LEFT, b.worktopTop, INNER_W, WORKTOP_H, 2));
    const wtMid = b.worktopTop + WORKTOP_H / 2;
    if (spec.worktop === "sink") {
      els.push(
        <ellipse key={key()} cx={CX} cy={wtMid} rx={11} ry={2.6} fill="none" />,
      );
      // tap: short riser with a spout bend, to the right of the bowl
      els.push(line(CX + 13, b.worktopTop - 2, CX + 13, wtMid));
      els.push(line(CX + 13, b.worktopTop - 2, CX + 9, b.worktopTop - 2));
    } else if (spec.worktop === "hob") {
      // 2×2 burner grid
      for (const bx of [CX - 8, CX + 8]) {
        for (const by of [wtMid - 2, wtMid + 2]) {
          els.push(<circle key={key()} cx={bx} cy={by} r={1.5} fill="none" />);
        }
      }
    }
  }

  // Shell.
  els.push(rect(LEFT, b.shellTop, INNER_W, b.shellBottom - b.shellTop));

  // Island side panels — an inset vertical line on each edge.
  if (spec.island) {
    els.push(line(LEFT + 3, b.shellTop + 3, LEFT + 3, b.shellBottom - 3));
    els.push(line(RIGHT - 3, b.shellTop + 3, RIGHT - 3, b.shellBottom - 3));
  }

  // Zones + handles (skipped for an empty interior like a fridge).
  if (!spec.empty && spec.zones.length > 0) {
    const zh = (b.shellBottom - b.shellTop) / spec.zones.length;
    spec.zones.forEach((zone, i) => {
      const zTop = b.shellTop + i * zh;
      const zBottom = zTop + zh;
      const zMid = zTop + zh / 2;
      if (i > 0) els.push(line(LEFT, zTop, RIGHT, zTop)); // divider between zones

      if (zone === "drawer") {
        const hw = INNER_W * 0.6;
        els.push(line(CX - hw / 2, zMid, CX + hw / 2, zMid));
      } else if (zone === "door_single") {
        const hw = INNER_W * 0.3;
        els.push(line(CX - hw / 2, zMid, CX + hw / 2, zMid));
      } else if (zone === "door_pair") {
        els.push(line(CX, zTop + 3, CX, zBottom - 3)); // centre divider
        const half = INNER_W / 2;
        const hw = half * 0.4;
        const leftC = LEFT + half / 2;
        const rightC = RIGHT - half / 2;
        els.push(line(leftC - hw / 2, zMid, leftC + hw / 2, zMid));
        els.push(line(rightC - hw / 2, zMid, rightC + hw / 2, zMid));
      } else if (zone === "open") {
        els.push(line(LEFT + 3, zMid, RIGHT - 3, zMid)); // shelf line
      } else if (zone === "oven") {
        const ox = LEFT + 5;
        const oy = zTop + 4;
        const ow = INNER_W - 10;
        const oh = Math.max(zh - 8, 4);
        els.push(rect(ox, oy, ow, oh, 2));
        els.push(line(CX - 7, oy + 4, CX + 7, oy + 4)); // oven handle
      }
    });
  }

  // Corner return — angled line across the top-right of the shell.
  if (spec.corner) {
    const c = 14;
    els.push(line(RIGHT - c, b.shellTop, RIGHT, b.shellTop + c));
  }

  // Plinth + legs (base and tall).
  if (b.plinthTop !== null) {
    els.push(rect(LEFT, b.plinthTop, INNER_W, PLINTH_H, 1));
  }
  if (b.hasLegs) {
    const legTop = VB - PAD - LEG_H;
    els.push(rect(LEFT + 1, legTop, LEG_W, LEG_H, 1));
    els.push(rect(RIGHT - 1 - LEG_W, legTop, LEG_W, LEG_H, 1));
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

/** Small SVG icon for a placed cabinet unit (delegates to its type). */
export function UnitIcon({ unit, size, className }: UnitIconProps) {
  return <UnitTypeIcon type={unit.type} label={unit.name} size={size} className={className} />;
}
