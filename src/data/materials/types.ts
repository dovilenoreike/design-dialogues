export type SurfaceCategory =
  | "tiles"
  | "flooring"
  | "walls"
  | "accents"
  | "worktops-and-backsplashes"
  | "cabinet-fronts"
  | "fixtures"
  | "curtains-and-upholstery";

export type MaterialTier = "budget" | "optimal" | "premium";

export type MaterialType =
  | "Vinyl"
  | "Laminate"
  | "Engineered Wood"
  | "Tiles"
  | "Compact HPL"
  | "LMDP"
  | "MDF"
  | "Metal";

// The physical substance — drives harmony and visual matching (Layer 2–5)
export type TextureType =
  | "wood"
  | "stone"
  | "marble"
  | "concrete"
  | "painted"
  | "metal"
  | "ceramic";

// Visible grain/texture level
export type TextureLevel =
  | "smooth"
  | "subtle"
  | "medium"
  | "rich"
  | "statement";

export interface LocalizedString {
  en: string;
  lt: string;
}

export interface Material {
  id: string;
  image: string;
  displayName: LocalizedString;
  description: LocalizedString;
  type: MaterialType | "";
  categories: SurfaceCategory[];
  tier: MaterialTier;
  code: string;
  texturePrompt: string;
  showroomIds: string[];
  alternatives: Partial<Record<MaterialTier, string>>;
  // Layer links — populated in Phase 4
  undefinedArchetypeId?: string;
  definedArchetypeId?: string;
}
