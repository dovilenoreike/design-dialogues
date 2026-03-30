import type { Material } from "./types";

import imgBrushedBronze from "@/assets/materials/day-by-the-sea/material8.jpg";
import imgTrafficWhite from "@/assets/materials/paint/ral_9016.jpg";
import imgSignalWhite from "@/assets/materials/paint/ral_9003.jpg";
import imgAgedBronze from "@/assets/materials/accents/aged_bronze.jpg";
import imgChrome from "@/assets/materials/accents/chrome.jpg";
import imgGold from "@/assets/materials/accents/gold.jpg";
import imgWineRed from "@/assets/materials/accents/wine_red.jpg";

const brushedBronze: Material = {
  id: "brushed-bronze",
  image: imgBrushedBronze,
  displayName: { en: "Brushed Bronze", lt: "Šlifuota bronza" },
  description: {
    en: "Brushed bronze or muted brass texture",
    lt: "Šlifuotos bronzos arba švelnios žalvario tekstūra",
  },
  type: "Metal",
  categories: ["fixtures"],
  tier: "optimal",
  code: "Brushed Bronze",
  texturePrompt: "Brushed bronze or muted brass texture",
  showroomIds: ["impeka"],
  alternatives: {},
};

const offWhiteWall: Material = {
  id: "off-white-wall",
  image: imgTrafficWhite,
  displayName: { en: "Off-White Wall Paint", lt: "Šilta balta sienų spalva" },
  description: {
    en: "Warm off-white wall paint, matte finish.",
    lt: "Šilta balta matinė sienų danga.",
  },
  type: "",
  categories: ["walls"],
  tier: "optimal",
  code: "RAL 9016",
  texturePrompt: "Warm off-white wall paint, matte finish.",
  showroomIds: [],
  alternatives: {},
};

const SignalWhitePaint: Material = {
  id: "signal-white-paint",
  image: imgSignalWhite,
  displayName: { en: "Signal White Paint", lt: "Signal balta spalva" },
  description: {
    en: "Warm signal white wall paint, matte finish.",
    lt: "Neutrali balta matinė sienų danga.",
  },
  type: "",
  categories: ["walls"],
  tier: "optimal",
  code: "RAL 9003",
  texturePrompt: "Neutral off-white wall paint, matte finish.",
  showroomIds: [],
  alternatives: {},
};

const agedBronze: Material = {
  id: "aged-bronze",
  image: imgAgedBronze,
  displayName: { en: "Aged Bronze", lt: "Sedinta bronza" },
  description: {
    en: "Aged bronze finish, warm undertones.",
    lt: "Sendintos bronzos detalės, šilti atspalviai.",
  },
  type: "",
  categories: ["accents"],
  tier: "optimal",
  code: "",
  texturePrompt: "Plumbing fixtures",
  showroomIds: [],
  alternatives: {},
};

const chrome: Material = {
  id: "chrome",
  image: imgChrome,
  displayName: { en: "Chrome", lt: "Chromas" },
  description: {
    en: "Chrome finish, modern look.",
    lt: "Chromo detalės, moderni išvaizda.",
  },
  type: "",
  categories: ["accents"],
  tier: "optimal",
  code: "",
  texturePrompt: "Chrome finish",
  showroomIds: [],
  alternatives: {},
};

const gold: Material = {
  id: "gold",
  image: imgGold,
  displayName: { en: "Gold", lt: "Auksas" },
  description: {
    en: "Gold finish, luxurious appearance.",
    lt: "Aukso detalės, prabangi išvaizda.",
  },
  type: "",
  categories: ["accents"],
  tier: "optimal",
  code: "",
  texturePrompt: "Gold finish",
  showroomIds: [],
  alternatives: {},
};

const wineRed: Material = {
  id: "wine-red",
  image: imgWineRed,
  displayName: { en: "Wine Red", lt: "Vyno raudona" },
  description: {
    en: "Wine red finish, rich and warm.",
    lt: "Vyno raudonos detalės, netikėti akcentai.",
  },
  type: "",
  categories: ["accents"],
  tier: "optimal",
  code: "",
  texturePrompt: "Wine red finish",
  showroomIds: [],
  alternatives: {},
};

export const accentsMaterials: Material[] = [
  brushedBronze,
  offWhiteWall,
  SignalWhitePaint,
  agedBronze,
  chrome,
  gold,
  wineRed,
];
