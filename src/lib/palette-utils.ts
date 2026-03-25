/**
 * Palette utilities — now powered by the new material system.
 * Material images come from Material.image (no more path construction).
 */
import type { Palette, Material, RoomCategory } from "@/types/palette";
import type { Language } from "@/contexts/LanguageContext";
import type { RoomType } from "@/data/rooms/surfaces";
import { getMaterialById } from "@/data/materials";
import { roomSurfaces } from "@/data/rooms/surfaces";
import { ROOM_DISPLAY_TO_TYPE } from "@/lib/design-constants";

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

export interface MaterialImageWithMeta {
  base64: string;
  purpose: string;
  description: string;
}

/**
 * Build detailed material prompt from materialOverrides (source of truth).
 * paletteId param is kept for call-site compatibility but no longer used.
 */
export function buildDetailedMaterialPromptWithOverrides(
  _paletteId: string,
  spaceCategory: string,
  overrides: Record<string, string>,
  palettePromptSnippet: string,
  excludedSlots?: Set<string>,
): string {
  const roomType = ROOM_DISPLAY_TO_TYPE[spaceCategory] as RoomType;
  if (!roomType) return palettePromptSnippet;

  const slotDefs = roomSurfaces[roomType];

  // Group slots by material ID — only slots relevant to this room
  const matGroups = new Map<string, string[]>();
  const matOrder: string[] = [];

  for (const [slotKey, matId] of Object.entries(overrides)) {
    if (excludedSlots?.has(slotKey)) continue;
    const slotDef = slotDefs[slotKey];
    if (!slotDef) continue; // skip slots not in this room

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
 * Load material images with metadata from materialOverrides (source of truth).
 * paletteId param is kept for call-site compatibility but no longer used.
 */
export async function loadMaterialImagesWithOverrides(
  _paletteId: string,
  spaceCategory: string,
  overrides: Record<string, string>,
  excludedSlots?: Set<string>,
): Promise<MaterialImageWithMeta[]> {
  const roomType = ROOM_DISPLAY_TO_TYPE[spaceCategory] as RoomType;
  if (!roomType) return [];

  const slotDefs = roomSurfaces[roomType];

  // One entry per slot — only slots relevant to this room
  const items: { matId: string; purpose: string }[] = [];

  for (const [slotKey, matId] of Object.entries(overrides)) {
    if (excludedSlots?.has(slotKey)) continue;
    const slotDef = slotDefs[slotKey];
    if (!slotDef) continue; // skip slots not in this room

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

