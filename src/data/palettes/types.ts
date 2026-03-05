import type { RoomType } from "@/data/rooms/surfaces";

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
