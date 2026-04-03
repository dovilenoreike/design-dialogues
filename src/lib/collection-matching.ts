import type { CollectionV2, VibeTag } from "@/data/collections/types";
import type { SurfaceCategory } from "@/data/materials/types";
import type { ShowroomBrand } from "@/data/sourcing/types";
import { collectionsV2 } from "@/data/collections/collections-v2";
import { getMaterialById } from "@/data/materials";

export interface SlotPick {
  category: SurfaceCategory;
  archetypeId: string;
}

/**
 * Finds the first collection that matches all picked archetypes in their correct categories.
 * Collection array order determines priority — first match wins.
 */
export function matchCollection(
  collections: CollectionV2[],
  picks: SlotPick[],
  vibeTag: VibeTag | null,
): CollectionV2 | null {
  if (picks.length < 1) return null;

  return (
    collections.find((col) => {
      if (vibeTag && col.vibe !== vibeTag) return false;
      return picks.every(({ category, archetypeId }) =>
        col.pool[category]?.includes(archetypeId) ?? false
      );
    }) ?? null
  );
}

/**
 * Scored partial match — returns the collection that contains the most of the current picks.
 * Used for the ✨ suggestion chip; does not require all picks to match.
 */
export function findBestMatchCollection(
  collections: CollectionV2[],
  picks: SlotPick[],
  vibeTag: VibeTag | null,
): CollectionV2 | null {
  if (picks.length === 0) return null;

  let best: CollectionV2 | null = null;
  let bestScore = 0;

  for (const col of collections) {
    if (vibeTag && col.vibe !== vibeTag) continue;
    const score = picks.filter(({ category, archetypeId }) =>
      col.pool[category]?.includes(archetypeId) ?? false
    ).length;
    if (score > bestScore) {
      bestScore = score;
      best = col;
    }
  }
  return bestScore > 0 ? best : null;
}

/**
 * Resolves an archetype ID to a material ID within a single collection,
 * applying showroom preference then falling back to the first available product.
 * Returns null if the archetype has no products in this collection.
 */
export function resolveProductFromCollection(
  col: CollectionV2,
  archetypeId: string,
  category: SurfaceCategory,
  showroom?: ShowroomBrand | null,
): string | null {
  const products = col.products[category]?.[archetypeId] ?? [];
  if (showroom) {
    return products.find((id) => getMaterialById(id)?.showroomIds?.includes(showroom.id)) ?? products[0] ?? null;
  }
  return products[0] ?? null;
}

/**
 * Resolves an archetype ID to a material ID for a given category.
 * Searches all collections and returns the first product found.
 */
export function resolveArchetypeToMaterial(
  archetypeId: string,
  category: SurfaceCategory,
): string | null {
  for (const col of collectionsV2) {
    const matId = col.products[category]?.[archetypeId]?.[0];
    if (matId) return matId;
  }
  return null;
}
