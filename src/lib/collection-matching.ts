import type { CollectionV2, VibeTag } from "@/data/collections/types";
import type { SurfaceCategory } from "@/data/materials/types";

export interface SlotPick {
  category: SurfaceCategory;
  archetypeId: string;
}

/**
 * Finds the first collection that matches all picked archetypes in their correct categories.
 * Returns null until at least 2 archetypes have been picked.
 * Collection array order determines priority — first match wins.
 */
export function matchCollection(
  collections: CollectionV2[],
  picks: SlotPick[],
  vibeTag: VibeTag | null,
): CollectionV2 | null {
  if (picks.length < 2) return null;

  return (
    collections.find((col) => {
      if (vibeTag && col.vibe !== vibeTag) return false;
      return picks.every(({ category, archetypeId }) =>
        col.pool[category]?.includes(archetypeId) ?? false
      );
    }) ?? null
  );
}
