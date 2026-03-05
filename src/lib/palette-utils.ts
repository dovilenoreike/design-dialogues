/**
 * Palette utilities — now powered by the new material system.
 * Material images come from Material.image (no more path construction).
 */
import type { Palette, Material, RoomCategory, LocalizedString } from "@/types/palette";
import type { Language } from "@/contexts/LanguageContext";
import type { RoomType } from "@/data/rooms/surfaces";
import { palettes } from "@/data/palettes";
import { getMaterialById } from "@/data/materials";
import { palettesV2 } from "@/data/palettes/palettes-v2";
import { roomSurfaces } from "@/data/rooms/surfaces";

/**
 * Gets the image URL for a material by its ID.
 * In the new system, material keys in Palette.materials ARE material IDs.
 */
export function getMaterialImageUrl(_paletteId: string, materialKey: string): string | null {
  const mat = getMaterialById(materialKey);
  return mat?.image || null;
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
    return material.description;
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

  const promptMaterials = materials.filter(
    ({ material }) => material.includeInPrompt !== false
  );

  if (promptMaterials.length === 0) {
    return palette.promptSnippet;
  }

  const materialDescriptions = promptMaterials.map(({ material }) => {
    const purpose = getMaterialPurpose(material, roomCategory);
    const description = getMaterialDescription(material, "en") || `${purpose} material`;
    return `- ${purpose}: ${description}`;
  });

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
 * Loads material images as base64 with metadata for AI generation.
 */
export async function loadMaterialImagesWithMeta(
  paletteId: string,
  spaceCategory: string,
  palette: Palette
): Promise<MaterialImageWithMeta[]> {
  const roomCategory = mapSpaceCategoryToRoom(spaceCategory);
  const materials = getMaterialsForRoom(palette, roomCategory);

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

// Display name → RoomType mapping (matches palettes/index.ts)
const displayNameToRoomType: Record<string, RoomType> = {
  Kitchen: "kitchen",
  Bathroom: "bathroom",
  Bedroom: "bedroom",
  "Living Room": "livingRoom",
};

/**
 * Build detailed material prompt from v2 selections with overrides applied.
 */
export function buildDetailedMaterialPromptWithOverrides(
  paletteId: string,
  spaceCategory: string,
  overrides: Record<string, string>,
  palettePromptSnippet: string,
  excludedSlots?: Set<string>,
): string {
  const roomType = displayNameToRoomType[spaceCategory];
  if (!roomType) return palettePromptSnippet;

  const pv2 = palettesV2.find((p) => p.id === paletteId);
  if (!pv2) return palettePromptSnippet;

  const slots = pv2.selections[roomType];
  if (!slots) return palettePromptSnippet;

  const slotDefs = roomSurfaces[roomType];

  // Group slots by resolved material ID so shared materials list all their surfaces
  const matGroups = new Map<string, string[]>();
  const matOrder: string[] = [];

  for (const [slotKey, defaultMatId] of Object.entries(slots)) {
    if (excludedSlots?.has(slotKey)) continue;
    const matId = overrides[slotKey] || defaultMatId;
    const slotDef = slotDefs[slotKey];
    if (!slotDef) continue;

    const existing = matGroups.get(matId);
    if (existing) {
      existing.push(slotDef.label);
    } else {
      matGroups.set(matId, [slotDef.label]);
      matOrder.push(matId);
    }
  }

  const descriptions: string[] = [];
  for (const matId of matOrder) {
    const mat = getMaterialById(matId);
    if (!mat) continue;

    const labels = matGroups.get(matId)!;
    const desc = typeof mat.description === "object"
      ? (mat.description as Record<string, string>).en || ""
      : String(mat.description || "");
    descriptions.push(`- ${labels.join(", ")}: ${desc || matId}`);
  }

  if (descriptions.length === 0) return palettePromptSnippet;
  return `${palettePromptSnippet}\n\nMaterials specification:\n${descriptions.join("\n")}`;
}

/**
 * Load material images with metadata from v2 selections with overrides applied.
 */
export async function loadMaterialImagesWithOverrides(
  paletteId: string,
  spaceCategory: string,
  overrides: Record<string, string>,
  excludedSlots?: Set<string>,
): Promise<MaterialImageWithMeta[]> {
  const roomType = displayNameToRoomType[spaceCategory];
  if (!roomType) return [];

  const pv2 = palettesV2.find((p) => p.id === paletteId);
  if (!pv2) return [];

  const slots = pv2.selections[roomType];
  if (!slots) return [];

  const slotDefs = roomSurfaces[roomType];

  // One entry per slot — no deduplication so the AI gets a clear per-surface instruction
  const items: { matId: string; purpose: string }[] = [];

  for (const [slotKey, defaultMatId] of Object.entries(slots)) {
    if (excludedSlots?.has(slotKey)) continue;
    const matId = overrides[slotKey] || defaultMatId;
    const slotDef = slotDefs[slotKey];
    if (!slotDef) continue;

    items.push({ matId, purpose: slotDef.label });
  }

  const promises = items.map(async ({ matId, purpose }) => {
    const mat = getMaterialById(matId);
    if (!mat?.image) return null;

    try {
      const response = await fetch(mat.image);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const desc = typeof mat.description === "object"
        ? (mat.description as Record<string, string>).en || ""
        : String(mat.description || "");

      return { base64, purpose, description: desc };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is MaterialImageWithMeta => r !== null);
}

/**
 * Gets palettes that have at least one material available at the specified showroom
 */
export function getPalettesForShowroom(showroomId: string): Palette[] {
  return palettes.filter((palette) => {
    return Object.values(palette.materials).some(
      (material) => material.showroomIds?.includes(showroomId)
    );
  });
}
