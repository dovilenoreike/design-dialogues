import { Minus, Plus } from "lucide-react";
import {
  primaryApplianceId,
  type CabinetUnit,
  type FrontConfig,
  type ProjectAppliance,
  type UnitCategory,
  type UnitType,
} from "@/lib/kitchen-calculator";

/**
 * Per-unit configuration — VISUAL MOCK ONLY (Phase: experience exploration).
 * Lets a unit deviate from its type's default interior: its front composition
 * and shelf count. Appliances, sink and fittings are edited on the row (glyphs +
 * the "+" menu), so they're intentionally not here. Nothing is wired to pricing
 * yet — it exists to feel out the interaction.
 *
 * The front is *composed*, not enumerated: doors, drawers and an appliance
 * facade are independent elements that stack in a fixed order (cupboard doors
 * above an appliance, drawers below; drawers above a plain door body). Counts
 * are steppers, so there's no id explosion.
 */

export interface UnitConfigState {
  /** The atomic appliances integrated in this unit ([] for none). */
  appliances: ProjectAppliance[];
  front: FrontConfig;
  shelves: number;
  accessories: string[];
}

const MAX_SHELVES = 6;
const SHELF_VALUES = Array.from({ length: MAX_SHELVES + 1 }, (_, i) => i);

// How many drawers a front allows: an appliance leaves little room (2 below it);
// a drawer-over-door combo up to 3; a pure drawer stack up to 6.
const maxDrawersFor = (front: FrontConfig): number =>
  front.appliance ? 2 : front.doors > 0 ? 3 : 6;

// The appliance facade's panel count: a fridge/freezer and an oven+microwave
// tower each read as two stacked panels; everything else as one.
function appliancePanelsFor(appliances: ProjectAppliance[]): number {
  const id = primaryApplianceId(appliances);
  return id === "fridge" || id === "ovenMicrowave" ? 2 : 1;
}

// ─── Options ────────────────────────────────────────────────────────────────

export interface Option {
  id: string;
  label: string;
}

// Front layouts available per unit category — used only to derive which front
// *elements* (doors / drawers / appliance) a unit permits, via FRONT_SPEC below.
const CATEGORY_FRONTS: Record<UnitCategory, string[]> = {
  base: ["doors2", "door1", "drawers2", "drawers3", "combo"],
  island: ["doors2", "door1", "drawers2", "drawers3"],
  tall: ["doorsTall", "ovenTower"],
  wall: ["doors2", "door1", "liftUp"],
};

// Some unit types constrain their fronts regardless of category. Corner units are
// single-door only — the interior is a magic-corner / carousel, so no drawers.
const FRONTS_BY_TYPE: Partial<Record<UnitType, string[]>> = {
  cornerBase: ["door1"],
  cornerWall: ["door1"],
};

// An appliance dictates the fronts it can sit behind — e.g. a dishwasher can't
// go behind drawers; an oven wants a tower or an integrated appliance front.
const APPLIANCE_FRONTS: Record<string, string[]> = {
  sink: ["doors2", "door1"],
  hob: ["drawers3", "drawers2", "combo", "doors2", "door1"],
  hobOven: ["combo", "applianceFront"],
  oven: ["applianceFront", "ovenTower"],
  ovenMicrowave: ["ovenTower", "applianceFront"],
  dishwasher: ["applianceFront", "door1"],
  microwave: ["applianceFront"],
  extractor: ["doors2", "door1", "integrated", "standalone"],
  fridge: ["applianceFront", "doorsTall"],
};

// ─── Front-element taxonomy (constraint metadata only) ───────────────────────

type FrontFamily = "doors" | "drawers" | "combo" | "liftUp" | "appliance";

// Each legacy front id maps to a family (+ a count for door/drawer families).
// These ids no longer persist — they only tell us which elements a unit allows
// and seed the default composition.
const FRONT_SPEC: Record<string, { family: FrontFamily; count?: number }> = {
  door1: { family: "doors", count: 1 },
  doors2: { family: "doors", count: 2 },
  doorsTall: { family: "doors", count: 2 },
  drawers2: { family: "drawers", count: 2 },
  drawers3: { family: "drawers", count: 3 },
  combo: { family: "combo" },
  liftUp: { family: "liftUp" },
  ovenTower: { family: "appliance" },
  applianceFront: { family: "appliance" },
  integrated: { family: "appliance" },
  standalone: { family: "appliance" },
};

const APPLIANCE_LABELS: Record<string, string> = {
  sink: "Sink",
  hob: "Hob",
  hobOven: "Hob + oven",
  oven: "Oven",
  ovenMicrowave: "Oven + microwave",
  microwave: "Microwave",
  dishwasher: "Dishwasher",
  extractor: "Hood",
  fridge: "Fridge",
};

/** Row-badge label for a unit's appliance ("" for none). */
export const applianceLabel = (id: string): string => APPLIANCE_LABELS[id] ?? "";

/**
 * Valid front ids for a unit: a per-type constraint wins (e.g. corners are
 * door-only), then the appliance's allowed fronts, else the category set.
 */
export function frontsFor(appliance: string, category: UnitCategory, type?: UnitType): string[] {
  if (type && FRONTS_BY_TYPE[type]) return FRONTS_BY_TYPE[type] as string[];
  if (appliance === "none" || !APPLIANCE_FRONTS[appliance]) return CATEGORY_FRONTS[category];
  return APPLIANCE_FRONTS[appliance];
}

/** The front *elements* (doors / drawers / appliance) a unit permits, plus the
 *  door-count cap. An appliance housing additionally permits a cupboard door and
 *  drawers *around* the appliance, even though its legacy ids don't list them. */
function allowedElements(validIds: string[], category: UnitCategory) {
  const fams = new Set(validIds.map((id) => FRONT_SPEC[id]?.family).filter(Boolean));
  const allowAppliance = fams.has("appliance");
  const doorCounts = validIds
    .filter((id) => FRONT_SPEC[id]?.family === "doors" || FRONT_SPEC[id]?.family === "liftUp")
    .map((id) => FRONT_SPEC[id]?.count ?? 1);
  const nativeDoors = fams.has("doors") || fams.has("combo") || fams.has("liftUp");
  const nativeDrawers = fams.has("drawers") || fams.has("combo");
  let maxDoors = doorCounts.length ? Math.max(...doorCounts) : 2;
  // A cupboard above an appliance is 1–2 doors; a tall unit can stack door pairs
  // (top box over a larder), so it allows up to four.
  if (allowAppliance) maxDoors = Math.max(maxDoors, 2);
  if (category === "tall") maxDoors = Math.max(maxDoors, 4);
  return {
    doors: nativeDoors || allowAppliance,
    drawers: nativeDrawers || allowAppliance,
    appliance: allowAppliance,
    // When the appliance facade is the *only* possible body, it can't be removed.
    applianceLocked: allowAppliance && !nativeDoors && !nativeDrawers,
    maxDoors,
  };
}

/** Seed a composition from a legacy default-front id (panels filled in later
 *  from the unit's appliance). */
function frontConfigFromId(id: string): FrontConfig {
  const base = { doors: 0, drawers: 0, appliance: false, appliancePanels: 1 };
  const spec = FRONT_SPEC[id];
  switch (spec?.family) {
    case "doors":
      return { ...base, doors: spec.count ?? 2 };
    case "drawers":
      return { ...base, drawers: spec.count ?? 3 };
    case "combo":
      return { ...base, doors: 1, drawers: 1 };
    case "liftUp":
      return { ...base, doors: 1 };
    case "appliance":
      return { ...base, appliance: true };
    default:
      return { ...base, doors: 2 };
  }
}

/** Compact one-liner for the preview ("2 doors + appliance + 1 drawer"). */
export function frontShort(front: FrontConfig): string {
  const parts: string[] = [];
  if (front.doors > 0) parts.push(`${front.doors} door${front.doors > 1 ? "s" : ""}`);
  if (front.appliance) parts.push("appliance");
  if (front.drawers > 0) parts.push(`${front.drawers} drawer${front.drawers > 1 ? "s" : ""}`);
  return parts.join(" + ") || "—";
}

// A couple of the most-used accessories, kept intentionally minimal.
export function accessoriesFor(unit: CabinetUnit): Option[] {
  if (unit.type === "dishwasher" || unit.type === "hoodHousing") return [];
  if (unit.type === "cornerBase" || unit.type === "cornerWall")
    return [{ id: "carousel", label: "Corner carousel" }];
  if (unit.category === "base" || unit.category === "island")
    return [
      { id: "bin", label: "Pull-out bin" },
      { id: "cutlery", label: "Cutlery insert" },
    ];
  if (unit.category === "tall") return [{ id: "pullout", label: "Pull-out larder" }];
  return [];
}

// ─── Defaults per unit type (mirrors the engine's default assemblies) ────────

const DEFAULT_BY_TYPE: Partial<
  Record<UnitType, { front?: string; shelves?: number; accessories?: string[] }>
> = {
  sink: { front: "drawers2", shelves: 0, accessories: ["bin"] },
  hob: { front: "drawers3", shelves: 0 },
  hobOven: { front: "applianceFront", shelves: 0 },
  dishwasher: { front: "door1", shelves: 0 },
  microwave: { front: "applianceFront", shelves: 1 },
  storage: { front: "drawers3", shelves: 0 },
  housing: { front: "doors2", shelves: 0 },
  cornerBase: { front: "door1", shelves: 0 },
  fridge: { front: "applianceFront", shelves: 0 },
  ovenHousing: { front: "ovenTower", shelves: 1 },
  ovenMicrowave: { front: "ovenTower", shelves: 1 },
  housingTall: { front: "doorsTall", shelves: 0 },
  larder: { front: "doorsTall", shelves: 4 },
  wall: { front: "doors2", shelves: 1 },
  hoodHousing: { front: "doors2", shelves: 0 },
  microwaveWall: { front: "applianceFront", shelves: 0 },
  housingWall: { front: "doors2", shelves: 0 },
  cornerWall: { front: "door1", shelves: 0 },
  island: { front: "doors2", shelves: 1 },
};

// Composed extras layered onto an appliance-housing default — a bridging cupboard
// above the fridge, a utility drawer under the oven tower, a cupboard beside the
// microwave.
const APPLIANCE_DEFAULT_EXTRAS: Partial<Record<UnitType, { doors?: number; drawers?: number }>> = {
  fridge: { doors: 1 },
  ovenHousing: { drawers: 1 },
  ovenMicrowave: { drawers: 1 },
  hobOven: { drawers: 1 },
  microwave: { doors: 1 },
  microwaveWall: { doors: 1 },
};

export function defaultUnitConfig(unit: CabinetUnit): UnitConfigState {
  const d = DEFAULT_BY_TYPE[unit.type] ?? {};
  const frontId = d.front ?? CATEGORY_FRONTS[unit.category][0];
  const front = frontConfigFromId(frontId);
  if (front.appliance) {
    front.appliancePanels = appliancePanelsFor(unit.appliances);
    const extra = APPLIANCE_DEFAULT_EXTRAS[unit.type];
    if (extra) {
      front.doors = extra.doors ?? front.doors;
      front.drawers = Math.min(extra.drawers ?? front.drawers, maxDrawersFor(front));
    }
  }
  return {
    appliances: [...unit.appliances],
    front,
    shelves: d.shelves ?? 1,
    accessories: d.accessories ?? [],
  };
}

// ─── Front schematic ─────────────────────────────────────────────────────────

// A vertical stack the icon renders top→bottom. Drawers become one band each so
// a tall stack reads as many thin bands.
type Band = { kind: "doors" | "drawers" | "appliance"; count: number; weight: number };

function frontBands(front: FrontConfig): Band[] {
  const bands: Band[] = [];
  // Doors stack in rows of two, so more doors → a taller band (a 4-door larder).
  const doorRows = Math.ceil(Math.min(front.doors, 2) > 0 ? front.doors / 2 : 0);
  const doorBand: Band = { kind: "doors", count: front.doors, weight: 2 * Math.max(doorRows, 1) };
  const applianceBand: Band = {
    kind: "appliance",
    count: front.appliancePanels,
    weight: front.appliancePanels >= 2 ? 4 : 2.5,
  };
  const drawerBands = Array.from({ length: front.drawers }, (): Band => ({
    kind: "drawers",
    count: 1,
    weight: 1,
  }));

  if (front.appliance) {
    // Cupboard door on top, appliance in the middle, drawers below.
    if (front.doors > 0) bands.push(doorBand);
    bands.push(applianceBand);
    bands.push(...drawerBands);
  } else {
    // Drawers over the door body (a combo), or one or the other alone.
    bands.push(...drawerBands);
    if (front.doors > 0) bands.push(doorBand);
  }
  return bands;
}

// Below this band height (in viewBox units) a band is drawn as a plain outline —
// the "max complexity" threshold that keeps a busy front from turning to noise.
const MIN_DETAIL_H = 6;

/** SVG diagram of a composed front — a stack of door / appliance / drawer bands,
 *  with per-band detail dropped once the bands get too thin to read. */
export function FrontIcon({
  front,
  className = "h-9 w-7",
}: {
  front: FrontConfig;
  className?: string;
}) {
  const stroke = "currentColor";
  const els: React.ReactNode[] = [];
  let k = 0;
  const key = () => `f${k++}`;
  const rect = (x: number, y: number, w: number, h: number) => (
    <rect key={key()} x={x} y={y} width={w} height={h} rx={1.5} fill="none" stroke={stroke} strokeWidth={1.4} />
  );
  const line = (x1: number, y1: number, x2: number, y2: number) => (
    <line key={key()} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={1.2} strokeLinecap="round" />
  );

  const L = 4;
  const W = 24;
  const T = 3;
  const H = 34;
  const R = L + W;
  const CX = L + W / 2;

  const bands = frontBands(front);
  const totalWeight = bands.reduce((s, b) => s + b.weight, 0) || 1;

  let y = T;
  for (const band of bands) {
    const h = (H * band.weight) / totalWeight;
    const detail = h >= MIN_DETAIL_H; // drop inner detail on thin bands
    els.push(rect(L, y, W, h));
    const my = y + h / 2;

    if (band.kind === "drawers" && detail) {
      els.push(line(CX - 4, my, CX + 4, my)); // pull
    } else if (band.kind === "doors") {
      // Doors laid out as a grid: up to two columns, stacking into rows.
      const cols = Math.min(band.count, 2);
      const rows = Math.ceil(band.count / cols);
      const cellW = W / cols;
      const cellH = h / rows;
      for (let c = 1; c < cols; c++) els.push(line(L + c * cellW, y + 1.5, L + c * cellW, y + h - 1.5));
      for (let r = 1; r < rows; r++) els.push(line(L, y + r * cellH, R, y + r * cellH));
      if (cellH >= MIN_DETAIL_H) {
        for (let idx = 0; idx < band.count; idx++) {
          const c = idx % cols;
          const r = Math.floor(idx / cols);
          const cy = y + r * cellH + cellH / 2;
          const px = cols === 2 ? (c === 0 ? CX - 3 : CX + 3) : R - 4;
          els.push(line(px, cy - 3, px, cy + 3));
        }
      }
    } else if (band.kind === "appliance") {
      if (detail) els.push(rect(L + 3, y + 2.5, W - 6, Math.min(3.5, h - 5))); // control strip
      // Split a multi-panel facade (fridge + freezer) with a divider line.
      for (let p = 1; p < band.count; p++) {
        els.push(line(L, y + (h * p) / band.count, R, y + (h * p) / band.count));
      }
      if (detail) els.push(line(R - 5, y + h - 3, R - 2, y + h - 3)); // handle
    }
    y += h;
  }

  return (
    <svg viewBox="0 0 32 40" className={className} aria-hidden>
      {els}
    </svg>
  );
}

/** –  N  + stepper that walks a fixed set of allowed values (may be sparse). */
function Stepper({
  value,
  values,
  onChange,
  label,
}: {
  value: number;
  values: number[];
  onChange: (next: number) => void;
  label: string;
}) {
  const i = values.indexOf(value);
  const atMin = i <= 0;
  const atMax = i < 0 || i >= values.length - 1;
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => !atMin && onChange(values[i - 1])}
        disabled={atMin}
        aria-label={`Fewer ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground transition hover:text-foreground disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-4 text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => !atMax && onChange(values[i + 1])}
        disabled={atMax}
        aria-label={`More ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground transition hover:text-foreground disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface UnitConfigProps {
  unit: CabinetUnit;
  value: UnitConfigState;
  onChange: (next: UnitConfigState) => void;
}

const SAGE = "#647d75";

export function UnitConfig({ unit, value, onChange }: UnitConfigProps) {
  const front = value.front;
  // Which elements this unit permits (fronts stay tailored to its appliance).
  const validIds = frontsFor(primaryApplianceId(value.appliances), unit.category, unit.type);
  const allow = allowedElements(validIds, unit.category);
  const applianceLocked = allow.applianceLocked;

  const doorsActive = front.doors > 0;
  const applianceActive = front.appliance;
  const drawersActive = front.drawers > 0;

  // Doors, drawers and the appliance facade are independent — a front just can't
  // end up empty, so a toggle that would clear the last element is ignored.
  const isEmpty = (f: FrontConfig) => f.doors === 0 && f.drawers === 0 && !f.appliance;
  const setFront = (next: FrontConfig) => {
    if (!isEmpty(next)) onChange({ ...value, front: next });
  };

  const toggleDrawers = () => setFront({ ...front, drawers: drawersActive ? 0 : 1 });

  const toggleDoors = () =>
    setFront({ ...front, doors: doorsActive ? 0 : front.appliance ? 1 : allow.maxDoors });

  const toggleAppliance = () => {
    if (applianceLocked) return;
    const next: FrontConfig = {
      ...front,
      appliance: !front.appliance,
      appliancePanels: appliancePanelsFor(value.appliances),
    };
    next.drawers = Math.min(next.drawers, maxDrawersFor(next));
    setFront(next);
  };

  const drawerValues = Array.from({ length: maxDrawersFor(front) }, (_, i) => i + 1);
  const doorValues = Array.from({ length: allow.maxDoors }, (_, i) => i + 1);

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );

  // Shared pill styling for the element toggles.
  const chip = (active: boolean) => ({
    className: "rounded-full border px-3 py-1.5 text-xs transition disabled:cursor-default",
    style: active ? { backgroundColor: SAGE, borderColor: SAGE, color: "#fff" } : undefined,
  });

  return (
    <div className="space-y-5">
      {/* Live preview — the composed front, scaled up. */}
      <div className="flex items-center justify-center gap-4 rounded-lg border bg-muted/40 py-4">
        <span style={{ color: SAGE }}>
          <FrontIcon front={front} className="h-24 w-[4.5rem]" />
        </span>
        <div className="text-xs text-muted-foreground">
          <div className="font-medium text-foreground">{frontShort(front)}</div>
          <div>{unit.width} mm wide</div>
        </div>
      </div>

      {/* Front — independent elements. With an appliance, doors sit above it and
          drawers below; otherwise drawers stack over the doors. */}
      <div>
        <SectionLabel>Front</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {allow.doors && (
            <button type="button" onClick={toggleDoors} {...chip(doorsActive)}>
              Doors
            </button>
          )}
          {allow.appliance && (
            <button
              type="button"
              onClick={toggleAppliance}
              disabled={applianceLocked}
              {...chip(applianceActive)}
            >
              Appliance front
            </button>
          )}
          {allow.drawers && (
            <button type="button" onClick={toggleDrawers} {...chip(drawersActive)}>
              Drawers
            </button>
          )}
        </div>
        {applianceActive && doorsActive && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">Cupboard door(s) above the appliance.</p>
        )}
        {applianceActive && drawersActive && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">Drawer(s) below the appliance.</p>
        )}
        {!applianceActive && doorsActive && drawersActive && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">Drawers over a door — a combo front.</p>
        )}
      </div>

      {/* Contextual: drawer count. */}
      {drawersActive && drawerValues.length > 1 && (
        <div>
          <SectionLabel>Drawers</SectionLabel>
          <Stepper value={front.drawers} values={drawerValues} onChange={(n) => setFront({ ...front, drawers: n })} label="drawers" />
        </div>
      )}

      {/* Contextual: door count. */}
      {doorsActive && doorValues.length > 1 && (
        <div>
          <SectionLabel>Doors</SectionLabel>
          <Stepper value={front.doors} values={doorValues} onChange={(n) => setFront({ ...front, doors: n })} label="doors" />
        </div>
      )}

      {/* Interior — shelves (behind doors only). */}
      {front.doors > 0 && (
        <div>
          <SectionLabel>Interior</SectionLabel>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Shelves</span>
            <Stepper
              value={value.shelves}
              values={SHELF_VALUES}
              onChange={(shelves) => onChange({ ...value, shelves })}
              label="shelves"
            />
          </div>
        </div>
      )}

      <p className="border-t pt-3 text-[11px] text-muted-foreground">
        Visual preview — configuration isn&apos;t reflected in the estimate yet.
      </p>
    </div>
  );
}
