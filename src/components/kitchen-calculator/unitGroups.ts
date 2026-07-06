import { UNIT_CATEGORY, type UnitType } from "@/lib/kitchen-calculator";

export interface TypeGroup {
  /** Section header; null renders the group with no label (single flat list). */
  label: string | null;
  types: UnitType[];
}

/**
 * Split a section's selectable types into groups by **shape**: floor-standing
 * **Base units** vs floor-to-ceiling **Tall units**. This is the one clean,
 * non-overlapping taxonomy — "main appliance" (sink/hob/fridge) is orthogonal
 * and shown instead as a badge on the option (see ESSENTIAL_TYPES), so the
 * fridge correctly lives under Tall units *and* reads as an appliance.
 *
 * Wall- and island-only sections collapse to one unlabelled group so we never
 * show a lone header.
 */
export function buildTypeGroups(typeOptions: UnitType[]): TypeGroup[] {
  const base = typeOptions.filter((t) => UNIT_CATEGORY[t] === "base");
  const tall = typeOptions.filter((t) => UNIT_CATEGORY[t] === "tall");
  const other = typeOptions.filter(
    (t) => UNIT_CATEGORY[t] !== "base" && UNIT_CATEGORY[t] !== "tall",
  );

  const groups: TypeGroup[] = [];
  if (base.length) groups.push({ label: "Base units", types: base });
  if (tall.length) groups.push({ label: "Tall units", types: tall });
  if (other.length) groups.push({ label: null, types: other });

  // A single group needs no header.
  if (groups.length === 1) return [{ label: null, types: groups[0].types }];
  return groups;
}
