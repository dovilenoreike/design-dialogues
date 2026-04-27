import type { MaterialRole } from "@/types/material-types";


export type SurfaceSlot = {
  label: string;
  category: MaterialRole;
};

export const surfaces: Record<string, SurfaceSlot> = {
  floor:          { label: "Floor",                   category: "floor" },
  bottomCabinets: { label: "Bottom Cabinets",         category: "front" },
  topCabinets:    { label: "Top Cabinets",            category: "front" },

  shelves:        { label: "Shelves",                 category: "front" },
  tallCabinets:   { label: "Tall Cabinets", category: "front" },
  worktops:       { label: "Worktops & Backsplashes", category: "worktop" },
  accents:        { label: "Faucets",                 category: "accent" },
};
