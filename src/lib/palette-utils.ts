import type { Palette, Material, RoomCategory, LocalizedString } from "@/types/palette";
import type { Language } from "@/contexts/LanguageContext";
import { palettes } from "@/data/palettes";

// Import all material images using Vite's glob import
const materialImages = import.meta.glob<string>(
  '/src/assets/materials/**/*.jpg',
  { eager: true, import: 'default', query: '?url' }
);

/**
 * Derives the image path for a material based on palette ID and material key
 */
export function getMaterialImagePath(paletteId: string, materialKey: string): string {
  return `/src/assets/materials/${paletteId}/${materialKey}.jpg`;
}

/**
 * Gets the actual URL for a material image (for use in components)
 */
export function getMaterialImageUrl(paletteId: string, materialKey: string): string | null {
  const path = `/src/assets/materials/${paletteId}/${materialKey}.jpg`;
  return materialImages[path] || null;
}

/**
 * Gets materials filtered by room category
 */
export function getMaterialsForRoom(
  palette: Palette,
  roomCategory: RoomCategory
): { key: string; material: Material }[] {
  if (roomCategory === "all") {
    return Object.entries(palette.materials).map(([key, material]) => ({
      key,
      material,
    }));
  }

  return Object.entries(palette.materials)
    .filter(([, material]) => material.rooms.includes(roomCategory))
    .map(([key, material]) => ({ key, material }));
}

/**
 * Gets the material description in the specified language
 * Falls back to English if the requested language is not available
 */
export function getMaterialDescription(
  material: Material,
  language: Language = "en"
): string {
  if (typeof material.description === "string") {
    return material.description; // backwards compatible with plain strings
  }
  return material.description[language] || material.description.en;
}

/**
 * Gets the appropriate purpose label for a material based on room context
 */
export function getMaterialPurpose(material: Material, roomCategory?: RoomCategory): string {
  if (!roomCategory || roomCategory === "all") {
    return material.purpose.default;
  }

  const roomKey = roomCategory as keyof typeof material.purpose;
  return material.purpose[roomKey] || material.purpose.default;
}

/**
 * Maps space category to room category key
 */
export function mapSpaceCategoryToRoom(spaceCategory: string): RoomCategory {
  const mapping: Record<string, RoomCategory> = {
    "Kitchen": "kitchen",
    "Bathroom": "bathroom",
    "Bedroom": "bedroom",
    "Living Room": "livingRoom",
    "Other": "other",
    "Whole Home": "all",
  };
  return mapping[spaceCategory] || "all";
}

/**
 * Builds a detailed material prompt for AI generation based on room-filtered materials
 */
export function buildDetailedMaterialPrompt(
  palette: Palette,
  spaceCategory: string
): string {
  const roomCategory = mapSpaceCategoryToRoom(spaceCategory);
  const materials = getMaterialsForRoom(palette, roomCategory);

  // Filter to only include materials that should be in the prompt
  // (include if true or undefined, exclude only if explicitly false)
  const promptMaterials = materials.filter(
    ({ material }) => material.includeInPrompt !== false
  );

  if (promptMaterials.length === 0) {
    return palette.promptSnippet;
  }

  // Build detailed material descriptions with purpose + description
  // Always use English for AI prompts
  const materialDescriptions = promptMaterials.map(({ material }) => {
    const purpose = getMaterialPurpose(material, roomCategory);
    const description = getMaterialDescription(material, "en") || `${purpose} material`;
    return `- ${purpose}: ${description}`;
  });

  // Combine palette aesthetic with specific material details in bullet format
  return `${palette.promptSnippet}\n\nMaterials specification:\n${materialDescriptions.join('\n')}`;
}

/**
 * Loads material images as base64 for a given palette and room
 */
export async function loadMaterialImagesAsBase64(
  paletteId: string,
  spaceCategory: string,
  palette: Palette
): Promise<string[]> {
  const roomCategory = mapSpaceCategoryToRoom(spaceCategory);
  const materials = getMaterialsForRoom(palette, roomCategory);
  
  const imagePromises = materials.map(async ({ key }) => {
    const imageUrl = getMaterialImageUrl(paletteId, key);
    if (!imageUrl) return null;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  });
  
  const results = await Promise.all(imagePromises);
  return results.filter((img): img is string => img !== null);
}

export interface MaterialImageWithMeta {
  base64: string;
  purpose: string;
  description: string;
}

/**
 * Loads material images as base64 with metadata (purpose, description) for a given palette and room.
 * Used by the material-edit generation path to send texture references to the AI.
 */
export async function loadMaterialImagesWithMeta(
  paletteId: string,
  spaceCategory: string,
  palette: Palette
): Promise<MaterialImageWithMeta[]> {
  const roomCategory = mapSpaceCategoryToRoom(spaceCategory);
  const materials = getMaterialsForRoom(palette, roomCategory);

  // Only include materials that should be in the prompt
  const promptMaterials = materials.filter(
    ({ material }) => material.includeInPrompt !== false
  );

  const imagePromises = promptMaterials.map(async ({ key, material }) => {
    const imageUrl = getMaterialImageUrl(paletteId, key);
    if (!imageUrl) return null;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      return {
        base64,
        purpose: getMaterialPurpose(material, roomCategory),
        description: getMaterialDescription(material, "en"),
      };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(imagePromises);
  return results.filter((img): img is MaterialImageWithMeta => img !== null);
}

/**
 * Gets palettes that have at least one material available at the specified showroom
 */
export function getPalettesForShowroom(showroomId: string): Palette[] {
  return palettes.filter((palette) => {
    // Check if ANY material in this palette has the showroomId
    return Object.values(palette.materials).some(
      (material) => material.showroomIds?.includes(showroomId)
    );
  });
}
