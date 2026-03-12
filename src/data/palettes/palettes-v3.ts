import type { ArchetypePalette } from "./types";

export const palettesV2: ArchetypePalette[] = [
  {
    id: "urban-dusk",
    name: "Urban Dusk",
    collectionId: "urban-dusk",
    designer:  "dizaino_dialogai",
    promptTweak: "Add warm amber undertones and richer wood grain texture",
    selections: {
      kitchen: {
        floor: "01_light_cool_wood",
        bottomCabinets: "02_medium_cool_wood",
        topCabinets: "02_light_warm_grey",
        shelves: "02_light_warm_grey",
        worktops: "04_black_marble",
        wall: "05_off_white",
        accents: "06_aged_bronze",
      },
      livingRoom: {
        floor: "01_light_cool_wood",
        cabinetFurniture: "02_medium_cool_wood",
        shelves: "02_light_warm_grey",
        wall: "05_off_white",
        accents: "06_aged_bronze",
      },
      bedroom: {
        floor: "01_light_cool_wood",
        wardrobes: "02_medium_cool_wood",
        shelves: "02_light_warm_grey",
        wall: "05_off_white",
        accents: "06_aged_bronze",
      },
    },
    status: "coming-soon",
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    collectionId: "golden-hour",
    designer: "dizaino_dialogai",
    promptTweak: "Warm golden tones with natural wood, aged concrete surfaces and bronze accents",
    selections: {
      kitchen: {
        floor: "01_light_cool_wood",
        bottomCabinets: "02_medium_natural_wood",
        topCabinets: "02_light_warm_grey",
        shelves: "02_light_warm_grey",
        worktops: "04_medium_aged_concrete",
        wall: "05_off_white",
        accents: "06_aged_bronze",
      },
      livingRoom: {
        floor: "01_light_cool_wood",
        cabinetFurniture: "02_medium_natural_wood",
        shelves: "02_light_warm_grey",
        wall: "05_off_white",
        accents: "06_aged_bronze",
      },
      bedroom: {
        floor: "01_light_cool_wood",
        wardrobes: "02_medium_natural_wood",
        shelves: "02_light_warm_grey",
        wall: "05_off_white",
        accents: "06_aged_bronze",
      },
    },
    status: "coming-soon",
  },
{
    id: "spicy-nord",
    name: "Spicy Nord",
    collectionId: "spicy-nord",
    designer: "dizaino_dialogai",
    promptTweak: "Warm golden tones with natural wood, aged concrete surfaces and bronze accents",
    selections: {
      kitchen: {
        floor: "01_light_natural_wood",
        bottomCabinets: "02_medium_natural_wood",
        topCabinets: "02_warm_white",
        shelves: "02_warm_white",
        worktops: "04_marble_calcata",
        wall: "05_off_white",
        accents: "06_chrome",
      },
      livingRoom: {
        floor: "01_light_cool_wood",
        cabinetFurniture: "02_medium_natural_wood",
        shelves: "02_light_warm_grey",
        wall: "05_off_white",
        accents: "06_chrome",
      },
      bedroom: {
        floor: "01_light_cool_wood",
        wardrobes: "02_medium_natural_wood",
        shelves: "02_light_warm_grey",
        wall: "05_off_white",
        accents: "06_chrome",
      },
    },
    status: "coming-soon",
  },
];
export const palettesV3: ArchetypePalette[] = [];

export function getPaletteV3ById(id: string): ArchetypePalette | undefined {
  return palettesV3.find((p) => p.id === id);
}

export function getPalettesV3ByCollectionId(collectionId: string): ArchetypePalette[] {
  return palettesV3.filter((p) => p.collectionId === collectionId);
}
