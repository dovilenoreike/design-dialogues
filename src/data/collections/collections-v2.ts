import type { CollectionV2 } from "./types";

export const collectionsV2: CollectionV2[] = [
  {
    id: "cashmere-morning",
    name: { en: "Cashmere Morning", lt: "Kašmyro rytas" },
    designer: "dizaino_dialogai",
    vibe: "light-and-airy",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    defaults: {
      floor:            "solido-pearl",
      mainFronts:       "alvic-goya-02",
      additionalFronts: "velvet-7393",
      worktops:         "icono-arabesca-marmo",
      accents:          "chrome",
    },
  },
  {
    id: "chili-and-pepper",
    name: { en: "Chili & Pepper", lt: "Čilis ir pipiras" },
    designer: "dizaino_dialogai",
    vibe: "bold-and-moody",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    defaults: {
      floor:            "solido-bolsena",
      mainFronts:       "off-white-matte",
      additionalFronts: "alvi-goya-03-na",
      worktops:         "fondi-32-vento-marmo",
      accents:          "wine-red",
    },
  },
  {
    id: "urban-dusk",
    name: { en: "Urban Dusk", lt: "Miesto prieblanda" },
    designer: "dizaino_dialogai",
    vibe: "bold-and-moody",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    defaults: {
      floor:            "solido-bolsena",
      mainFronts:       "velvet-1551",
      additionalFronts: "pearl-7901",
      worktops:         "icono-marquina-cava",
      accents:          "aged-bronze",
    },
  },
  {
    id: "fog-in-the-forest",
    name: { en: "Fog in the Forest", lt: "Rūkas miške" },
    vibe: "bold-and-moody",
    designer: "athena_blackbird",
    promptBase: "",
    defaults: {
      floor:            "constance-chevrone",
      mainFronts:       "egger-dark-grey-fineline",
      additionalFronts: "velvet-3301",
      worktops:         "egger-f244-st76",
      accents:          "aged-bronze",
    },
  },
  {
    id: "spicy-nord",
    name: { en: "Spicy Nord", lt: "Charakteringa Šiaurė" },
    designer: "dizaino_dialogai",
    vibe: "warm-and-grounded",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    defaults: {
      floor:            "coretec-naturals-807-meadow",
      mainFronts:       "alvic-valazquez-04",
      additionalFronts: "velvet-1648",
      worktops:         "fondi-32-vento-marmo",
      accents:          "gold",
    },
  },
  {
    id: "chocolate-wabi-sabi",
    name: { en: "Chocolate Wabi-Sabi", lt: "Wabi-Sabi Šokolade" },
    designer: "dizaino_dialogai",
    vibe: "warm-and-grounded",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    defaults: {
      floor:            "aspecta-brienz",
      mainFronts:       "egger-brown-casella-oak",
      additionalFronts: "velvet-7393",
      worktops:         "icono-arabesca-marmo",
      accents:          "aged-bronze",
    },
  },
  {
    id: "day-by-the-sea",
    name: { en: "Day by the Sea", lt: "Diena prie jūros" },
    designer: "heya_studio",
    vibe: "light-and-airy",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    defaults: {
      floor:            "coretec-naturals-807-meadow",
      mainFronts:       "velvet-4246",
      additionalFronts: "egger-taupe-grey",
      worktops:         "icono-c43-eleganza-bianco",
      accents:          "gold",
    },
  },
  {
    id: "behind-the-lights",
    name: { en: "Behind the Lights", lt: "Šviesų užkulisiai" },
    designer: "impeka",
    vibe: "bold-and-moody",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    defaults: {
      floor:            "525-calisson-oak",
      mainFronts:       "valchromat-black",
      additionalFronts: "egger-natural-casella-oak",
      worktops:         "fondi-40-peperino-marmo",
      accents:          "wine-red",
    },
  },
  {
    id: "urban-night",
    name: { en: "Urban Night", lt: "Miesto naktis" },
    designer: "dizaino_dialogai",
    vibe: "bold-and-moody",
    promptBase: "Modern urban kitchen with dark tones and natural textures",
    defaults: {
      floor:            "aspecta-burned",
      mainFronts:       "valchromat-black",
      additionalFronts: "egger-dark-brown-eucalypthus",
      worktops:         "icono-laurent-carrata",
      accents:          "aged-bronze",
    },
  },
];

export function getCollectionV2ById(id: string): CollectionV2 | undefined {
  return collectionsV2.find((c) => c.id === id);
}
