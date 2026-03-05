/**
 * Bridge module: exports old Palette API shape powered by new PaletteV2 data.
 * Consumers (DesignContext, Stage, SpecsView, etc.) keep working unchanged.
 */
import type { Palette, Material as OldMaterial, RoomCategory } from "@/types/palette";
import type { RoomType } from "@/data/rooms/surfaces";
import { palettesV2 } from "./palettes-v2";
import { getMaterialById } from "@/data/materials";
import { roomSurfaces } from "@/data/rooms/surfaces";
import { getCollectionById } from "@/data/collections";
import { designers } from "@/data/designers";

// RoomType → old RoomCategory key mapping
const roomTypeToCategory: Partial<Record<string, RoomCategory>> = {
  kitchen: "kitchen",
  bathroom: "bathroom",
  bedroom: "bedroom",
  livingRoom: "livingRoom",
};

/**
 * Convert a PaletteV2 into the old Palette shape.
 * Materials are keyed by their material ID (e.g. "baron", "velvet-1648").
 */
function convertToOldPalette(pv2: typeof palettesV2[number]): Palette {
  const materialsRecord: Record<string, OldMaterial> = {};

  // Walk every room → every slot → collect unique materials with room + purpose info
  const materialRooms = new Map<string, Set<string>>();
  const materialPurpose = new Map<string, Record<string, string>>();

  for (const [roomType, slots] of Object.entries(pv2.selections)) {
    if (!slots) continue;
    const surfaceSlots = roomSurfaces[roomType as RoomType];
    if (!surfaceSlots) continue;

    for (const [slotKey, materialId] of Object.entries(slots)) {
      // Track which rooms use this material
      if (!materialRooms.has(materialId)) {
        materialRooms.set(materialId, new Set());
      }
      const category = roomTypeToCategory[roomType];
      if (category) materialRooms.get(materialId)!.add(category);

      // Track purpose per room (slot label)
      if (!materialPurpose.has(materialId)) {
        materialPurpose.set(materialId, {});
      }
      const slotDef = surfaceSlots[slotKey];
      if (slotDef) {
        materialPurpose.get(materialId)![roomType] = slotDef.label;
      }
    }
  }

  // Build old Material objects
  for (const [materialId, rooms] of materialRooms) {
    const newMat = getMaterialById(materialId);
    if (!newMat) continue;

    const purposes = materialPurpose.get(materialId) || {};
    // Pick first purpose as default
    const purposeValues = Object.values(purposes);
    const defaultPurpose = purposeValues[0] || "";

    // Build purpose object: { default, kitchen?, bathroom?, ... }
    const purposeObj: OldMaterial["purpose"] = { default: defaultPurpose };
    for (const [room, label] of Object.entries(purposes)) {
      if (label !== defaultPurpose) {
        (purposeObj as unknown as Record<string, string>)[room] = label;
      }
    }

    materialsRecord[materialId] = {
      description: newMat.description,
      rooms: Array.from(rooms),
      purpose: purposeObj,
      materialType: newMat.type || undefined,
      technicalCode: newMat.code || undefined,
      showroomIds: newMat.showroomIds.length > 0 ? newMat.showroomIds : undefined,
    };
  }

  const designer = designers[pv2.designer];

  return {
    id: pv2.id,
    name: pv2.name,
    designer: pv2.designer,
    designerTitle: designer?.title || "",
    designerProfile: designer,
    promptSnippet: pv2.promptTweak,
    materials: materialsRecord,
    status: pv2.status,
  };
}

export const palettes: Palette[] = palettesV2.map(convertToOldPalette);

const palettesById = new Map(palettes.map((p) => [p.id, p]));

export function getPaletteById(id: string): Palette | undefined {
  return palettesById.get(id);
}

export function getPaletteByName(name: string): Palette | undefined {
  return palettes.find((p) => p.name === name);
}

export function isComingSoon(paletteId: string): boolean {
  const palette = getPaletteById(paletteId);
  return palette?.status === "coming-soon";
}

/**
 * Get material swatch images for a palette (unique, ordered by first appearance).
 */
export function getPaletteMaterialImages(paletteId: string): string[] {
  const pv2 = palettesV2.find((p) => p.id === paletteId);
  if (!pv2) return [];

  const seen = new Set<string>();
  const images: string[] = [];

  for (const slots of Object.values(pv2.selections)) {
    if (!slots) continue;
    for (const materialId of Object.values(slots)) {
      if (seen.has(materialId)) continue;
      seen.add(materialId);
      const mat = getMaterialById(materialId);
      if (mat?.image) images.push(mat.image);
    }
  }

  return images;
}

// Display name → RoomType mapping
const displayNameToRoomType: Record<string, RoomType> = {
  Kitchen: "kitchen",
  Bathroom: "bathroom",
  Bedroom: "bedroom",
  "Living Room": "livingRoom",
};

export interface MaterialBubble {
  slotKey: string;
  slotLabel: string;
  materialId: string;
  image: string;
}

/**
 * Get per-slot material bubbles for a palette + room combination.
 * Returns one bubble per slot (not deduplicated — shows every surface).
 */
export function getRoomMaterialBubbles(
  paletteId: string,
  roomDisplayName: string,
): MaterialBubble[] {
  const roomType = displayNameToRoomType[roomDisplayName];
  if (!roomType) return [];

  const pv2 = palettesV2.find((p) => p.id === paletteId);
  if (!pv2) return [];

  const slots = pv2.selections[roomType];
  if (!slots) return [];

  const slotDefs = roomSurfaces[roomType];
  const bubbles: MaterialBubble[] = [];

  for (const [slotKey, materialId] of Object.entries(slots)) {
    const mat = getMaterialById(materialId);
    const slotDef = slotDefs[slotKey];
    if (!mat?.image || !slotDef) continue;

    bubbles.push({
      slotKey,
      slotLabel: slotDef.label,
      materialId,
      image: mat.image,
    });
  }

  return bubbles;
}

/**
 * Get collection alternatives for a specific slot.
 * Returns all materials from the collection pool that match the slot's surface category.
 */
export function getSlotAlternatives(
  paletteId: string,
  roomDisplayName: string,
  slotKey: string,
): { materialId: string; image: string }[] {
  const roomType = displayNameToRoomType[roomDisplayName];
  if (!roomType) return [];

  const pv2 = palettesV2.find((p) => p.id === paletteId);
  if (!pv2) return [];

  const slotDefs = roomSurfaces[roomType];
  const slotDef = slotDefs[slotKey];
  if (!slotDef) return [];

  const collection = getCollectionById(pv2.collectionId);
  if (!collection) return [];

  const poolMaterials = collection.pool[slotDef.category];
  if (!poolMaterials) return [];

  const results: { materialId: string; image: string }[] = [];
  for (const materialId of poolMaterials) {
    const mat = getMaterialById(materialId);
    if (mat?.image) {
      results.push({ materialId, image: mat.image });
    }
  }

  return results;
}
