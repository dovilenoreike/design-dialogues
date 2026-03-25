import type { CollectionV2 } from "@/data/collections/types";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { getMaterialById, getMaterialsByCategory } from "@/data/materials";
import type { SurfaceCategory } from "@/data/materials/types";
import { getArchetypeById } from "@/data/archetypes";
import { roomSurfaces } from "@/data/rooms/surfaces";
import { ROOM_DISPLAY_TO_TYPE } from "@/lib/design-constants";
import type { RoomType } from "@/data/rooms/surfaces";

const SWATCH_SPEC: Array<{ category: SurfaceCategory; count: 1 | 2 }> = [
  { category: "flooring",                  count: 1 },
  { category: "worktops-and-backsplashes", count: 1 },
  { category: "cabinet-fronts",            count: 2 },
];

function resolveSwatchImage(
  archetypeId: string | null | undefined,
  category: SurfaceCategory,
  products: CollectionV2["products"],
): string | null {
  if (!archetypeId) return null;
  const productId = products[category]?.[archetypeId]?.[0];
  if (productId) {
    const mat = getMaterialById(productId);
    if (mat?.image) return mat.image;
  }
  return getArchetypeById(archetypeId, category)?.image ?? null;
}

/**
 * Returns 4 swatch images (flooring×1, worktops×1, cabinet-fronts×2)
 * for use in collection preview grids.
 */
export function getCollectionSwatches(col: CollectionV2): (string | null)[] {
  const images: (string | null)[] = [];
  for (const { category, count } of SWATCH_SPEC) {
    const ids = col.pool[category] ?? [];
    for (let i = 0; i < count; i++) {
      images.push(resolveSwatchImage(ids[i], category, col.products));
    }
  }
  return images;
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
 * Builds MaterialBubble[] for the Stage bubble rail.
 * Uses materialOverrides (material IDs) as primary source,
 * falls back to collection's default products.
 * When showroomFilter is provided, slots in the showroom's surfaceCategories
 * will only show materials belonging to that showroom.
 */
export function getCollectionMaterialBubbles(
  collection: CollectionV2,
  roomDisplayName: string,
  materialOverrides: Record<string, string>,
  showroomFilter?: { id: string; surfaceCategories: SurfaceCategory[] },
): MaterialBubble[] {
  const roomType = ROOM_DISPLAY_TO_TYPE[roomDisplayName] as RoomType;
  if (!roomType) return [];

  const slotDefs = roomSurfaces[roomType];
  const bubbles: MaterialBubble[] = [];

  for (const [slotKey, slotDef] of Object.entries(slotDefs)) {
    const category = SLOT_TO_COLLECTION_CATEGORY[slotKey] as SurfaceCategory | undefined;

    const applyShowroomFilter =
      showroomFilter &&
      category &&
      (showroomFilter.surfaceCategories as string[]).includes(category);

    if (applyShowroomFilter) {
      // 1. Check override — use only if it belongs to the showroom
      const overrideMaterialId = materialOverrides[slotKey];
      if (overrideMaterialId) {
        const mat = getMaterialById(overrideMaterialId);
        if (mat?.image && mat.showroomIds.includes(showroomFilter!.id)) {
          bubbles.push({ slotKey, slotLabel: slotDef.label, materialId: overrideMaterialId, image: mat.image });
          continue;
        }
      }

      // 2. Search collection pool for first showroom-compatible material
      const poolMaterials = Object.values(collection.products[category!] ?? {}).flat();
      const poolMatch = poolMaterials.find(
        (id) => {
          const m = getMaterialById(id);
          return m?.image && m.showroomIds.includes(showroomFilter!.id);
        }
      );
      if (poolMatch) {
        const mat = getMaterialById(poolMatch)!;
        bubbles.push({ slotKey, slotLabel: slotDef.label, materialId: poolMatch, image: mat.image! });
        continue;
      }

      // 3. Search all database materials of this category for a showroom match
      const dbMatch = getMaterialsByCategory(category!).find(
        (m) => m.image && m.showroomIds.includes(showroomFilter!.id)
      );
      if (dbMatch) {
        bubbles.push({ slotKey, slotLabel: slotDef.label, materialId: dbMatch.id, image: dbMatch.image! });
        continue;
      }

      // 4. No showroom material found — skip slot entirely
      continue;
    }

    // Non-showroom slot: original behavior
    const overrideMaterialId = materialOverrides[slotKey];
    if (overrideMaterialId) {
      const mat = getMaterialById(overrideMaterialId);
      if (mat?.image) {
        bubbles.push({ slotKey, slotLabel: slotDef.label, materialId: overrideMaterialId, image: mat.image });
        continue;
      }
    }

    if (!category) continue;

    const archetypeId = collection.pool[category]?.[0];
    if (!archetypeId) continue;

    const materialId = collection.products[category]?.[archetypeId]?.[0];
    if (!materialId) continue;

    const mat = getMaterialById(materialId);
    if (mat?.image) {
      bubbles.push({ slotKey, slotLabel: slotDef.label, materialId, image: mat.image });
    }
  }

  return bubbles;
}

/**
 * Precomputed: for each collection, the set of showroom IDs that carry
 * at least one product in that collection.
 * Single source of truth: derived from material.showroomIds.
 */
const _collectionShowroomIds: Map<string, Set<string>> = new Map(
  collectionsV2.map((col) => {
    const ids = new Set<string>();
    for (const byArchetype of Object.values(col.products)) {
      for (const matIds of Object.values(byArchetype)) {
        for (const matId of matIds) {
          getMaterialById(matId)?.showroomIds.forEach((s) => ids.add(s));
        }
      }
    }
    return [col.id, ids];
  })
);

export function collectionHasShowroom(colId: string, showroomId: string): boolean {
  return _collectionShowroomIds.get(colId)?.has(showroomId) ?? false;
}

/**
 * Get collection alternatives for a specific slot.
 * Returns all materials from the collection pool that match the slot's surface category.
 * If showroomFilter is provided and the slot's category is in the showroom's surfaceCategories,
 * only materials with showroomFilter.id in their showroomIds are returned.
 */
export function getSlotAlternatives(
  collectionId: string,
  roomDisplayName: string,
  slotKey: string,
  showroomFilter?: { id: string; surfaceCategories: SurfaceCategory[] },
): { materialId: string; image: string }[] {
  const roomType = ROOM_DISPLAY_TO_TYPE[roomDisplayName] as RoomType;
  if (!roomType) return [];

  const collection = collectionsV2.find((c) => c.id === collectionId);
  if (!collection) return [];

  const slotDefs = roomSurfaces[roomType];
  if (!slotDefs[slotKey]) return [];

  const category = SLOT_TO_COLLECTION_CATEGORY[slotKey] as SurfaceCategory | undefined;
  if (!category) return [];

  const productsByArchetype = collection.products[category];
  if (!productsByArchetype) return [];

  const materialIds = Object.values(productsByArchetype).flat();
  const results: { materialId: string; image: string }[] = [];

  const applyShowroomFilter =
    showroomFilter &&
    (showroomFilter.surfaceCategories as string[]).includes(category);

  for (const materialId of materialIds) {
    const mat = getMaterialById(materialId);
    if (!mat?.image) continue;
    if (applyShowroomFilter && !mat.showroomIds.includes(showroomFilter!.id)) continue;
    results.push({ materialId, image: mat.image });
  }

  // If showroom filter is active but the collection pool had no showroom materials,
  // fall back to all database materials for that category belonging to the showroom.
  if (applyShowroomFilter && results.length === 0) {
    for (const mat of getMaterialsByCategory(category)) {
      if (mat.image && mat.showroomIds.includes(showroomFilter!.id)) {
        results.push({ materialId: mat.id, image: mat.image });
      }
    }
  }

  return results;
}
