import type { MaterialArchetype } from "./types";
import type { SurfaceCategory } from "@/data/materials/types";

// --- Cabinet Fronts images ---
import cabinetFrontsLightNaturalWood from "@/assets/archetypes/cabinet-fronts/light_natural_wood.jpg";
import cabinetFrontsLightCoolWood from "@/assets/archetypes/cabinet-fronts/light_cool_wood.jpg";
import cabinetFrontsLightWarmWood from "@/assets/archetypes/cabinet-fronts/light_warm_wood.jpg";
import cabinetFrontsLightWarmGrey from "@/assets/archetypes/cabinet-fronts/light_warm_grey.jpg";
import cabinetFrontsMediumNaturalWood from "@/assets/archetypes/cabinet-fronts/medium_natural_wood.jpg";
import cabinetFrontsMediumCoolWood from "@/assets/archetypes/cabinet-fronts/medium_cool_wood.jpg";
import cabinetFrontsMediumWarmWood from "@/assets/archetypes/cabinet-fronts/medium_warm_wood.jpg";
import cabinetFrontsDarkNaturalWood from "@/assets/archetypes/cabinet-fronts/dark_natural_wood.jpg";
import cabinetFrontsDarkCoolWood from "@/assets/archetypes/cabinet-fronts/dark_cool_wood.jpg";
import cabinetFrontsDarkWarmWood from "@/assets/archetypes/cabinet-fronts/dark_warm_wood.jpg";

import cabinetFrontsBlack from "@/assets/archetypes/cabinet-fronts/black.jpg";
import cabinetFrontsAgedBronze from "@/assets/archetypes/cabinet-fronts/aged_bronze.jpg";
import cabinetFrontsWarmWhite from "@/assets/archetypes/cabinet-fronts/warm_white.jpg";
import cabinetFrontsBlackWoodRich from "@/assets/archetypes/cabinet-fronts/black_wood_rich.jpg";
import cabinetFrontsPastelGreen from "@/assets/archetypes/cabinet-fronts/pastel_green.jpg";
import cabinetFrontsGreyBlue from "@/assets/archetypes/cabinet-fronts/grey_blue.jpg";
import cabinetFrontsPastelBlue from "@/assets/archetypes/cabinet-fronts/pastel_blue.jpg";
import cabinetFrontsWhiteGreyWood from "@/assets/archetypes/cabinet-fronts/white_grey_wood.jpg";
import cabinetFrontsPastelBrick from "@/assets/archetypes/cabinet-fronts/pastel_brick.jpg";
import cabinetFrontsLightBeige from "@/assets/archetypes/cabinet-fronts/light_beige.jpg";

// --- Flooring images ---
import flooringLightNaturalWood from "@/assets/archetypes/flooring/light_natural_wood.jpg";
import flooringLightAshWood from "@/assets/archetypes/flooring/light_ash_wood.jpg";
import flooringLightCoolWood from "@/assets/archetypes/flooring/light_cool_wood.jpg";
import flooringLightWarmWood from "@/assets/archetypes/flooring/light_warm_wood.jpg";
import flooringMediumNaturalWood from "@/assets/archetypes/flooring/medium_natural_wood.jpg";
import flooringMediumCoolWood from "@/assets/archetypes/flooring/medium_cool_wood.jpg";
import flooringMediumWarmWood from "@/assets/archetypes/flooring/medium_warm_wood.jpg";
import flooringDarkNaturalWood from "@/assets/archetypes/flooring/dark_natural_wood.jpg";
import flooringDarkCoolWood from "@/assets/archetypes/flooring/dark_cool_wood.jpg";
import flooringDarkWarmWood from "@/assets/archetypes/flooring/dark_warm_wood.jpg";
import flooringLightConcrete from "@/assets/archetypes/flooring/light_concrete.jpg";
import flooringDarkConcrete from "@/assets/archetypes/flooring/dark_concrete.jpg";
// NOTE: "natural_concere.jpg" has a typo in the filename — referencing as-is
import flooringNaturalConcrete from "@/assets/archetypes/flooring/natural_concere.jpg";

// --- Tiles images ---
import tilesBlackMarble from "@/assets/archetypes/tiles/black_marble.jpg";
import tilesLightWarmConcrete from "@/assets/archetypes/tiles/light_warm_concrete.jpg";
import tilesMediumWarmConcrete from "@/assets/archetypes/tiles/medium_warm_concrete.jpg";
import tilesWarmWhiteConcrete from "@/assets/archetypes/tiles/warm_white_concrete.jpg";

// --- Walls images ---
import wallsOffWhite from "@/assets/archetypes/walls/off-white.jpg";

// --- Accents images ---
import accentsAgedBronze from "@/assets/archetypes/accents/aged_bronze.jpg";
import accentsChrome from "@/assets/archetypes/accents/chrome.jpg";
import accentsGold from "@/assets/archetypes/accents/gold.jpg";
import accentsBlack from "@/assets/archetypes/accents/black.jpg";
import accentsWineRed from "@/assets/archetypes/accents/wine_red.jpg";

// --- Worktops & Backsplashes images ---
import worktopsAgedBronze from "@/assets/archetypes/worktops-and-backsplashes/aged_bronze.jpg";
import worktopsBlackMarble from "@/assets/archetypes/worktops-and-backsplashes/black_marble.jpg";
import worktopsLightWarmGrey from "@/assets/archetypes/worktops-and-backsplashes/light_warm_grey.jpg";
import worktopsMarbleCalcata from "@/assets/archetypes/worktops-and-backsplashes/marble_calcata.jpg";
import worktopsNaturalConcrete from "@/assets/archetypes/worktops-and-backsplashes/natural_concrete.jpg";
import worktopsWarmWhite from "@/assets/archetypes/worktops-and-backsplashes/warm_white.jpg";
import worktopsMediumAgedConcrete from "@/assets/archetypes/worktops-and-backsplashes/medium_aged_concrete.jpg";
import worktopsWhiteGoldGranite from "@/assets/archetypes/worktops-and-backsplashes/white_gold_granite.jpg";
import worktopsBlack from "@/assets/archetypes/worktops-and-backsplashes/black.jpg";
import worktopsDarkStone from "@/assets/archetypes/worktops-and-backsplashes/dark_stone.jpg";
import worktopsWhiteTiles from "@/assets/archetypes/worktops-and-backsplashes/white_tiles.jpg";
import worktopsBlackTiles from "@/assets/archetypes/worktops-and-backsplashes/black_tiles.jpg";
import worktopsBrownMarble from "@/assets/archetypes/worktops-and-backsplashes/brown_marble.jpg";

export const archetypes: MaterialArchetype[] = [
  // --- Cabinet Fronts (12) ---
  {
    id: "02_light_natural_wood",
    image: cabinetFrontsLightNaturalWood,
    displayName: { en: "Light Natural Wood Cabinet Fronts", lt: "Šviesios natūralios medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "natural",
    substance: "wood",
  },
  {
    id: "02_light_cool_wood",
    image: cabinetFrontsLightCoolWood,
    displayName: { en: "Light Cool Wood Cabinet Fronts", lt: "Šviesios pilkintos medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "cool",
    substance: "wood",
  },
  {
    id: "02_light_warm_wood",
    image: cabinetFrontsLightWarmWood,
    displayName: { en: "Light Warm Wood Cabinet Fronts", lt: "Šviesios šiltos medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "warm",
    substance: "wood",
  },
  {
    id: "02_light_warm_grey",
    image: cabinetFrontsLightWarmGrey,
    displayName: { en: "Light Warm Grey Cabinet Fronts", lt: "Šviesios šiltos pilkos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "warm",
    substance: "paint",
  },
  {
    id: "02_medium_natural_wood",
    image: cabinetFrontsMediumNaturalWood,
    displayName: { en: "Medium Natural Wood Cabinet Fronts", lt: "Natūralios medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "medium",
    temperature: "natural",
    substance: "wood",
  },
  {
    id: "02_medium_cool_wood",
    image: cabinetFrontsMediumCoolWood,
    displayName: { en: "Medium Cool Wood Cabinet Fronts", lt: "Pilkintos medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "medium",
    temperature: "cool",
    substance: "wood",
  },
  {
    id: "02_medium_warm_wood",
    image: cabinetFrontsMediumWarmWood,
    displayName: { en: "Medium Warm Wood Cabinet Fronts", lt: "Šiltos medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "medium",
    temperature: "warm",
    substance: "wood",
  },
  {
    id: "02_dark_natural_wood",
    image: cabinetFrontsDarkNaturalWood,
    displayName: { en: "Dark Natural Wood Cabinet Fronts", lt: "Tamsios natūralios medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "dark",
    temperature: "natural",
    substance: "wood",
  },
  {
    id: "02_dark_cool_wood",
    image: cabinetFrontsDarkCoolWood,
    displayName: { en: "Dark Cool Wood Cabinet Fronts", lt: "Tamsios pilkintos medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "dark",
    temperature: "cool",
    substance: "wood",
  },
  {
    id: "02_dark_warm_wood",
    image: cabinetFrontsDarkWarmWood,
    displayName: { en: "Dark Warm Wood Cabinet Fronts", lt: "Tamsios šiltos medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "dark",
    temperature: "warm",
    substance: "wood",
  },
  {
    id: "02_black",
    image: cabinetFrontsBlack,
    displayName: { en: "Black Cabinet Fronts", lt: "Juodi spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "dark",
    substance: "paint",
  },

  {
    id: "02_warm_white",
    image: cabinetFrontsWarmWhite,
    displayName: { en: "Warm White Cabinet Fronts", lt: "Šiltos baltos spalvos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "warm",
    substance: "paint",
  },
  {
    id: "02_aged_bronze",
    image: cabinetFrontsAgedBronze,
    displayName: { en: "Aged Bronze Cabinet Fronts", lt: "Senovinio bronzo spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "dark",
    temperature: "warm",
    substance: "metal",
  },

  {
    id: "02_black_wood_rich",
    image: cabinetFrontsBlackWoodRich,
    displayName: { en: "Rich Black Wood Cabinet Fronts", lt: "Turtingos juodos medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "dark",
    substance: "wood",
  },
  {
    id: "02_pastel_green",
    image: cabinetFrontsPastelGreen,
    displayName: { en: "Pastel Green Cabinet Fronts", lt: "Pastelinės žalios spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "cool",
    substance: "paint",
  },
  {
    id: "02_grey_blue",
    image: cabinetFrontsGreyBlue,
    displayName: { en: "Grey Blue Cabinet Fronts", lt: "Pilkai mėlynos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "medium",
    temperature: "cool",
    substance: "paint",
  },
  {
    id: "02_pastel_blue",
    image: cabinetFrontsPastelBlue,
    displayName: { en: "Pastel Blue Cabinet Fronts", lt: "Pastelinės mėlynos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "cool",
    substance: "paint",
  },
  {
    id: "02_white_grey_wood",
    image: cabinetFrontsWhiteGreyWood,
    displayName: { en: "White Grey Wood Cabinet Fronts", lt: "Baltos pilkos medienos spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "cool",
    substance: "wood",
  },
  {
    id: "02_pastel_brick",
    image: cabinetFrontsPastelBrick,
    displayName: { en: "Pastel Brick Cabinet Fronts", lt: "Pastelinės plytų spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "warm",
    substance: "paint",
  },
  {
    id: "02_light_beige",
    image: cabinetFrontsLightBeige,
    displayName: { en: "Light Beige Cabinet Fronts", lt: "Šviesiai smėlinės spintelių fasadai" },
    category: "cabinet-fronts",
    lightness: "light",
    temperature: "warm",
    substance: "paint",
  },

  // --- Flooring (12: 9 wood + 3 concrete) ---
  {
    id: "01_light_natural_wood",
    image: flooringLightNaturalWood,
    displayName: { en: "Light Natural Wood Flooring", lt: "Šviesios natūralios medienos grindys" },
    category: "flooring",
    lightness: "light",
    temperature: "natural",
    substance: "wood",
  },
  {
    id: "01_light_ash_wood",
    image: flooringLightAshWood,
    displayName: { en: "Light Ash Wood Flooring", lt: "Šviesios uosio medienos grindys" },
    category: "flooring",
    lightness: "light",
    temperature: "natural",
    substance: "wood",
  },
  {
    id: "01_light_cool_wood",
    image: flooringLightCoolWood,
    displayName: { en: "Light Cool Wood Flooring", lt: "Šviesios pilkintos medienos grindys" },
    category: "flooring",
    lightness: "light",
    temperature: "cool",
    substance: "wood",
  },
  {
    id: "01_light_warm_wood",
    image: flooringLightWarmWood,
    displayName: { en: "Light Warm Wood Flooring", lt: "Šviesios šiltos medienos grindys" },
    category: "flooring",
    lightness: "light",
    temperature: "warm",
    substance: "wood",
  },
  {
    id: "01_medium_natural_wood",
    image: flooringMediumNaturalWood,
    displayName: { en: "Medium Natural Wood Flooring", lt: "Natūralios medienos grindys" },
    category: "flooring",
    lightness: "medium",
    temperature: "natural",
    substance: "wood",
  },
  {
    id: "01_medium_cool_wood",
    image: flooringMediumCoolWood,
    displayName: { en: "Medium Cool Wood Flooring", lt: "Pilkintos medienos grindys" },
    category: "flooring",
    lightness: "medium",
    temperature: "cool",
    substance: "wood",
  },
  {
    id: "01_medium_warm_wood",
    image: flooringMediumWarmWood,
    displayName: { en: "Medium Warm Wood Flooring", lt: "Šiltos medienos grindys" },
    category: "flooring",
    lightness: "medium",
    temperature: "warm",
    substance: "wood",
  },
  {
    id: "01_dark_natural_wood",
    image: flooringDarkNaturalWood,
    displayName: { en: "Dark Natural Wood Flooring", lt: "Tamsios natūralios medienos grindys" },
    category: "flooring",
    lightness: "dark",
    temperature: "natural",
    substance: "wood",
  },
  {
    id: "01_dark_cool_wood",
    image: flooringDarkCoolWood,
    displayName: { en: "Dark Cool Wood Flooring", lt: "Tamsios pilkintos medienos grindys" },
    category: "flooring",
    lightness: "dark",
    temperature: "cool",
    substance: "wood",
  },
  {
    id: "01_dark_warm_wood",
    image: flooringDarkWarmWood,
    displayName: { en: "Dark Warm Wood Flooring", lt: "Tamsios šiltos medienos grindys" },
    category: "flooring",
    lightness: "dark",
    temperature: "warm",
    substance: "wood",
  },
  {
    id: "01_light_concrete",
    image: flooringLightConcrete,
    displayName: { en: "Light Concrete Flooring", lt: "Šviesios betono grindys" },
    category: "flooring",
    lightness: "light",
    substance: "concrete",
  },
  {
    id: "01_dark_concrete",
    image: flooringDarkConcrete,
    displayName: { en: "Dark Concrete Flooring", lt: "Tamsios betono grindys" },
    category: "flooring",
    lightness: "dark",
    substance: "concrete",
  },
  {
    id: "01_natural_concrete",
    image: flooringNaturalConcrete,
    displayName: { en: "Natural Concrete Flooring", lt: "Natūralios betono grindys" },
    category: "flooring",
    temperature: "natural",
    substance: "concrete",
  },

  // --- Tiles (4) ---
  {
    id: "03_black_marble",
    image: tilesBlackMarble,
    displayName: { en: "Black Marble Tiles", lt: "Juodo marmuro plytelės" },
    category: "tiles",
    lightness: "dark",
    substance: "stone",
  },
  {
    id: "03_light_warm_concrete",
    image: tilesLightWarmConcrete,
    displayName: { en: "Light Warm Concrete Tiles", lt: "Šviesios šiltos betono plytelės" },
    category: "tiles",
    lightness: "light",
    temperature: "warm",
    substance: "concrete",
  },
  {
    id: "03_medium_warm_concrete",
    image: tilesMediumWarmConcrete,
    displayName: { en: "Medium Warm Concrete Tiles", lt: "Šiltos betono plytelės" },
    category: "tiles",
    lightness: "medium",
    temperature: "warm",
    substance: "concrete",
  },
  {
    id: "03_warm_white_concrete",
    image: tilesWarmWhiteConcrete,
    displayName: { en: "Warm White Concrete Tiles", lt: "Šiltos baltos betono plytelės" },
    category: "tiles",
    lightness: "light",
    temperature: "warm",
    substance: "concrete",
  },

  // --- Worktops & Backsplashes (6) ---
  {
    id: "04_black_marble",
    image: worktopsBlackMarble,
    displayName: { en: "Black Marble Worktop", lt: "Juodo marmuro stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "dark",
    substance: "stone",
  },
  {
    id: "04_light_warm_grey",
    image: worktopsLightWarmGrey,
    displayName: { en: "Light Warm Grey Worktop", lt: "Šviesiai šiltas pilkas stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "light",
    temperature: "warm",
    substance: "stone",
  },
  {
    id: "04_marble_calcata",
    image: worktopsMarbleCalcata,
    displayName: { en: "Marble Calacatta Worktop", lt: "Calacatta marmuro stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "light",
    substance: "stone",
  },
  {
    id: "04_natural_concrete",
    image: worktopsNaturalConcrete,
    displayName: { en: "Natural Concrete Worktop", lt: "Natūralios betono stalviršis" },
    category: "worktops-and-backsplashes",
    temperature: "natural",
    substance: "concrete",
  },
  {
    id: "04_warm_white",
    image: worktopsWarmWhite,
    displayName: { en: "Warm White Worktop", lt: "Šiltas baltas stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "light",
    temperature: "warm",
    substance: "stone",
  },
  {
    id: "04_white_gold_granite",
    image: worktopsWhiteGoldGranite,
    displayName: { en: "White Gold Granite Worktop", lt: "Balto aukso granito stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "light",
    substance: "stone",
  },

  {
    id: "04_medium_aged_concrete",
    image: worktopsMediumAgedConcrete,
    displayName: { en: "Medium Aged Concrete Worktop", lt: "Sendinto betono stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "medium",
    temperature: "natural",
    substance: "concrete",
  },

  {
    id: "04_black",
    image: worktopsBlack,
    displayName: { en: "Black Worktop", lt: "Juodas stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "dark",
    substance: "stone",
  },
  {
    id: "04_dark_stone",
    image: worktopsDarkStone,
    displayName: { en: "Dark Stone Worktop", lt: "Tamsaus akmens stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "dark",
    substance: "stone",
  },
  {
    id: "04_white_tiles",
    image: worktopsWhiteTiles,
    displayName: { en: "White Tiles Backsplash", lt: "Baltos plytelės" },
    category: "worktops-and-backsplashes",
    lightness: "light",
    substance: "tile",
  },
  {
    id: "04_black_tiles",
    image: worktopsBlackTiles,
    displayName: { en: "Black Tiles Backsplash", lt: "Juodos plytelės" },
    category: "worktops-and-backsplashes",
    lightness: "dark",
    substance: "tile",
  },
  {
    id: "04_brown_marble",
    image: worktopsBrownMarble,
    displayName: { en: "Brown Marble Worktop", lt: "Rudo marmuro stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "medium",
    temperature: "warm",
    substance: "stone",
  },
  {
    id: "04_aged_bronze",
    image: worktopsAgedBronze,
    displayName: { en: "Aged Bronze Worktop", lt: "Sendintos bronzos stalviršis" },
    category: "worktops-and-backsplashes",
    lightness: "dark",
    temperature: "warm",
    substance: "metal",
  },

  // --- Walls (1) ---
  {
    id: "05_off_white",
    image: wallsOffWhite,
    displayName: { en: "Off-White Wall", lt: "Kreminio baltumo sienos" },
    category: "walls",
    lightness: "light",
    temperature: "warm",
    substance: "paint",
  },

  // --- Accents (5) ---
  {
    id: "06_gold",
    image: accentsGold,
    displayName: { en: "Gold", lt: "Auksas" },
    category: "accents",
    lightness: "light",
    temperature: "warm",
    substance: "metal",
  },
  {
    id: "06_chrome",
    image: accentsChrome,
    displayName: { en: "Chrome", lt: "Chromas" },
    category: "accents",
    lightness: "light",
    temperature: "cool",
    substance: "metal",
  },
  {
    id: "06_black",
    image: accentsBlack,
    displayName: { en: "Black", lt: "Juoda" },
    category: "accents",
    lightness: "dark",
    substance: "metal",
  },
  {
    id: "06_wine_red",
    image: accentsWineRed,
    displayName: { en: "Wine Red", lt: "Vyno raudona" },
    category: "accents",
    lightness: "dark",
    temperature: "warm",
    substance: "paint",
  },
  {
    id: "06_aged_bronze",
    image: accentsAgedBronze,
    displayName: { en: "Aged Bronze", lt: "Sendinta bronza" },
    category: "accents",
    lightness: "dark",
    temperature: "warm",
    substance: "metal",
  },
];

export function getArchetypeById(id: string): MaterialArchetype | undefined {
  return archetypes.find((a) => a.id === id);
}

export function getArchetypesByCategory(category: SurfaceCategory): MaterialArchetype[] {
  return archetypes.filter((a) => a.category === category);
}
