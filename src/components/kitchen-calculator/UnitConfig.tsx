import { Minus, Plus } from "lucide-react";
import {
  APPLIANCE_ITEMS,
  primaryApplianceId,
  type CabinetUnit,
  type ProjectAppliance,
  type UnitCategory,
  type UnitType,
} from "@/lib/kitchen-calculator";
import { ApplianceGlyph } from "./ApplianceGlyph";
import { unitKind } from "./unitKind";

/**
 * Per-unit configuration — VISUAL MOCK ONLY (Phase: experience exploration).
 * Lets a unit deviate from its type's default interior: which appliance it
 * integrates, its front layout, and a couple of key accessories. Nothing here
 * is wired to pricing yet — it exists to feel out the interaction.
 */

export interface UnitConfigState {
  /** The atomic appliances integrated in this unit ([] for none). */
  appliances: ProjectAppliance[];
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

// Front layouts available per unit category (ids resolve via FRONT_LABELS / FrontIcon).
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
  // Hob on the worktop, oven built in below — a drawer over the oven, or a full facade.
  hobOven: ["combo", "applianceFront"],
  oven: ["applianceFront", "ovenTower"],
  ovenMicrowave: ["ovenTower", "applianceFront"],
  dishwasher: ["applianceFront", "door1"],
  microwave: ["applianceFront"],
  // Integrated hood is concealed in a short cabinet; standalone is a visible chimney.
  extractor: ["integrated", "standalone"],
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
  integrated: "Integrated",
  standalone: "Standalone",
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
 * Valid front layouts for a unit: a per-type constraint wins (e.g. corners are
 * door-only), then the appliance's allowed fronts, else the category set.
 */
export function frontsFor(appliance: string, category: UnitCategory, type?: UnitType): string[] {
  if (type && FRONTS_BY_TYPE[type]) return FRONTS_BY_TYPE[type] as string[];
  if (appliance === "none" || !APPLIANCE_FRONTS[appliance]) return CATEGORY_FRONTS[category];
  return APPLIANCE_FRONTS[appliance];
}

// A couple of the most-used accessories, kept intentionally minimal.
function accessoriesFor(unit: CabinetUnit): Option[] {
  // Appliance housings have no internal accessories — the appliance fills them.
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

const DEFAULT_BY_TYPE: Partial<Record<UnitType, Partial<UnitConfigState>>> = {
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
  return {
    appliances: [...unit.appliances],
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
    case "integrated":
      // Hood concealed behind a short lift-up flap at the cabinet base.
      shapes = [
        rect(4, 3, 24, 34),
        <line key="f" x1={4} y1={28} x2={28} y2={28} stroke={stroke} strokeWidth={1.2} />,
        <line key="h" x1={12} y1={32.5} x2={20} y2={32.5} stroke={stroke} strokeWidth={1.2} />,
      ];
      break;
    case "standalone":
      // Visible chimney hood: canopy trapezoid tapering up to a duct.
      shapes = [
        <path
          key="c"
          d="M5 24 L11 12 L21 12 L27 24 Z"
          fill="none"
          stroke={stroke}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />,
        rect(13, 4, 6, 8),
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
  /** Appliances the project declares (the master list). */
  declared?: Set<ProjectAppliance>;
  /** Appliances already placed anywhere — used to offer only what's still free. */
  placed?: Set<ProjectAppliance>;
}

const SAGE = "#647d75";
const OCHRE = "#ca8a04";

export function UnitConfig({ unit, value, onChange, declared, placed }: UnitConfigProps) {
  const frontIds = frontsFor(primaryApplianceId(value.appliances), unit.category, unit.type);
  const accessories = accessoriesFor(unit);

  // Appliance assignment only applies to housings (and islands, which can host a
  // hob). The list offers declared appliances not yet placed elsewhere, plus
  // whatever this unit already holds — so you can't double-place one.
  const showAppliances = unitKind(unit) === "housing" || unit.category === "island";
  const assignable = APPLIANCE_ITEMS.filter(
    (a) =>
      (declared?.has(a.id) ?? true) &&
      (!(placed?.has(a.id) ?? false) || value.appliances.includes(a.id)),
  );

  // Toggling an appliance re-snaps the front to one valid for the new set.
  const toggleAppliance = (id: ProjectAppliance) => {
    const next = value.appliances.includes(id)
      ? value.appliances.filter((a) => a !== id)
      : [...value.appliances, id];
    const valid = frontsFor(primaryApplianceId(next), unit.category, unit.type);
    const front = valid.includes(value.front) ? value.front : valid[0];
    onChange({ ...value, appliances: next, front });
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
      {/* Appliances — atomic, multi-select (a hob/oven cabinet = hob + oven) */}
      {showAppliances && (
        <div>
          <SectionLabel>Appliances</SectionLabel>
          {assignable.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              All declared appliances are already placed. Add more up top to house another.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {assignable.map((a) => {
                const active = value.appliances.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAppliance(a.id)}
                    aria-pressed={active}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition"
                    style={
                      active ? { backgroundColor: SAGE, borderColor: SAGE, color: "#fff" } : undefined
                    }
                  >
                    <ApplianceGlyph id={a.id} size={14} />
                    {a.label}
                  </button>
                );
              })}
            </div>
          )}
          {value.appliances.length === 0 && assignable.length > 0 && (
            <p className="mt-1.5 text-[11px]" style={{ color: OCHRE }}>
              No appliance chosen yet — this housing is empty.
            </p>
          )}
        </div>
      )}

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
