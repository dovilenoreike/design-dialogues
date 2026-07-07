import { Minus, Plus } from "lucide-react";
import type { CabinetUnit, UnitCategory, UnitType } from "@/lib/kitchen-calculator";

/**
 * Per-unit configuration — VISUAL MOCK ONLY (Phase: experience exploration).
 * Lets a unit deviate from its type's default interior: which appliance it
 * integrates, its front layout, and a couple of key accessories. Nothing here
 * is wired to pricing yet — it exists to feel out the interaction.
 */

export interface UnitConfigState {
  appliance: string;
  front: string;
  shelves: number;
  accessories: string[];
}

const MAX_SHELVES = 6;
// Drawer stacks leave no room for shelves.
const DRAWER_ONLY_FRONTS = new Set(["drawers2", "drawers3"]);
const hasShelves = (front: string) => !DRAWER_ONLY_FRONTS.has(front);

// ─── Options ────────────────────────────────────────────────────────────────

interface Option {
  id: string;
  label: string;
}

const APPLIANCES: Record<UnitCategory, Option[]> = {
  base: [
    { id: "none", label: "None" },
    { id: "sink", label: "Sink" },
    { id: "hob", label: "Hob" },
    { id: "hobOven", label: "Hob + oven" },
    { id: "oven", label: "Oven" },
    { id: "dishwasher", label: "Dishwasher" },
  ],
  island: [
    { id: "none", label: "None" },
    { id: "sink", label: "Sink" },
    { id: "hob", label: "Hob" },
    { id: "hobOven", label: "Hob + oven" },
  ],
  // A Tall unit (larder) is None = storage, or Oven / Microwave. Fridge is its
  // own unit type, so it's excluded here (see APPLIANCES_BY_TYPE).
  tall: [
    { id: "none", label: "None" },
    { id: "oven", label: "Oven" },
    { id: "microwave", label: "Microwave" },
  ],
  wall: [
    { id: "none", label: "None" },
    { id: "extractor", label: "Extractor" },
    { id: "microwave", label: "Microwave" },
  ],
};

// Units whose appliance is intrinsic to the type — shown as a single, fixed chip.
const APPLIANCES_BY_TYPE: Partial<Record<UnitType, Option[]>> = {
  fridge: [{ id: "fridge", label: "Fridge / freezer" }],
};

// Front layouts available per unit category (ids resolve via FRONT_LABELS / FrontIcon).
const CATEGORY_FRONTS: Record<UnitCategory, string[]> = {
  base: ["doors2", "door1", "drawers2", "drawers3", "combo"],
  island: ["doors2", "door1", "drawers2", "drawers3"],
  tall: ["doorsTall", "ovenTower"],
  wall: ["doors2", "door1", "liftUp"],
};

// An appliance dictates the fronts it can sit behind — e.g. a dishwasher can't
// go behind drawers; an oven wants a tower or an integrated appliance front.
const APPLIANCE_FRONTS: Record<string, string[]> = {
  sink: ["doors2", "door1"],
  hob: ["drawers3", "drawers2", "combo", "doors2", "door1"],
  // Hob on the worktop, oven built in below — a drawer over the oven, or a full facade.
  hobOven: ["combo", "applianceFront"],
  oven: ["applianceFront", "ovenTower"],
  dishwasher: ["applianceFront", "door1"],
  microwave: ["applianceFront"],
  extractor: ["applianceFront", "doors2", "door1"],
  fridge: ["applianceFront", "doorsTall"],
};

const FRONT_LABELS: Record<string, string> = {
  doors2: "2 doors",
  door1: "1 door",
  drawers2: "2 drawers",
  drawers3: "3 drawers",
  combo: "Drawer + door",
  doorsTall: "2 doors",
  ovenTower: "Appliance tower",
  liftUp: "Lift-up",
  applianceFront: "Appliance front",
};

const APPLIANCE_LABELS: Record<string, string> = {
  sink: "Sink",
  hob: "Hob",
  hobOven: "Hob + oven",
  oven: "Oven",
  microwave: "Microwave",
  dishwasher: "Dishwasher",
  extractor: "Hood",
  fridge: "Fridge",
};

/** Row-badge label for a unit's appliance ("" for none). */
export const applianceLabel = (id: string): string => APPLIANCE_LABELS[id] ?? "";

/** Valid front layouts for the current appliance (falls back to the category set). */
export function frontsFor(appliance: string, category: UnitCategory): string[] {
  if (appliance === "none" || !APPLIANCE_FRONTS[appliance]) return CATEGORY_FRONTS[category];
  return APPLIANCE_FRONTS[appliance];
}

// A couple of the most-used accessories, kept intentionally minimal.
function accessoriesFor(unit: CabinetUnit): Option[] {
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

const DEFAULT_BY_TYPE: Partial<Record<UnitType, Partial<UnitConfigState>>> = {
  sink: { appliance: "sink", front: "doors2", shelves: 1, accessories: ["bin"] },
  hobOven: { appliance: "hobOven", front: "combo", shelves: 0 },
  storage: { appliance: "none", front: "drawers3", shelves: 0 },
  cornerBase: { appliance: "none", front: "door1", shelves: 0 },
  fridge: { appliance: "fridge", front: "doorsTall", shelves: 0 },
  ovenHousing: { appliance: "oven", front: "ovenTower", shelves: 1 },
  larder: { appliance: "none", front: "doorsTall", shelves: 4 },
  wall: { appliance: "none", front: "doors2", shelves: 1 },
  cornerWall: { appliance: "none", front: "door1", shelves: 0 },
  island: { appliance: "none", front: "doors2", shelves: 1 },
};

export function defaultUnitConfig(unit: CabinetUnit): UnitConfigState {
  const d = DEFAULT_BY_TYPE[unit.type] ?? {};
  return {
    appliance: d.appliance ?? "none",
    front: d.front ?? CATEGORY_FRONTS[unit.category][0],
    shelves: d.shelves ?? 1,
    accessories: d.accessories ?? [],
  };
}

// ─── Front-layout schematic ──────────────────────────────────────────────────

/** Small SVG diagram of a front layout — panels drawn as rounded rects. */
function FrontIcon({ id }: { id: string }) {
  const stroke = "currentColor";
  const rect = (x: number, y: number, w: number, h: number) => (
    <rect
      key={`${x}-${y}`}
      x={x}
      y={y}
      width={w}
      height={h}
      rx={1.5}
      fill="none"
      stroke={stroke}
      strokeWidth={1.4}
    />
  );
  let shapes: React.ReactNode;
  switch (id) {
    case "door1":
      shapes = rect(4, 3, 24, 34);
      break;
    case "drawers2":
      shapes = [rect(4, 3, 24, 15.5), rect(4, 21.5, 24, 15.5)];
      break;
    case "drawers3":
      shapes = [rect(4, 3, 24, 10), rect(4, 15, 24, 10), rect(4, 27, 24, 10)];
      break;
    case "combo":
      shapes = [rect(4, 3, 24, 8), rect(4, 13, 24, 24)];
      break;
    case "doorsTall":
      shapes = [rect(4, 3, 24, 16), rect(4, 21, 24, 16)];
      break;
    case "liftUp":
      shapes = [rect(4, 3, 24, 34), <line key="l" x1={8} y1={9} x2={24} y2={9} stroke={stroke} strokeWidth={1.2} />];
      break;
    case "ovenTower":
      shapes = [rect(4, 3, 24, 34), rect(7, 14, 18, 12)];
      break;
    case "applianceFront":
      // Integrated appliance facade: control strip up top + a handle line.
      shapes = [
        rect(4, 3, 24, 34),
        rect(7, 6, 18, 4),
        <line key="h" x1={9} y1={31} x2={23} y2={31} stroke={stroke} strokeWidth={1.2} />,
      ];
      break;
    case "doors2":
    default:
      shapes = [rect(4, 3, 11, 34), rect(17, 3, 11, 34)];
  }
  return (
    <svg viewBox="0 0 32 40" className="h-9 w-7" aria-hidden>
      {shapes}
    </svg>
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
  const appliances = APPLIANCES_BY_TYPE[unit.type] ?? APPLIANCES[unit.category];
  const frontIds = frontsFor(value.appliance, unit.category);
  const accessories = accessoriesFor(unit);

  // Choosing an appliance constrains the front — snap to a valid one if needed.
  const selectAppliance = (id: string) => {
    const valid = frontsFor(id, unit.category);
    const front = valid.includes(value.front) ? value.front : valid[0];
    onChange({ ...value, appliance: id, front });
  };

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

  return (
    <div className="space-y-5">
      {/* Appliance — the primary choice for most units */}
      <div>
        <SectionLabel>Appliance</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {appliances.map((a) => {
            const active = value.appliance === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => selectAppliance(a.id)}
                className="rounded-full border px-3 py-1.5 text-xs transition"
                style={active ? { backgroundColor: SAGE, borderColor: SAGE, color: "#fff" } : undefined}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Front layout — schematic tiles */}
      <div>
        <SectionLabel>Front</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {frontIds.map((id) => {
            const active = value.front === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ ...value, front: id })}
                className="flex w-[68px] flex-col items-center gap-1 rounded-lg border py-2 transition hover:border-[#647d75]"
                style={active ? { borderColor: SAGE, backgroundColor: "rgba(100,125,117,0.08)" } : undefined}
              >
                <span style={{ color: active ? SAGE : "#6b7280" }}>
                  <FrontIcon id={id} />
                </span>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {FRONT_LABELS[id] ?? id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interior — shelves (door layouts only) */}
      {hasShelves(value.front) && (
        <div>
          <SectionLabel>Interior</SectionLabel>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Shelves</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...value, shelves: Math.max(0, value.shelves - 1) })}
                disabled={value.shelves <= 0}
                aria-label="Fewer shelves"
                className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground transition hover:text-foreground disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-center text-sm font-medium tabular-nums">{value.shelves}</span>
              <button
                type="button"
                onClick={() => onChange({ ...value, shelves: Math.min(MAX_SHELVES, value.shelves + 1) })}
                disabled={value.shelves >= MAX_SHELVES}
                aria-label="More shelves"
                className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground transition hover:text-foreground disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessories — deliberately just the essentials for now */}
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
