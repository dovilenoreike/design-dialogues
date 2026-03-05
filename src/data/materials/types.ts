export type SurfaceCategory =
  | "tiles"
  | "flooring"
  | "paint"
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
}
