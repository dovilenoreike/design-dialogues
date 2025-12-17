import type { Palette, Material, RoomCategory } from "@/types/palette";

/**
 * Derives the image path for a material based on palette ID and material key
 */
export function getMaterialImagePath(paletteId: string, materialKey: string): string {
  return `/src/assets/materials/${paletteId}/${materialKey}.jpg`;
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
    "Office": "office",
    "Whole Home": "all",
  };
  return mapping[spaceCategory] || "all";
}
