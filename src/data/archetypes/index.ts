import type { Archetype } from "./types";
import type { MaterialRole } from "@/types/material-types";

export const archetypes: Archetype[] = [
  // ── Floor (5) ─────────────────────────────────────────────────────────────
  { id: "light-wood",  role: "floor", label: { en: "Light Wood",   lt: "Šviesaus medžio"   }, value: "#ddd5c4" },
  { id: "medium-wood", role: "floor", label: { en: "Medium Wood",  lt: "Vidutinio medžio" }, value: "#b89870" },
  { id: "dark-wood",   role: "floor", label: { en: "Dark Wood",    lt: "Tamsaus medžio"    }, value: "#5c3d2a" },
  { id: "light-stone", role: "floor", label: { en: "Light Stone",  lt: "Šviesaus akmuo"   }, value: "#d8d4cc" },
  { id: "dark-stone",  role: "floor", label: { en: "Dark Stone",   lt: "Tamsaus akmuo"    }, value: "#6a6560" },
  { id: "bold-stone",  role: "floor", label: { en: "Bold Stone",   lt: "Išraiškingas akmuo" }, value: "#b0a898" },

  // ── Front / Cabinet Fronts (9) ────────────────────────────────────────────
  { id: "white",       role: "front", label: { en: "White",        lt: "Balti"           }, value: "#f5f5f3" },
  { id: "light-wood",  role: "front", label: { en: "Light Wood",   lt: "Šviesaus medžio"   }, value: "#ddd0b8" },
  { id: "medium-wood", role: "front", label: { en: "Medium Wood",  lt: "Vidutinio medžio" }, value: "#b89870" },
  { id: "dark-wood",   role: "front", label: { en: "Dark Wood",    lt: "Tamsaus medžio"    }, value: "#5c3d2a" },
  { id: "neutral",     role: "front", label: { en: "Neutral",      lt: "Neutralūs"        }, value: "#e0d4c0" },
  { id: "pastel",      role: "front", label: { en: "Pastel",       lt: "Pasteliniai"       }, value: "#ccd8d0" },
  { id: "bold",        role: "front", label: { en: "Bold",         lt: "Ryškūs"           }, value: "#4a6058" },
  { id: "dark",        role: "front", label: { en: "Dark",         lt: "Tamsūs"           }, value: "#2a2a2a" },
  { id: "metallic",    role: "front", label: { en: "Metallic",     lt: "Metališki"       }, value: "#8c7055" },

  // ── Worktop (7) ───────────────────────────────────────────────────────────
  { id: "wood",               role: "worktop", label: { en: "Wood",               lt: "Medžio"              }, value: "#c4a882" },
  { id: "white",              role: "worktop", label: { en: "White",              lt: "Balti"                }, value: "#f5f5f3" },
  { id: "dark",               role: "worktop", label: { en: "Dark",               lt: "Tamsūs"                }, value: "#1a1a1a" },
  { id: "soft-texture-light", role: "worktop", label: { en: "Soft Texture Light", lt: "Ramūs šviesūs"        }, value: "#e8e4de" },
  { id: "soft-texture-dark",  role: "worktop", label: { en: "Soft Texture Dark",  lt: "Ramus tamsūs"         }, value: "#c8c0b4" },
  { id: "bold-texture-light", role: "worktop", label: { en: "Bold Texture Light", lt: "Išraiškingi šviesūs" }, value: "#d8cfc0" },
  { id: "bold-texture-dark",  role: "worktop", label: { en: "Bold Texture Dark",  lt: "Išraiškingas tamsūs"  }, value: "#8c8070" },

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
