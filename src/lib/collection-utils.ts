import { getMaterialByCode, getMaterialsByRole } from "@/hooks/useGraphMaterials";
import type { MaterialRole } from "@/types/material-types";
import { surfaces } from "@/data/rooms/surfaces";

export interface MaterialBubble {
  slotKey: string;
  slotLabel: string;
  materialId: string;
  image: string;
}


/**
 * Direct map from palette slot key → material role.
 */
export const SLOT_TO_ROLE: Record<string, MaterialRole> = {
  floor: "floor",
  bottomCabinets: "front",
  topCabinets: "front",
  cabinetFurniture: "front",
  wardrobes: "front",
  vanityUnit: "front",
  shelves: "front",
  tallCabinets: "front",
  worktops: "worktop",
  backsplashes: "worktop",
  accents: "accent",
  tiles: "tile",
  additionalTiles: "tile",
  accentAreas: "tile",
};

/**
 * Builds MaterialBubble[] for the Stage bubble rail from materialOverrides only.
 * When showroomFilter is provided, slots outside the showroom's surfaceCategories
 * are skipped.
 */
export function getCollectionMaterialBubbles(
  materialOverrides: Record<string, string>,
  showroomFilter?: { id: string; surfaceCategories: MaterialRole[] },
): MaterialBubble[] {
  const bubbles: MaterialBubble[] = [];

  for (const [slotKey, slotDef] of Object.entries(surfaces)) {
    const overrideMaterialId = materialOverrides[slotKey];
    if (!overrideMaterialId) continue;

    const mat = getMaterialByCode(overrideMaterialId);
    if (!mat?.imageUrl) continue;

    if (showroomFilter) {
      const role = SLOT_TO_ROLE[slotKey] as MaterialRole | undefined;
      const appliesFilter = role && showroomFilter.surfaceCategories.includes(role);
      if (appliesFilter && !mat.showroomIds.includes(showroomFilter.id)) continue;
    }

    bubbles.push({ slotKey, slotLabel: slotDef.label, materialId: overrideMaterialId, image: mat.imageUrl });
  }

  return bubbles;
}

/**
 * Get showroom-compatible materials for a specific slot role.
 * Used as a fallback when the active showroom filter is applied.
 */
export function getShowroomMaterialsForRole(
  role: MaterialRole,
  showroomId: string,
): { materialId: string; image: string }[] {
  return getMaterialsByRole(role)
    .filter((m) => m.imageUrl && m.showroomIds.includes(showroomId))
    .map((m) => ({ materialId: m.technicalCode, image: m.imageUrl! }));
}
