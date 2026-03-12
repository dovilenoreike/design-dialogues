import type { LocalizedString, SurfaceCategory } from "@/data/materials/types";

export interface MaterialArchetype {
  id: string; // e.g. "flooring_light_natural_wood"
  image: string; // imported from src/assets/archetypes/
  displayName: LocalizedString;
  category: SurfaceCategory;
  // Visual classification tags (used in moodboard search/filtering)
  lightness?: "light" | "medium" | "dark";
  temperature?: "cool" | "natural" | "warm";
  substance?: "wood" | "concrete" | "stone" | "tile" | "paint" | "metal" | "fabric";
}
