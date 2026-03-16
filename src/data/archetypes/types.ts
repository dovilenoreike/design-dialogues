import type { LocalizedString, SurfaceCategory } from "@/data/materials/types";

export interface Archetype {
  id: string;
  category: SurfaceCategory;
  label: LocalizedString;
  image: string | null;
  value: string; // CSS color fallback
}
