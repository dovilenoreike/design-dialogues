import type { CollectionV2 } from "@/data/collections/types";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { getMaterialById } from "@/data/materials";
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
 */
export function getCollectionMaterialBubbles(
  collection: CollectionV2,
  roomDisplayName: string,
  materialOverrides: Record<string, string>,
): MaterialBubble[] {
  const roomType = ROOM_DISPLAY_TO_TYPE[roomDisplayName] as RoomType;
  if (!roomType) return [];

  const slotDefs = roomSurfaces[roomType];
  const bubbles: MaterialBubble[] = [];

  for (const [slotKey, slotDef] of Object.entries(slotDefs)) {
    // Primary: use materialOverrides (material IDs)
    const overrideMaterialId = materialOverrides[slotKey];
    if (overrideMaterialId) {
      const mat = getMaterialById(overrideMaterialId);
      if (mat?.image) {
        bubbles.push({ slotKey, slotLabel: slotDef.label, materialId: overrideMaterialId, image: mat.image });
        continue;
      }
    }

    // Fallback: collection default products
    const category = SLOT_TO_COLLECTION_CATEGORY[slotKey];
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
 * Get collection alternatives for a specific slot.
 * Returns all materials from the collection pool that match the slot's surface category.
 */
export function getSlotAlternatives(
  collectionId: string,
  roomDisplayName: string,
  slotKey: string,
): { materialId: string; image: string }[] {
  const roomType = ROOM_DISPLAY_TO_TYPE[roomDisplayName] as RoomType;
  if (!roomType) return [];

  const collection = collectionsV2.find((c) => c.id === collectionId);
  if (!collection) return [];

  const slotDefs = roomSurfaces[roomType];
  if (!slotDefs[slotKey]) return [];

  const category = SLOT_TO_COLLECTION_CATEGORY[slotKey];
  if (!category) return [];

  const productsByArchetype = collection.products[category];
  if (!productsByArchetype) return [];

  const materialIds = Object.values(productsByArchetype).flat();
  const results: { materialId: string; image: string }[] = [];

  for (const materialId of materialIds) {
    const mat = getMaterialById(materialId);
    if (mat?.image) {
      results.push({ materialId, image: mat.image });
    }
  }

  return results;
}
