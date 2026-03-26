import type { ArchetypeId } from "@/data/collections/types";

export type RoomType = "kitchen" | "livingRoom" | "bedroom" | "bathroom";

// Per-room slot selections: slot key → material ID
export type RoomSelections = Record<string, string>;

export interface PaletteV2 {
  id: string;
  name: string;
  collectionId: string;
  designer: string;
  promptTweak: string;
  // Keyed by RoomType, then by slot key within that room
  selections: Partial<Record<RoomType, RoomSelections>>;
  status: "available" | "coming-soon";
}

// Per-room slot → archetype ID (replaces material ID in old system)
export type ArchetypeRoomSelections = Record<string, ArchetypeId>;

export interface ArchetypePalette {
  id: string;
  name: string;
  collectionId: string;   // references a CollectionV2
  designer: string;
  promptTweak: string;
  selections: Partial<Record<RoomType, ArchetypeRoomSelections>>;
  status: "available" | "coming-soon";
}
