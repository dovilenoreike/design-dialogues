import type { SurfaceCategory } from "@/data/materials/types";

export type SurfaceSlot = {
  label: string;
  category: SurfaceCategory;
};

export const surfaces: Record<string, SurfaceSlot> = {
  floor:          { label: "Floor",                   category: "flooring" },
  bottomCabinets: { label: "Bottom Cabinets",         category: "cabinet-fronts" },
  topCabinets:    { label: "Top Cabinets",            category: "cabinet-fronts" },

  shelves:        { label: "Shelves",                 category: "cabinet-fronts" },
  worktops:       { label: "Worktops & Backsplashes", category: "worktops-and-backsplashes" },
  walls:          { label: "Wall",                    category: "walls" },
  accents:        { label: "Faucets",                 category: "accents" },
};
