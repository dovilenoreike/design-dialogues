/**
 * Maps material types to provider specialties
 * Used to filter which service providers are relevant for each material
 */
export const materialTypeToSpecialty: Record<string, string> = {
  // Cabinetry panels - installed by carpenters
  LMDP: "Cabinetry",
  MDF: "Cabinetry",
  HPL: "Cabinetry",

  // Flooring - installed by flooring specialists
  Vinyl: "Flooring",
  Laminate: "Flooring",
  "Engineered Wood": "Flooring",

  // Tiles - installed by tile specialists
  "Ceramic Tile": "Tile Installation",
  Tiles: "Tile Installation",

  // Metal accents - typically part of cabinetry/joinery
  Metal: "Cabinetry",
};

/**
 * Get the provider specialty for a given material type
 */
export function getSpecialtyForMaterial(materialType: string | undefined): string | null {
  if (!materialType) return null;
  return materialTypeToSpecialty[materialType] || null;
}
