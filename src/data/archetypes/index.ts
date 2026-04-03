import type { Archetype } from "./types";
import type { SurfaceCategory } from "@/data/materials/types";

// --- Flooring images ---
import floorBleachedWood from "@/assets/archetypes/flooring/01-bleached-wood.jpg";
import floorLightWood from "@/assets/archetypes/flooring/02-light_wood.jpg";
import floorMediumWood from "@/assets/archetypes/flooring/03-medium_wood.jpg";
import floorDarkWood from "@/assets/archetypes/flooring/04-dark_wood.jpg";
import floorConcrete from "@/assets/archetypes/flooring/05-concete.jpg";

// --- Cabinet Fronts images ---
import cfBleachedWood from "@/assets/archetypes/cabinet-fronts/01-bleached-wood.jpg";
import cfLightWood from "@/assets/archetypes/cabinet-fronts/02-light_wood.jpg";
import cfMediumWood from "@/assets/archetypes/cabinet-fronts/03-medium_wood.jpg";
import cfDarkWood from "@/assets/archetypes/cabinet-fronts/04-dark_wood.jpg";
import cfWhite from "@/assets/archetypes/cabinet-fronts/05-white.jpg";
import cfNeutral from "@/assets/archetypes/cabinet-fronts/06-neutral.jpg";
import cfPastel from "@/assets/archetypes/cabinet-fronts/07-pastel.jpg";
import cfBold from "@/assets/archetypes/cabinet-fronts/08-bold.jpg";
import cfDark from "@/assets/archetypes/cabinet-fronts/09-dark.jpg";
import cfMetallic from "@/assets/archetypes/cabinet-fronts/10-metallic.jpg";
import cfBlack from "@/assets/archetypes/cabinet-fronts/11-black.jpg";

// --- Worktops & Backsplashes images ---
import wtWood from "@/assets/archetypes/worktops-and-backsplashes/01-wood.jpg";
import wtSoftTextureLight from "@/assets/archetypes/worktops-and-backsplashes/02-soft-texture.jpg";
import wtBoldTextureLight from "@/assets/archetypes/worktops-and-backsplashes/03-bold-texture.jpg";
import wtWhite from "@/assets/archetypes/worktops-and-backsplashes/05-white.jpg";
import wtConcrete from "@/assets/archetypes/worktops-and-backsplashes/06-concrete.jpg";
import wtBlack from "@/assets/archetypes/worktops-and-backsplashes/07-black.jpg";
import wtMetallic from "@/assets/archetypes/worktops-and-backsplashes/08-metallic.jpg";

// --- Tiles images ---
import tilesBlackMarble from "@/assets/archetypes/tiles/black_marble.jpg";
import tilesLightWarmConcrete from "@/assets/archetypes/tiles/light_warm_concrete.jpg";
import tilesMediumWarmConcrete from "@/assets/archetypes/tiles/medium_warm_concrete.jpg";
import tilesWarmWhiteConcrete from "@/assets/archetypes/tiles/warm_white_concrete.jpg";

export const archetypes: Archetype[] = [
  // ── Flooring (5) ──────────────────────────────────────────────────────────
  { id: "bleached-wood",  category: "flooring", label: { en: "Bleached Wood",  lt: "Išbalinta mediena"   }, image: floorBleachedWood, value: "#e8e4dc" },
  { id: "light-wood",     category: "flooring", label: { en: "Light Wood",     lt: "Šviesi mediena"      }, image: floorLightWood,    value: "#ddd5c4" },
  { id: "medium-wood",    category: "flooring", label: { en: "Medium Wood",    lt: "Vidutinė mediena"    }, image: floorMediumWood,   value: "#b89870" },
  { id: "dark-wood",      category: "flooring", label: { en: "Dark Wood",      lt: "Tamsi mediena"       }, image: floorDarkWood,     value: "#5c3d2a" },
  { id: "concrete",       category: "flooring", label: { en: "Concrete",       lt: "Betonas"             }, image: floorConcrete,     value: "#c8c4bc" },

  // ── Cabinet Fronts (11) ───────────────────────────────────────────────────
  { id: "bleached-wood",  category: "cabinet-fronts", label: { en: "Bleached Wood", lt: "Išbalinta mediena"  }, image: cfBleachedWood, value: "#e4e0d8" },
  { id: "light-wood",     category: "cabinet-fronts", label: { en: "Light Wood",    lt: "Šviesi mediena"     }, image: cfLightWood,    value: "#ddd0b8" },
  { id: "medium-wood",    category: "cabinet-fronts", label: { en: "Medium Wood",   lt: "Vidutinė mediena"   }, image: cfMediumWood,   value: "#b89870" },
  { id: "dark-wood",      category: "cabinet-fronts", label: { en: "Dark Wood",     lt: "Tamsi mediena"      }, image: cfDarkWood,     value: "#5c3d2a" },
  { id: "white",          category: "cabinet-fronts", label: { en: "White",         lt: "Balta"              }, image: cfWhite,        value: "#f5f3ef" },
  { id: "neutral",        category: "cabinet-fronts", label: { en: "Neutral",       lt: "Neutrali"           }, image: cfNeutral,      value: "#e0d4c0" },
  { id: "pastel",         category: "cabinet-fronts", label: { en: "Pastel",        lt: "Pastelinė"          }, image: cfPastel,       value: "#ccd8d0" },
  { id: "bold",           category: "cabinet-fronts", label: { en: "Bold",          lt: "Ryški"              }, image: cfBold,         value: "#4a6058" },
  { id: "dark",           category: "cabinet-fronts", label: { en: "Dark",          lt: "Tamsi"              }, image: cfDark,         value: "#2a2a2a" },
  { id: "metallic",       category: "cabinet-fronts", label: { en: "Metallic",      lt: "Metališka"           }, image: cfMetallic,     value: "#8c7055" },
  { id: "black",          category: "cabinet-fronts", label: { en: "Black",         lt: "Juoda"              }, image: cfBlack,        value: "#1a1a1a" },

  // ── Worktops & Backsplashes (9) ───────────────────────────────────────────
  { id: "wood",                category: "worktops-and-backsplashes", label: { en: "Wood",              lt: "Mediena"              }, image: wtWood,             value: "#c4a882" },
  { id: "soft-texture-light",  category: "worktops-and-backsplashes", label: { en: "Soft Texture Light", lt: "Švelni faktūra šviesi" }, image: wtSoftTextureLight, value: "#e8e4de" },
  { id: "soft-texture-dark",   category: "worktops-and-backsplashes", label: { en: "Soft Texture Dark",  lt: "Švelni faktūra tamsi"  }, image: wtSoftTextureLight, value: "#c8c0b4" },
  { id: "bold-texture-light",  category: "worktops-and-backsplashes", label: { en: "Bold Texture Light", lt: "Ryški faktūra šviesi"  }, image: wtBoldTextureLight, value: "#d8cfc0" },
  { id: "bold-texture-dark",   category: "worktops-and-backsplashes", label: { en: "Bold Texture Dark",  lt: "Ryški faktūra tamsi"   }, image: wtBoldTextureLight, value: "#8c8070" },
  { id: "soft-texture-medium", category: "worktops-and-backsplashes", label: { en: "Soft Texture Medium", lt: "Švelni faktūra vidutinė" }, image: wtSoftTextureLight, value: "#d8d0c4" },
  { id: "bold-texture-medium", category: "worktops-and-backsplashes", label: { en: "Bold Texture Medium", lt: "Ryški faktūra vidutinė" }, image: wtBoldTextureLight, value: "#b8a890" },
  { id: "white",               category: "worktops-and-backsplashes", label: { en: "White",              lt: "Balta"                }, image: wtWhite,            value: "#f0ede8" },
  { id: "concrete",            category: "worktops-and-backsplashes", label: { en: "Concrete",           lt: "Betonas"              }, image: wtConcrete,         value: "#c0bbb4" },
  { id: "black",               category: "worktops-and-backsplashes", label: { en: "Black",              lt: "Juoda"                }, image: wtBlack,            value: "#1e1e1e" },
  { id: "metallic",            category: "worktops-and-backsplashes", label: { en: "Metallic",           lt: "Metališka"             }, image: wtMetallic,         value: "#8c7055" },

  // ── Tiles (4) ─────────────────────────────────────────────────────────────
  { id: "black-marble",         category: "tiles", label: { en: "Black Marble",         lt: "Juodas marmuras"        }, image: tilesBlackMarble,        value: "#1a1a1a" },
  { id: "light-warm-concrete",  category: "tiles", label: { en: "Light Warm Concrete",  lt: "Šviesi šilta betono"    }, image: tilesLightWarmConcrete,  value: "#d8d0c4" },
  { id: "medium-warm-concrete", category: "tiles", label: { en: "Medium Warm Concrete", lt: "Vidutinis šiltas betonas" }, image: tilesMediumWarmConcrete, value: "#b8b0a0" },
  { id: "warm-white-concrete",  category: "tiles", label: { en: "Warm White Concrete",  lt: "Šiltas baltas betonas"  }, image: tilesWarmWhiteConcrete,  value: "#f0ece8" },

  // ── Accents (5) ───────────────────────────────────────────────────────────
  { id: "gold",        category: "accents", label: { en: "Gold",        lt: "Auksas"          }, image: null, value: "#c8a84c" },
  { id: "chrome",      category: "accents", label: { en: "Chrome",      lt: "Chromas"         }, image: null, value: "#c0c4cc" },
  { id: "black",       category: "accents", label: { en: "Black",       lt: "Juoda"           }, image: null, value: "#1a1a1a" },
  { id: "wine-red",    category: "accents", label: { en: "Wine Red",    lt: "Vyno raudona"    }, image: null, value: "#5c1a1a" },
  { id: "aged-bronze", category: "accents", label: { en: "Aged Bronze", lt: "Sendinta bronza" }, image: null, value: "#8c7055" },

  // ── Walls (1) ─────────────────────────────────────────────────────────────
  { id: "off-white", category: "walls", label: { en: "Off White", lt: "Kreminis baltas" }, image: null, value: "#f5f0ea" },
];

export function getArchetypeById(id: string, category?: SurfaceCategory): Archetype | undefined {
  return archetypes.find((a) => a.id === id && (!category || a.category === category));
}

export function getArchetypesByCategory(category: SurfaceCategory): Archetype[] {
  return archetypes.filter((a) => a.category === category);
}
