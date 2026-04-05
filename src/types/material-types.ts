export type SurfaceCategory =
  | "tiles"
  | "flooring"
  | "walls"
  | "accents"
  | "worktops-and-backsplashes"
  | "cabinet-fronts"
  | "fixtures"
  | "curtains-and-upholstery";

// Canonical role strings used in Supabase materials.role[].
export type MaterialRole = "floor" | "front" | "worktop" | "tile" | "accent";

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

export type TextureType =
  | "wood"
  | "stone"
  | "marble"
  | "concrete"
  | "painted"
  | "metal"
  | "ceramic";

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
