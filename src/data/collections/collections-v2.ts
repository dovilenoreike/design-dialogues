import type { CollectionV2 } from "./types";
import urbanDusk from "@/assets/collections/urban-dusk.jpg";
import goldenHour from "@/assets/collections/golden-hour.jpg";
import spicyNord from "@/assets/collections/spicy-nord.jpg";

export const collectionsV2: CollectionV2[] = [
    {
    id: "cashmere-morning",
    name: { en: "Cashmere Morning", lt: "Kašmyro rytas" },
    vibe: "light-and-airy",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring:                  ["concrete","light-wood"],
      "worktops-and-backsplashes": ["soft-texture-light", "soft-texture-dark"],
      "cabinet-fronts":          ["neutral",  "medium-wood", "dark-wood",],
      tiles:                     [],
      walls:                     ["off-white"],
      accents:                   ["chrome"],
    },
    products: {
      flooring:                  { "light-wood": ["solido-iconic-oak-bolsena"], "concrete": ["solido-pearl"] },
      "worktops-and-backsplashes": { "soft-texture-light": ["icono-arabesca-marmo"], "soft-texture-dark": ["icono-picasso-marrone"]},
      "cabinet-fronts":          {  "neutral": ["velvet-7393"], "medium-wood": ["alvic-goya-02"], "dark-wood": ["alvi-goya-03-na"]},
      "accents":                   {"chrome": ["chrome"] },
    },
    thumbnail: urbanDusk,
  },
  {
    id: "chili-and-pepper",
    name: { en: "Chili & Pepper", lt: "Čilis ir pipiras" },
    vibe: "bold-and-moody",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring:                  ["light-wood", "concrete", "medium-wood"],
      "worktops-and-backsplashes": ["bold-texture-light"],
      "cabinet-fronts":          [ "white","black", "dark-wood",],
      walls:                     ["off-white"],
      accents:                   ["wine-red", "aged-bronze"],
    },
    products: {
      flooring:                  { "light-wood": ["solido-iconic-oak-bolsena"], "medium-wood": ["nagoja-duron"], "concrete": ["solido-pearl"] },
      "worktops-and-backsplashes": { "bold-texture-light": ["fondi-32-vento-marmo"] },
      "cabinet-fronts":          { "black": ["skin-carbon-fumo"], "dark-wood": ["alvi-goya-03-na"], "white": ["off-white-matte"] },
      accents:                   { "wine-red": ["wine-red"], "aged-bronze": ["aged-bronze"] },
    },
    thumbnail: spicyNord,
  },
  {
    id: "urban-dusk",
    name: { en: "Urban Dusk", lt: "Miesto sutemos" },
    vibe: "bold-and-moody",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring:                  ["light-wood", "medium-wood", "concrete"],
      "worktops-and-backsplashes": ["soft-texture-dark", "concrete"],
      "cabinet-fronts":          ["neutral","dark-wood","metallic","black"],
      tiles:                     [],
      walls:                     ["off-white"],
      accents:                   ["aged-bronze", "chrome"],
    },
    products: {
      flooring:                  { "light-wood": ["solido-iconic-oak-bolsena"],  "medium-wood": ["nagoja-duron"], "concrete": ["solido-pearl"] },
      "worktops-and-backsplashes": { "soft-texture-dark": ["icono-marquina-cava"], "concrete": ["icono-sereno-noto"] },
      "cabinet-fronts":          { "dark-wood": ["alvi-goya-03-na"], "black": ["skin-carbon-fumo"], "neutral": ["velvet-1551"], "metallic": ["pearl-7901"] },
      "accents":                   { "aged-bronze": ["aged-bronze"], "chrome": ["chrome"] },
    },
    thumbnail: urbanDusk,
  },
  {
    id: "fog-in-the-forest",
    name: { en: "Fog in the Forest", lt: "Rūkas miške" },
    vibe: "bold-and-moody",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring:                  ["bleached-wood", "concrete"],
      "worktops-and-backsplashes": ["soft-texture-dark"],
      "cabinet-fronts":          ["dark-wood", "pastel", "bleached-wood"],
      tiles:                     ["light-warm-concrete", "medium-warm-concrete"],
      walls:                     ["off-white"],
      accents:                   ["aged-bronze"],
    },
    products: {
      flooring:                  { "bleached-wood": ["constance-chevrone"], "concrete": ["solido-pearl"] },
      "worktops-and-backsplashes": { "soft-texture-dark": ["egger-f244-st76"] },
      "cabinet-fronts":          { "dark-wood": ["egger-dark-grey-fineline"], "pastel": ["velvet-3301"] , "bleached-wood": ["egger-medium-grey-fineline"]},
      accents:                   { "aged-bronze": ["aged-bronze"] },
      
    },
    thumbnail: spicyNord,
  },
  {
    id: "spicy-nord",
    name: { en: "Spicy Nord", lt: "Charakteringa Šiaurė" },
    vibe: "warm-and-grounded",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring:                  [ "light-wood", "concrete"],
      "worktops-and-backsplashes": ["white", "soft-texture-light", "bold-texture-light"],
      "cabinet-fronts":          ["white", "light-wood", "neutral"],
      walls:                     ["off-white"],
      accents:                   ["gold", "chrome"],
    },
    products: {
      flooring:                  {  "light-wood": ["baron"], "concrete": ["solido-pearl"] },
      "worktops-and-backsplashes": {"bold-texture-light": ["fondi-32-vento-marmo"], "soft-texture-light": ["egger-cremona-marble"], "white": ["egger-premium-white-worktop"] },
      "cabinet-fronts":          { "white": ["velvet-1648"], "light-wood": ["alvic-valazquez-04"] },
      accents:                   { "gold": ["gold"], "chrome": ["chrome"] },
    },
    thumbnail: spicyNord,
  },
    {
    id: "chocolate-wabi-sabi",
    name: { en: "Chocolate Wabi-Sabi", lt: "Wabi-Sabi Šokolade" },
    vibe: "warm-and-grounded",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring:                  [ "medium-wood", "light-wood","concrete"],
      "worktops-and-backsplashes": ["soft-texture-light","soft-texture-dark"],
      "cabinet-fronts":          ["medium-wood", "neutral", "black"],
      walls:                     ["off-white"],
      accents:                   ["aged-bronze", "chrome"],
    },
    products: {
      flooring:                  {  "medium-wood": ["nagoja-duron"], "light-wood": ["solido-iconic-oak-bolsena"], "concrete": ["solido-pearl"] },
      "worktops-and-backsplashes": {"soft-texture-light": ["icono-arabesca-marmo"], "soft-texture-dark": ["icono-marquina-cava"] },
      "cabinet-fronts":          {"medium-wood": ["egger-brown-casella-oak"], "neutral": ["velvet-7393"], "black": ["velvet-1302"]  },
      accents:                   { "aged-bronze": ["aged-bronze"], "chrome": ["chrome"] },
    },
    thumbnail: spicyNord,
  },
    {
    id: "day-by-the-sea",
    name: { en: "Day by the Sea", lt: "Diena prie jūros" },
    vibe: "light-and-airy",
    promptBase: "Modern urban kitchen with warm tones and natural textures",
    pool: {
      flooring:                  [ "light-wood", "concrete"],
      "worktops-and-backsplashes": ["white"],
      "cabinet-fronts":          ["pastel", "neutral", "bleached-wood"],
      walls:                     ["off-white"],
      accents:                   ["gold", "chrome"],
    },
    products: {
      flooring:                  {  "light-wood": ["solido-iconic-oak-bolsena"], "concrete": ["solido-pearl"] },
      "worktops-and-backsplashes": { "white": ["icono-c43-eleganza-bianco"] },
      "cabinet-fronts":          { "pastel": ["velvet-4246"], "neutral": ["egger-taupe-grey"], "bleached-wood": ["egger-light-natural-casella-oak"] },
      accents:                   { "gold": ["gold"], "chrome": ["chrome"] },
    },
    thumbnail: spicyNord,
  },
];

export function getCollectionV2ById(id: string): CollectionV2 | undefined {
  return collectionsV2.find((c) => c.id === id);
}
