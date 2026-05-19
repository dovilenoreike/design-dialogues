import type { Archetype } from "./types";
import type { MaterialRole } from "@/types/material-types";

export const archetypes: Archetype[] = [
  // ── Floor (2) ─────────────────────────────────────────────────────────────
  { id: "wood",  role: "floor", label: { en: "Wood",  lt: "Medis" }, value: "#c4a882" },
  { id: "stone", role: "floor", label: { en: "Stone", lt: "Akmuo"   }, value: "#b0a898" },

  // ── Front / Cabinet Fronts (5) ────────────────────────────────────────────
  { id: "wood",          role: "front", label: { en: "Wood",         lt: "Medis"            }, value: "#b89870" },
  { id: "light-neutral", role: "front", label: { en: "Light",        lt: "Šviesūs"            }, value: "#ece8e0" },
  { id: "dark-neutral",  role: "front", label: { en: "Dark",         lt: "Tamsūs"             }, value: "#2a2a2a" },
  { id: "colours",       role: "front", label: { en: "Colours",      lt: "Spalvingi"          }, value: "#9ab4ac" },
  { id: "metallic",      role: "front", label: { en: "Metallic",     lt: "Metališki"          }, value: "#8c7055" },

  // ── Worktop (5) ───────────────────────────────────────────────────────────
  { id: "stone",         role: "worktop", label: { en: "Stone",   lt: "Akmuo"    }, value: "#d8d4cc" },
  { id: "wood",          role: "worktop", label: { en: "Wood",    lt: "Medis"  }, value: "#c4a882" },
  { id: "light-neutral", role: "worktop", label: { en: "Light",   lt: "Šviesūs"  }, value: "#f5f5f3" },
  { id: "dark-neutral",  role: "worktop", label: { en: "Dark",    lt: "Tamsūs"   }, value: "#1a1a1a" },
  { id: "metallic",      role: "worktop", label: { en: "Metal",   lt: "Metalas"  }, value: "#b0b4bc" },

  // ── Accent (5) ────────────────────────────────────────────────────────────
  { id: "gold",   role: "accent", label: { en: "Gold",   lt: "Auksiniai"   }, value: "#c8a84c" },
  { id: "silver", role: "accent", label: { en: "Silver", lt: "Sidabriniai" }, value: "#c0c4cc" },
  { id: "bronze", role: "accent", label: { en: "Bronze", lt: "Bronziniai"   }, value: "#8c7055" },
  { id: "black",  role: "accent", label: { en: "Black",  lt: "Juodi"    }, value: "#1a1a1a" },
  { id: "colour", role: "accent", label: { en: "Colour", lt: "Spalvoti" }, value: "#5c1a1a" },
];

export function getArchetypeById(id: string, role?: MaterialRole): Archetype | undefined {
  return archetypes.find((a) => a.id === id && (!role || a.role === role));
}

export function getArchetypesByRole(role: MaterialRole): Archetype[] {
  return archetypes.filter((a) => a.role === role);
}
