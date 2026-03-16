import type { Collection } from "./types";
import { collectionThumbnails } from "./thumbnails";

export const collections: Collection[] = [
  {
    id: "caramel-morning",
    name: "Caramel Morning",
    promptBase:
      "Inspired by the uplifting energy of the morning. Sweet contrast of khaki-browns, warm beiges, soft off-whites. Walls in warm white.",
    thumbnail: collectionThumbnails["caramel-morning"],
    pool: {
      "flooring": ["baron"],
      "tiles": ["marazzi-confetto-kaki", "vaniglia-lux-terramater", "ragno-eterna-mix"],
      "worktops-and-backsplashes": ["egger-premium-white-worktop"],
      "cabinet-fronts": ["alvis-elitis-02-dy", "velvet-1648"],
      paint: ["off-white-wall"],
    },
  },
  {
    id: "chocolate-wabi-sabi",
    name: "Chocolate Wabi-Sabi",
    promptBase:
      "Inspired by warm modern wabi-sabi aesthetic vibe with dark chocolate tones, white marble, natural smoked oak and brushed silver accents",
    thumbnail: collectionThumbnails["chocolate-wabi-sabi"],
    pool: {
      "flooring": ["baron"],
      "cabinet-fronts": ["alvis-velazques-05"],
      "worktops-and-backsplashes": ["egger-f229-st75", "egger-u702-st75"],
      "tiles": ["living-ceramics-oda-classic-soft", "living-ceramics-oda-ductile-classic"],
      paint: ["off-white-wall"],
    },
  },
  {
    id: "day-by-the-sea",
    name: "Day by the Sea",
    promptBase:
      "Inspired by the calm of the sea. Add decor details in beige and chocolate brown. Walls in warm white.",
    thumbnail: collectionThumbnails["day-by-the-sea"],
    pool: {
      "flooring": ["baron"],
      "cabinet-fronts": ["velvet-4246", "velvet-3702", "egger-light-natural-casella-oak", "egger-taupe-grey", "valchromat-chocolate"],
      "worktops-and-backsplashes": ["icono-c43-eleganza-bianco"],
      "tiles": ["living-ceramics-oda-ductile-ice-coast", "florim-sensi-lithos-white"],
      fixtures: ["brushed-bronze"],
      paint: ["off-white-wall"],
    },
  },
  {
    id: "fog-in-the-forest",
    name: "Fog in the Forest",
    promptBase:
      "Inspired by fog in the forest, mysterious but calm atmosphere. Colours of dark trunks, grey-blue fog, dark branches. Wall in white.",
    thumbnail: collectionThumbnails["fog-in-the-forest"],
    pool: {
      "flooring": ["constance-chevrone"],
      "tiles": ["marazzi-grande-marble-look-blue-grey"],
      "worktops-and-backsplashes": ["egger-f244-st76"],
      "cabinet-fronts": ["egger-dark-grey-fineline", "egger-medium-grey-fineline", "velvet-3301"],
      paint: ["off-white-wall"],
    },
  },
  {
    id: "morning-mist",
    name: "Morning Mist",
    promptBase:
      "Inspired by the morning in the forest, colours of dark tree trunks blended with soft muted greens and pastels. Walls in light taupe.",
    thumbnail: collectionThumbnails["morning-mist"],
    pool: {
      "flooring": ["como-chevrone"],
      "cabinet-fronts": ["velvet-3702", "alvic-vulcano"],
      "tiles": ["anthology-dark-natural"],
      "worktops-and-backsplashes": ["egger-f244-st76"],
      paint: ["off-white-wall"],
    },
  },
  {
    id: "behind-the-lights",
    name: "Behind the Lights",
    promptBase:
      "Inspired by the theatrical lighting. Keep base colour palette neutral but add decor details of black and brick-red colour.",
    thumbnail: collectionThumbnails["behind-the-lights"],
    pool: {
      "flooring": ["525-calisson-oak"],
      "cabinet-fronts": ["valchromat-black", "egger-h1385-st40", "velvet-5983"],
      "worktops-and-backsplashes": ["fondi-40-peperino-marmo"],
      "tiles": ["oda-classic-soft-textured", "atlas-marvel-nero-marquina"],
      paint: ["off-white-wall"],
    },
  },
  {
    id: "spicy-nord",
    name: "Spicy Nord",
    promptBase:
      "Inspired by modern Scandi interiors with character. Decorate with natural textiles, natural wood, black and chrome details. Walls in white.",
    thumbnail: collectionThumbnails["spicy-nord"],
    pool: {
      "flooring": ["pure-scandi-flooring","light-concrete"],
      "worktops-and-backsplashes": ["grey-beige-marble","calacatta-viola"],
      "cabinet-fronts": ["light-oak-veneer", "off-white-matte","off-white-matte", "natural-oak-veneer-amber"],
      "tiles": ["soft-white-stone-tiles", "calacatta-viola", "grey-beige-marble","soft-white-stone-tiles"],
      paint: ["off-white-wall"],
    },
  },
  {
    id: "urban-dusk",
    name: "Urban Dusk",
    promptBase:
      "Inspired by modern urban interiors with a sophisticated, muted color palette. Decorate with neutral tones, natural textures, and metallic accents.",
    thumbnail: collectionThumbnails["urban-dusk"],
    pool: {
      "flooring": ["solido-iconic-oak-bolsena", "nagoja-duron", "solido-pearl" ],
      "worktops-and-backsplashes": ["icono-marquina-cava", "icono-sereno-noto"],
      "cabinet-fronts": ["alvi-goya-03-na", "skin-carbon-fumo", "velvet-1551", "pearl-7901"],
      "tiles": ["atlas-marvel-nero-marquina", "oda-classic-soft-textured", "living-ceramics-oda-ductile-classic", "living-ceramics-oda-ductile-ice-coast", "florim-sensi-lithos-grey"],
      paint: ["off-white-wall", "signal-white-paint"],
    },
  },
];

const collectionsById = new Map(collections.map((c) => [c.id, c]));

export function getCollectionById(id: string): Collection | undefined {
  return collectionsById.get(id);
}
