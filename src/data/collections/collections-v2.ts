import type { CollectionV2 } from "./types";
import urbanDusk from "@/assets/collections/urban-dusk.jpg";
import goldenHour from "@/assets/collections/golden-hour.jpg";
import spicyNord from "@/assets/collections/spicy-nord.jpg";

export const collectionsV2: CollectionV2[] = [
  {
    id: "urban-dusk",
    name: "Urban Dusk",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring: ["01_medium_cool_wood", "01_light_cool_wood", "01_natural_concrete"],
      "tiles": ["03_black_marble", "03_light_warm_concrete", "03_medium_warm_concrete"],
      "worktops-and-backsplashes": ["04_black_marble", "04_natural_concrete", "04_light_warm_grey"],
      "cabinet-fronts": ["02_dark_cool_wood", "02_medium_cool_wood", "02_black_wood_rich", "02_light_warm_grey"],
      "walls": ["05_off_white"],
      "accents": ["06_aged_bronze", '06_chrome'],
    },
    products: {
      // "light-oak-plank": ["mat-flooring-001", "mat-flooring-002", "mat-flooring-003"],
      // "white-quartz":    ["mat-worktop-010", "mat-worktop-011"],
      // "white-slab":      ["mat-cabinet-020"],
    },
    thumbnail: urbanDusk,
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring: ["01_light_cool_wood", "01_light_concrete"],
      "tiles": ["03_black_marble", "03_light_warm_concrete", "03_medium_warm_concrete"],
      "worktops-and-backsplashes": ["04_medium_aged_concrete", "04_black_marble"],
      "cabinet-fronts": ["02_medium_natural_wood", "02_dark_natural_wood", "02_light_warm_grey", "02_aged_bronze"],
      "walls": ["05_off_white"],
      "accents": ["06_aged_bronze"],
    },
    products: {
      // "light-oak-plank": ["mat-flooring-001", "mat-flooring-002", "mat-flooring-003"],
      // "white-quartz":    ["mat-worktop-010", "mat-worktop-011"],
      // "white-slab":      ["mat-cabinet-020"],
    },
    thumbnail: goldenHour,
  },
  {
    id: "spicy-nord",
    name: "Spicy Nord",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring: ["01_light_natural_wood","01_medium_natural_wood", "01_light_concrete"],
      "tiles": ["03_light_warm_concrete", "03_medium_warm_concrete"],
      "worktops-and-backsplashes": ["04_marble_calcata", "04_white_gold_granite", "04_warm_white"],
      "cabinet-fronts": ["02_light_natural_wood","02_medium_natural_wood", "02_warm_white", "02_light_warm_grey"],
      "walls": ["05_off_white"],
      "accents": ["06_gold", "06_chrome"],
    },
    products: {
      // "light-oak-plank": ["mat-flooring-001", "mat-flooring-002", "mat-flooring-003"],
      // "white-quartz":    ["mat-worktop-010", "mat-worktop-011"],
      // "white-slab":      ["mat-cabinet-020"],
    },
    thumbnail: spicyNord,
  },
  {
    id: "chili-and-pepper",
    name: "Chili & Pepper",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring: ["01_light_cool_wood","01_natural_concrete", "01_dark_cool_wood"],
      "tiles": ["03_light_warm_concrete", "03_medium_warm_concrete"],
      "worktops-and-backsplashes": ["04_marble_calcata", "04_black_tiles"],
      "cabinet-fronts": ["02_black", "02_black_wood_rich", "02_warm_white","02_aged_bronze"],
      "walls": ["05_off_white"],
      "accents": ["06_wine_red", "06_aged_bronze"],
    },
    products: {
      // "light-oak-plank": ["mat-flooring-001", "mat-flooring-002", "mat-flooring-003"],
      // "white-quartz":    ["mat-worktop-010", "mat-worktop-011"],
      // "white-slab":      ["mat-cabinet-020"],
    },
    thumbnail: spicyNord,
  },
  {
    id: "urban-lolipop",
    name: "Urban Lolipop",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring: [ "01_light_concrete", "01_light_natural_wood"],
      "tiles": ["03_light_warm_concrete", "03_medium_warm_concrete"],
      "worktops-and-backsplashes": ["04_black_marble", "04_white_gold_granite", "04_white_tiles", ],
      "cabinet-fronts": [ "02_pastel_green", "02_medium_natural_wood", "02_pastel_blue", "02_pastel_brick" ],
      "walls": ["05_off_white"],
      "accents": ["06_wine_red", "06_gold"],
    },
    products: {
      // "light-oak-plank": ["mat-flooring-001", "mat-flooring-002", "mat-flooring-003"],
      // "white-quartz":    ["mat-worktop-010", "mat-worktop-011"],
      // "white-slab":      ["mat-cabinet-020"],
    },
    thumbnail: spicyNord,
  },

  {
    id: "fog-in-the-forest",
    name: "Fog in the Forest",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring: [ "01_light_ash_wood", "01_natural_concrete"],
      "tiles": ["03_light_warm_concrete", "03_medium_warm_concrete"],
      "worktops-and-backsplashes": ["04_dark_stone", "04_natural_concrete"],
      "cabinet-fronts": [ "02_dark_cool_wood", "02_grey_blue", "02_white_grey_wood", "02_light_warm_grey"],
      "walls": ["05_off_white"],
      "accents": ["06_aged_bronze"],
    },
    products: {
      // "light-oak-plank": ["mat-flooring-001", "mat-flooring-002", "mat-flooring-003"],
      // "white-quartz":    ["mat-worktop-010", "mat-worktop-011"],
      // "white-slab":      ["mat-cabinet-020"],
    },
    thumbnail: spicyNord,
  },
    {
    id: "golden-canyon",
    name: "Golden Canyon",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring: [ "01_light_natural_wood"],
      "tiles": ["03_light_warm_concrete", "03_medium_warm_concrete"],
      "worktops-and-backsplashes": [ "04_aged_bronze","04_brown_marble", "04_aged_concrete",],
      "cabinet-fronts": [  "02_medium_warm_wood", "02_light_beige","02_dark_warm_wood"],
      "walls": ["05_off_white"],
      "accents": ["06_gold"],
    },
    products: {
      // "light-oak-plank": ["mat-flooring-001", "mat-flooring-002", "mat-flooring-003"],
      // "white-quartz":    ["mat-worktop-010", "mat-worktop-011"],
      // "white-slab":      ["mat-cabinet-020"],
    },
    thumbnail: spicyNord,
  },
];


export function getCollectionV2ById(id: string): CollectionV2 | undefined {
  return collectionsV2.find((c) => c.id === id);
}
