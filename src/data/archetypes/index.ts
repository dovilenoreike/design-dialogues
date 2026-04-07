import type { Archetype } from "./types";
import type { MaterialRole } from "@/types/material-types";

// --- Flooring images ---
import floorLightWood from "@/assets/archetypes/flooring/02-light_wood.jpg";
import floorMediumWood from "@/assets/archetypes/flooring/03-medium_wood.jpg";
import floorDarkWood from "@/assets/archetypes/flooring/04-dark_wood.jpg";
import floorConcrete from "@/assets/archetypes/flooring/05-concete.jpg";

// --- Cabinet Fronts images ---
import cfLightWood from "@/assets/archetypes/cabinet-fronts/02-light_wood.jpg";
import cfMediumWood from "@/assets/archetypes/cabinet-fronts/03-medium_wood.jpg";
import cfDarkWood from "@/assets/archetypes/cabinet-fronts/04-dark_wood.jpg";
import cfNeutral from "@/assets/archetypes/cabinet-fronts/06-neutral.jpg";
import cfPastel from "@/assets/archetypes/cabinet-fronts/07-pastel.jpg";
import cfBold from "@/assets/archetypes/cabinet-fronts/08-bold.jpg";
import cfDark from "@/assets/archetypes/cabinet-fronts/09-dark.jpg";
import cfMetallic from "@/assets/archetypes/cabinet-fronts/10-metallic.jpg";

// --- Worktops & Backsplashes images ---
import wtWood from "@/assets/archetypes/worktops-and-backsplashes/01-wood.jpg";
import wtSoftTextureLight from "@/assets/archetypes/worktops-and-backsplashes/02-soft-texture.jpg";
import wtBoldTextureLight from "@/assets/archetypes/worktops-and-backsplashes/03-bold-texture.jpg";

// --- Accents images ---
import accentGold from "@/assets/archetypes/accents/gold.jpg";
import accentChrome from "@/assets/archetypes/accents/chrome.jpg";
import accentWineRed from "@/assets/archetypes/accents/wine_red.jpg";
import accentAgedBronze from "@/assets/archetypes/accents/aged_bronze.jpg";
import accentBlack from "@/assets/archetypes/accents/black.jpg";

// --- Tiles images ---
import tilesBlackMarble from "@/assets/archetypes/tiles/black_marble.jpg";
import tilesLightWarmConcrete from "@/assets/archetypes/tiles/light_warm_concrete.jpg";
import tilesMediumWarmConcrete from "@/assets/archetypes/tiles/medium_warm_concrete.jpg";
import tilesWarmWhiteConcrete from "@/assets/archetypes/tiles/warm_white_concrete.jpg";

export const archetypes: Archetype[] = [
  // ── Floor (4) ─────────────────────────────────────────────────────────────
  { id: "light-wood",  role: "floor", label: { en: "Light Wood",  lt: "Šviesi mediena"   }, image: floorLightWood,  value: "#ddd5c4" },
  { id: "medium-wood", role: "floor", label: { en: "Medium Wood", lt: "Vidutinė mediena" }, image: floorMediumWood, value: "#b89870" },
  { id: "dark-wood",   role: "floor", label: { en: "Dark Wood",   lt: "Tamsi mediena"    }, image: floorDarkWood,   value: "#5c3d2a" },
  { id: "concrete",    role: "floor", label: { en: "Concrete",    lt: "Betonas"          }, image: floorConcrete,   value: "#c8c4bc" },

  // ── Front / Cabinet Fronts (8) ────────────────────────────────────────────
  { id: "light-wood",  role: "front", label: { en: "Light Wood",  lt: "Šviesi mediena"   }, image: cfLightWood,  value: "#ddd0b8" },
  { id: "medium-wood", role: "front", label: { en: "Medium Wood", lt: "Vidutinė mediena" }, image: cfMediumWood, value: "#b89870" },
  { id: "dark-wood",   role: "front", label: { en: "Dark Wood",   lt: "Tamsi mediena"    }, image: cfDarkWood,   value: "#5c3d2a" },
  { id: "neutral",     role: "front", label: { en: "Neutral",     lt: "Neutrali"         }, image: cfNeutral,    value: "#e0d4c0" },
  { id: "pastel",      role: "front", label: { en: "Pastel",      lt: "Pastelinė"        }, image: cfPastel,     value: "#ccd8d0" },
  { id: "bold",        role: "front", label: { en: "Bold",        lt: "Ryški"            }, image: cfBold,       value: "#4a6058" },
  { id: "dark",        role: "front", label: { en: "Dark",        lt: "Tamsi"            }, image: cfDark,       value: "#2a2a2a" },
  { id: "metallic",    role: "front", label: { en: "Metallic",    lt: "Metališka"        }, image: cfMetallic,   value: "#8c7055" },

  // ── Worktop (5) ───────────────────────────────────────────────────────────
  { id: "wood",               role: "worktop", label: { en: "Wood",              lt: "Mediena"              }, image: wtWood,             value: "#c4a882" },
  { id: "soft-texture-light", role: "worktop", label: { en: "Soft Texture Light", lt: "Švelni faktūra šviesi" }, image: wtSoftTextureLight, value: "#e8e4de" },
  { id: "soft-texture-dark",  role: "worktop", label: { en: "Soft Texture Dark",  lt: "Švelni faktūra tamsi"  }, image: wtSoftTextureLight, value: "#c8c0b4" },
  { id: "bold-texture-light", role: "worktop", label: { en: "Bold Texture Light", lt: "Ryški faktūra šviesi"  }, image: wtBoldTextureLight, value: "#d8cfc0" },
  { id: "bold-texture-dark",  role: "worktop", label: { en: "Bold Texture Dark",  lt: "Ryški faktūra tamsi"   }, image: wtBoldTextureLight, value: "#8c8070" },

  // ── Tile (4) ──────────────────────────────────────────────────────────────
  { id: "black-marble",         role: "tile", label: { en: "Black Marble",         lt: "Juodas marmuras"          }, image: tilesBlackMarble,        value: "#1a1a1a" },
  { id: "light-warm-concrete",  role: "tile", label: { en: "Light Warm Concrete",  lt: "Šviesi šilta betono"      }, image: tilesLightWarmConcrete,  value: "#d8d0c4" },
  { id: "medium-warm-concrete", role: "tile", label: { en: "Medium Warm Concrete", lt: "Vidutinis šiltas betonas" }, image: tilesMediumWarmConcrete, value: "#b8b0a0" },
  { id: "warm-white-concrete",  role: "tile", label: { en: "Warm White Concrete",  lt: "Šiltas baltas betonas"    }, image: tilesWarmWhiteConcrete,  value: "#f0ece8" },

  // ── Accent (5) ────────────────────────────────────────────────────────────
  { id: "gold",        role: "accent", label: { en: "Gold",        lt: "Auksas"          }, image: accentGold,       value: "#c8a84c" },
  { id: "chrome",      role: "accent", label: { en: "Chrome",      lt: "Chromas"         }, image: accentChrome,     value: "#c0c4cc" },
  { id: "wine-red",    role: "accent", label: { en: "Wine Red",    lt: "Vyno raudona"    }, image: accentWineRed,    value: "#5c1a1a" },
  { id: "aged-bronze", role: "accent", label: { en: "Aged Bronze", lt: "Sendinta bronza" }, image: accentAgedBronze, value: "#8c7055" },
  { id: "black",       role: "accent", label: { en: "Black",       lt: "Juoda"           }, image: accentBlack,      value: "#1a1a1a" },
];

export function getArchetypeById(id: string, role?: MaterialRole): Archetype | undefined {
  return archetypes.find((a) => a.id === id && (!role || a.role === role));
}

export function getArchetypesByRole(role: MaterialRole): Archetype[] {
  return archetypes.filter((a) => a.role === role);
}
