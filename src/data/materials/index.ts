import type { Material } from "./types";
import { flooringMaterials } from "./flooring";
import { cabinetFrontsMaterials } from "./cabinet-fronts";
import { worktopsMaterials } from "./worktops";
import { tilesMaterials } from "./tiles";
import { accentsMaterials } from "./accents";

export type { Material };

export const materials: Material[] = [
  ...flooringMaterials,
  ...cabinetFrontsMaterials,
  ...worktopsMaterials,
  ...tilesMaterials,
  ...accentsMaterials,
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

const materialsById = new Map(materials.map((m) => [m.id, m]));

export function getMaterialById(id: string): Material | undefined {
  return materialsById.get(id);
}

export function getMaterialsByCategory(
  category: Material["categories"][number],
): Material[] {
  return materials.filter((m) => m.categories.includes(category));
}
