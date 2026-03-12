import type { SurfaceCategory } from "@/data/materials/types";

// ArchetypeId: string ID of a MaterialArchetype.
// Collection.pool maps surface categories to archetype IDs (not material IDs).
export type ArchetypeId = string;

export interface Collection {
  id: string;
  name: string;
  promptBase: string;
  pool: Partial<Record<SurfaceCategory, ArchetypeId[]>>;
  thumbnail: string;
}

export interface CollectionV2 {
  id: string;
  name: string;
  promptBase: string;
  // Archetypes available in this collection, grouped by surface category
  pool: Partial<Record<SurfaceCategory, ArchetypeId[]>>;
  // Archetype → ordered product material IDs.
  // First entry is the default product; subsequent entries are alternatives
  // (may vary by tier: budget/optimal/premium, or type: Vinyl/Laminate/Engineered Wood).
  products: Record<ArchetypeId, string[]>;
  thumbnail: string;
}
