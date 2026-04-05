import type { LocalizedString, MaterialRole } from "@/types/material-types";

export interface Archetype {
  id: string;
  role: MaterialRole;
  label: LocalizedString;
  image: string | null;
  value: string; // CSS color fallback
}
