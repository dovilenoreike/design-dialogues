import { createContext, useContext } from "react";
import type { UnitCategory } from "@/lib/kitchen-calculator";

/**
 * A unit's front material is *attributed* from the project palette chosen in the
 * MaterialsHeader — base cabinets wear "Fronts I", wall cabinets "Fronts II",
 * tall cabinets "Fronts III"; a run's worktop wears "Worktops". An island has no
 * dedicated slot, so it falls back to the base fronts. A line can override its
 * material (`unit.frontMaterial` / `run.worktopMaterial`); `undefined` inherits.
 *
 * A palette slot holds *either* a catalog material (a technical code in
 * `material-overrides`) *or* a user-defined custom material (name + €/m², held in
 * `customChoices`, keyed by slot). Custom materials are referenced by a synthetic
 * `custom:<slot>` code so a line can carry one just like a catalog code.
 *
 * The context exposes the live overrides + customs + the ordered palette so each
 * row can resolve its default and offer the palette as quick picks, without
 * threading material data through ComponentList → RunSection → CabinetSection.
 */

/** A user-defined material — description + price per m² (calculator-local). */
export interface CustomMaterial {
  name: string;
  price: string;
}

/** One palette slot (Fronts I–III, Worktops) and the surface it drives. */
interface SlotDef {
  slot: string;
  surface: string;
  label: string;
}

const FRONT_SLOTS: SlotDef[] = [
  { slot: "mainFronts", surface: "bottomCabinets", label: "Fronts I" },
  { slot: "additionalFronts", surface: "topCabinets", label: "Fronts II" },
  { slot: "tertiaryFronts", surface: "tallCabinets", label: "Fronts III" },
];
const WORKTOP_SLOT: SlotDef = { slot: "worktops", surface: "worktops", label: "Worktops" };

const CUSTOM_PREFIX = "custom:";
export const customCode = (slot: string): string => `${CUSTOM_PREFIX}${slot}`;
export const isCustomCode = (code?: string): boolean => !!code && code.startsWith(CUSTOM_PREFIX);
export const customSlotOf = (code: string): string => code.slice(CUSTOM_PREFIX.length);

/** A chosen palette material, offered as a quick pick in the per-line picker. */
export interface PaletteEntry {
  /** Stable react key (the slot name). */
  key: string;
  /** "Fronts I" / "Fronts II" / "Fronts III" / "Worktops". */
  label: string;
  /** Catalog technical code, or a synthetic `custom:<slot>` code. */
  code: string;
}

export interface FrontMaterialsValue {
  /** Live `material-overrides`: surfaceKey → catalog code. */
  overrides: Record<string, string>;
  /** Live custom materials: slot → { name, price }. */
  customs: Record<string, CustomMaterial>;
  /** The project's chosen front materials, in Fronts I → III order (deduped). */
  palette: PaletteEntry[];
}

const FrontMaterialsContext = createContext<FrontMaterialsValue>({
  overrides: {},
  customs: {},
  palette: [],
});

export const FrontMaterialsProvider = FrontMaterialsContext.Provider;

export function useFrontMaterials(): FrontMaterialsValue {
  return useContext(FrontMaterialsContext);
}

/** The code a slot currently holds (catalog code, custom code, or none). A slot
 *  is exclusively one or the other — the header clears the counterpart on pick. */
function slotCode(
  def: SlotDef,
  overrides: Record<string, string>,
  customs: Record<string, CustomMaterial>,
): string | undefined {
  if (overrides[def.surface]) return overrides[def.surface];
  if (customs[def.slot]) return customCode(def.slot);
  return undefined;
}

/** Which front slot supplies a category's default (island matches the base fronts). */
function frontSlotForCategory(category: UnitCategory): SlotDef {
  if (category === "wall") return FRONT_SLOTS[1];
  if (category === "tall") return FRONT_SLOTS[2];
  return FRONT_SLOTS[0]; // base + island → Fronts I
}

/** The code a unit inherits from the palette for its category (if any). */
export function defaultFrontCode(
  category: UnitCategory,
  overrides: Record<string, string>,
  customs: Record<string, CustomMaterial>,
): string | undefined {
  return slotCode(frontSlotForCategory(category), overrides, customs);
}

/** The code a run's worktop inherits from the "Worktops" palette slot (if any). */
export function worktopDefaultCode(
  overrides: Record<string, string>,
  customs: Record<string, CustomMaterial>,
): string | undefined {
  return slotCode(WORKTOP_SLOT, overrides, customs);
}

/** The chosen front materials, deduped by code, as per-unit quick picks. */
export function buildFrontPalette(
  overrides: Record<string, string>,
  customs: Record<string, CustomMaterial>,
): PaletteEntry[] {
  const seen = new Set<string>();
  const out: PaletteEntry[] = [];
  for (const def of FRONT_SLOTS) {
    const code = slotCode(def, overrides, customs);
    if (code && !seen.has(code)) {
      seen.add(code);
      out.push({ key: def.slot, label: def.label, code });
    }
  }
  return out;
}
