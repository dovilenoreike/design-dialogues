import type { CollectionV2 } from "@/data/collections/types";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { getMaterialByCode, getMaterialsByRole } from "@/hooks/useGraphMaterials";
import type { SurfaceCategory } from "@/types/material-types";
import type { MaterialRole } from "@/types/material-types";
import { surfaces } from "@/data/rooms/surfaces";

/**
 * Returns 4 swatch images (floor, worktops, mainFronts, additionalFronts)
 * for use in collection preview grids.
 */
export function getCollectionSwatches(col: CollectionV2): (string | null)[] {
  const slots = ["floor", "worktops", "mainFronts", "additionalFronts"] as const;
  return slots.map((s) => {
    const code = col.defaults[s];
    return code ? (getMaterialByCode(code)?.imageUrl ?? null) : null;
  });
}

export interface MaterialBubble {
  slotKey: string;
  slotLabel: string;
  materialId: string;
  image: string;
}

/**
 * Maps palette slot keys (used in materialOverrides) to collection category keys.
 */
export const SLOT_TO_COLLECTION_CATEGORY: Record<string, string> = {
  floor: "flooring",
  bottomCabinets: "cabinet-fronts",
  topCabinets: "cabinet-fronts",
  cabinetFurniture: "cabinet-fronts",
  wardrobes: "cabinet-fronts",
  vanityUnit: "cabinet-fronts",
  shelves: "cabinet-fronts",
  worktops: "worktops-and-backsplashes",
  backsplashes: "worktops-and-backsplashes",
  accents: "accents",
  tiles: "tiles",
  additionalTiles: "tiles",
  accentAreas: "tiles",
};

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
  showroomFilter?: { id: string; surfaceCategories: SurfaceCategory[] },
): MaterialBubble[] {
  const bubbles: MaterialBubble[] = [];

  for (const [slotKey, slotDef] of Object.entries(surfaces)) {
    const overrideMaterialId = materialOverrides[slotKey];
    if (!overrideMaterialId) continue;

    const mat = getMaterialByCode(overrideMaterialId);
    if (!mat?.imageUrl) continue;

    if (showroomFilter) {
      const category = SLOT_TO_COLLECTION_CATEGORY[slotKey] as SurfaceCategory | undefined;
      const appliesFilter = category && (showroomFilter.surfaceCategories as string[]).includes(category);
      if (appliesFilter && !mat.showroomIds.includes(showroomFilter.id)) continue;
    }

    bubbles.push({ slotKey, slotLabel: slotDef.label, materialId: overrideMaterialId, image: mat.imageUrl });
  }

  return bubbles;
}

/**
 * Precomputed: for each collection, the set of showroom IDs that appear in its defaults.
 * Lazy-initialized on first call to collectionHasShowroom.
 */
let _collectionShowroomIds: Map<string, Set<string>> | null = null;

function buildCollectionShowroomIds(): Map<string, Set<string>> {
  return new Map(
    collectionsV2.map((col) => {
      const ids = new Set<string>();
      for (const code of Object.values(col.defaults)) {
        if (code) getMaterialByCode(code)?.showroomIds.forEach((s) => ids.add(s));
      }
      return [col.id, ids];
    })
  );
}

export function collectionHasShowroom(colId: string, showroomId: string): boolean {
  if (!_collectionShowroomIds) {
    _collectionShowroomIds = buildCollectionShowroomIds();
  }
  return _collectionShowroomIds.get(colId)?.has(showroomId) ?? false;
}

/**
 * Invalidate the collection showroom cache so it is rebuilt on the next call.
 * Call this after the Supabase graph cache loads.
 */
export function invalidateCollectionShowroomCache(): void {
  _collectionShowroomIds = null;
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
