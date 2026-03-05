import type { SurfaceCategory } from "@/data/materials/types";

export type RoomType = "kitchen" | "livingRoom" | "bedroom" | "bathroom";

export type SurfaceSlot = {
  label: string;
  category: SurfaceCategory;
};

export type RoomSurfaceMap = Record<string, SurfaceSlot>;

export const roomSurfaces: Record<RoomType, RoomSurfaceMap> = {
  kitchen: {
    floor: { label: "Floor", category: "flooring" },
    bottomCabinets: { label: "Bottom Cabinets", category: "cabinet-fronts" },
    topCabinets: { label: "Top Cabinets", category: "cabinet-fronts" },
    shelves: { label: "Shelves", category: "cabinet-fronts" },
    worktops: { label: "Worktops & Backsplashes", category: "worktops-and-backsplashes" },
    wall: { label: "Wall", category: "paint" },
  },
  bathroom: {
    floor: { label: "Floor", category: "tiles" },
    wall: { label: "Wall", category: "tiles" },
    accentAreas: { label: "Accent Areas", category: "tiles" },
    vanityUnit: { label: "Vanity Unit", category: "cabinet-fronts" },
    shelves: { label: "Shelves", category: "cabinet-fronts" },
  },
  livingRoom: {
    floor: { label: "Floor", category: "flooring" },
    wall: { label: "Wall", category: "paint" },
    cabinetFurniture: {
      label: "Cabinet Furniture",
      category: "cabinet-fronts",
    },
    shelves: { label: "Shelves", category: "cabinet-fronts" },
  },
  bedroom: {
    floor: { label: "Floor", category: "flooring" },
    wall: { label: "Wall", category: "paint" },
    wardrobes: { label: "Wardrobes", category: "cabinet-fronts" },
    shelves: { label: "Shelves", category: "cabinet-fronts" },
  },
};
