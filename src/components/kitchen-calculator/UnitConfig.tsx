import { Minus, Plus } from "lucide-react";
import {
  primaryApplianceId,
  type CabinetUnit,
  type FrontBody,
  type FrontConfig,
  type ProjectAppliance,
  type UnitCategory,
  type UnitType,
} from "@/lib/kitchen-calculator";

/**
 * Per-unit configuration — VISUAL MOCK ONLY (Phase: experience exploration).
 * Lets a unit deviate from its type's default interior: its front composition,
 * shelf count and a couple of key accessories. Appliances are edited inline on
 * the row (the glyph +/drop), so they're intentionally not here. Nothing is
 * wired to pricing yet — it exists to feel out the interaction.
 *
 * The front is *composed*, not enumerated: pick a body (Doors / Appliance /
 * none) and optionally stack drawers on top. Doors + drawers reads as a combo;
 * Appliance + drawers as an appliance with drawer(s) above. Counts are steppers,
 * so there's no id explosion.
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

// Drawer stacks / appliance fronts allow more or fewer drawers on top.
const maxDrawersFor = (body: FrontBody): number =>
  body === "appliance" ? 2 : body === "doors" ? 3 : 6;

// ─── Options ────────────────────────────────────────────────────────────────

interface Option {
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
  extractor: ["integrated", "standalone"],
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
 *  door count range. Appliance bodies always permit drawers on top (the oven +
 *  drawer case), even though the legacy ids don't list a drawer variant. */
function allowedElements(validIds: string[]) {
  const fams = new Set(validIds.map((id) => FRONT_SPEC[id]?.family).filter(Boolean));
  const allowAppliance = fams.has("appliance");
  const doorCounts = validIds
    .filter((id) => FRONT_SPEC[id]?.family === "doors" || FRONT_SPEC[id]?.family === "liftUp")
    .map((id) => FRONT_SPEC[id]?.count ?? 1);
  return {
    doors: fams.has("doors") || fams.has("combo") || fams.has("liftUp"),
    drawers: fams.has("drawers") || fams.has("combo") || allowAppliance,
    appliance: allowAppliance,
    minDoors: doorCounts.length ? Math.min(...doorCounts) : 1,
    maxDoors: doorCounts.length ? Math.max(...doorCounts) : 2,
  };
}

/** Seed a composition from a legacy default-front id. */
function frontConfigFromId(id: string): FrontConfig {
  const spec = FRONT_SPEC[id];
  switch (spec?.family) {
    case "doors":
      return { body: "doors", doors: spec.count ?? 2, drawers: 0 };
    case "drawers":
      return { body: "none", doors: 2, drawers: spec.count ?? 3 };
    case "combo":
      return { body: "doors", doors: 1, drawers: 1 };
    case "liftUp":
      return { body: "doors", doors: 1, drawers: 0 };
    case "appliance":
      return { body: "appliance", doors: 1, drawers: 0 };
    default:
      return { body: "doors", doors: 2, drawers: 0 };
  }
}

/** Compact one-liner for the row's configure control ("3 drawers", "2 doors",
 *  "1 drawer + appliance"). */
export function frontShort(front: FrontConfig): string {
  const parts: string[] = [];
  if (front.drawers > 0) parts.push(`${front.drawers} drawer${front.drawers > 1 ? "s" : ""}`);
  if (front.body === "doors") parts.push(`${front.doors} door${front.doors > 1 ? "s" : ""}`);
  else if (front.body === "appliance") parts.push("appliance");
  return parts.join(" + ") || "—";
}

// A couple of the most-used accessories, kept intentionally minimal.
function accessoriesFor(unit: CabinetUnit): Option[] {
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
  sink: { front: "doors2", shelves: 1, accessories: ["bin"] },
  hob: { front: "drawers3", shelves: 0 },
  hobOven: { front: "applianceFront", shelves: 0 },
  dishwasher: { front: "door1", shelves: 0 },
  microwave: { front: "applianceFront", shelves: 1 },
  storage: { front: "drawers3", shelves: 0 },
  housing: { front: "applianceFront", shelves: 0 },
  cornerBase: { front: "door1", shelves: 0 },
  fridge: { front: "doorsTall", shelves: 0 },
  ovenHousing: { front: "ovenTower", shelves: 1 },
  ovenMicrowave: { front: "ovenTower", shelves: 1 },
  housingTall: { front: "applianceFront", shelves: 0 },
  larder: { front: "doorsTall", shelves: 4 },
  wall: { front: "doors2", shelves: 1 },
  hoodHousing: { front: "integrated", shelves: 0 },
  microwaveWall: { front: "applianceFront", shelves: 0 },
  housingWall: { front: "applianceFront", shelves: 0 },
  cornerWall: { front: "door1", shelves: 0 },
  island: { front: "doors2", shelves: 1 },
};

export function defaultUnitConfig(unit: CabinetUnit): UnitConfigState {
  const d = DEFAULT_BY_TYPE[unit.type] ?? {};
  const frontId = d.front ?? CATEGORY_FRONTS[unit.category][0];
  return {
    appliances: [...unit.appliances],
    front: frontConfigFromId(frontId),
    shelves: d.shelves ?? 1,
    accessories: d.accessories ?? [],
  };
}

// ─── Front schematic ─────────────────────────────────────────────────────────

/** SVG diagram of a composed front: drawers stacked on top of the body. */
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
  const B = T + H;
  const CX = L + W / 2;

  const { body, doors, drawers } = front;
  const bodyWeight = body === "none" ? 0 : 2;
  const totalWeight = drawers + bodyWeight || 1;
  const bandH = H / totalWeight;

  // Drawer bands on top, each with a centred pull.
  let y = T;
  for (let i = 0; i < drawers; i++) {
    els.push(rect(L, y, W, bandH));
    els.push(line(CX - 4, y + bandH / 2, CX + 4, y + bandH / 2));
    y += bandH;
  }

  // Body below the drawers.
  const bodyH = B - y;
  if (body === "doors") {
    els.push(rect(L, y, W, bodyH));
    if (doors >= 2) {
      els.push(line(CX, y + 2, CX, B - 2)); // centre divider
      els.push(line(CX - 3, y + bodyH / 2 - 3, CX - 3, y + bodyH / 2 + 3)); // left pull
      els.push(line(CX + 3, y + bodyH / 2 - 3, CX + 3, y + bodyH / 2 + 3)); // right pull
    } else {
      els.push(line(R - 4, y + bodyH / 2 - 3, R - 4, y + bodyH / 2 + 3)); // single pull
    }
  } else if (body === "appliance") {
    els.push(rect(L, y, W, bodyH));
    els.push(rect(L + 3, y + 3, W - 6, Math.min(4, bodyH - 6))); // control strip
    els.push(line(L + 5, B - 4, R - 5, B - 4)); // handle
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
  const allow = allowedElements(validIds);
  // An appliance housing with no door alternative must keep its facade.
  const applianceLocked = allow.appliance && !allow.doors;
  const accessories = accessoriesFor(unit);

  const doorsActive = front.body === "doors";
  const applianceActive = front.body === "appliance";
  const drawersActive = front.drawers > 0;

  const setFront = (next: FrontConfig) => onChange({ ...value, front: next });

  const toggleDrawers = () => {
    if (drawersActive) {
      // Can only clear drawers if a body remains (never leave an empty front).
      if (front.body !== "none") setFront({ ...front, drawers: 0 });
    } else {
      setFront({ ...front, drawers: 1 });
    }
  };

  const selectBody = (body: "doors" | "appliance") => {
    if (front.body === body) {
      if (body === "appliance" && applianceLocked) return;
      // Turning a body off falls back to a drawer stack when drawers are present.
      if (front.drawers > 0) setFront({ ...front, body: "none" });
      return;
    }
    setFront({
      ...front,
      body,
      doors:
        body === "doors" ? Math.min(Math.max(front.doors || allow.maxDoors, allow.minDoors), allow.maxDoors) : front.doors,
      drawers: Math.min(front.drawers, maxDrawersFor(body)),
    });
  };

  const drawerValues = Array.from({ length: maxDrawersFor(front.body) }, (_, i) => i + 1);
  const doorValues = Array.from({ length: allow.maxDoors - allow.minDoors + 1 }, (_, i) => allow.minDoors + i);

  const toggleAccessory = (id: string) =>
    onChange({
      ...value,
      accessories: value.accessories.includes(id)
        ? value.accessories.filter((a) => a !== id)
        : [...value.accessories, id],
    });

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

      {/* Front — compose from elements. Doors/Appliance are the body (mutually
          exclusive); Drawers stack on top. */}
      <div>
        <SectionLabel>Front</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {allow.drawers && (
            <button type="button" onClick={toggleDrawers} {...chip(drawersActive)}>
              Drawers
            </button>
          )}
          {allow.doors && (
            <button type="button" onClick={() => selectBody("doors")} {...chip(doorsActive)}>
              Doors
            </button>
          )}
          {allow.appliance && (
            <button
              type="button"
              onClick={() => selectBody("appliance")}
              disabled={applianceLocked}
              {...chip(applianceActive)}
            >
              Appliance front
            </button>
          )}
        </div>
        {drawersActive && doorsActive && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">Drawers over a door — a combo front.</p>
        )}
        {drawersActive && applianceActive && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">Drawer(s) above the appliance.</p>
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
      {front.body === "doors" && (
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

      {/* Accessories — deliberately just the essentials for now. */}
      {accessories.length > 0 && (
        <div>
          <SectionLabel>Accessories</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {accessories.map((acc) => {
              const active = value.accessories.includes(acc.id);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => toggleAccessory(acc.id)}
                  className="rounded-full border px-3 py-1.5 text-xs transition"
                  style={active ? { backgroundColor: SAGE, borderColor: SAGE, color: "#fff" } : undefined}
                >
                  {acc.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="border-t pt-3 text-[11px] text-muted-foreground">
        Visual preview — configuration isn&apos;t reflected in the estimate yet.
      </p>
    </div>
  );
}
