import type { SurfaceCategory } from "@/data/materials/types";

// ArchetypeId: string ID of an Archetype.
// Collection.pool maps surface categories to archetype IDs (not material IDs).
export type ArchetypeId = string;

// Layer 1: Vibe Tag — captures mood, narrows the active collection pool.
export type VibeTag = "light-and-airy" | "warm-and-grounded" | "bold-and-moody";

export interface Collection {
  id: string;
  name: string;
  promptBase: string;
  pool: Partial<Record<SurfaceCategory, ArchetypeId[]>>;
}

export interface CollectionV2 {
  id: string;
  name: { en: string; lt: string };
  designer: string;
  vibe: VibeTag;
  promptBase: string;
  // Archetypes available in this collection, grouped by surface category
  pool: Partial<Record<SurfaceCategory, ArchetypeId[]>>;
  // Category → archetype ID → ordered product material IDs.
  // First entry is the default product; subsequent entries are alternatives
  // (may vary by tier: budget/optimal/premium, or type: Vinyl/Laminate/Engineered Wood).
  products: Partial<Record<SurfaceCategory, Record<string, string[]>>>;
}
