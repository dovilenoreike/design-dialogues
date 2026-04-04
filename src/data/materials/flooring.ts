import type { Material } from "./types";

import imgAspectaBaron from "@/assets/materials/flooring/aspecta-baron.jpg";
import imgConstanceChevrone from "@/assets/materials/fog-in-the-forest/material1.jpg";
import imgComoChevrone from "@/assets/materials/flooring/aspecta-como.jpg";
import imgMacadamia from "@/assets/materials/sleeping-earth/material1.jpg";
import imgCalissonOak from "@/assets/materials/behind-the-lights/material1.jpg";
import imgPureScandiFloor from "@/assets/materials/pure-scandi/material1.jpg";
import imgLightConcrete from "@/assets/materials/spicy-nord/material1.jpg";
import imgSolidoIconicOakBolsena from "@/assets/materials/flooring/aspecta-bolsena.jpg";
import imgSolidoPearl from "@/assets/materials/flooring/solido_pearl.jpg";
import imgNagojaDuron from "@/assets/materials/flooring/nagoja_duron.jpg";
import imgAspectaAlmond from "@/assets/materials/flooring/aspecta-almond.jpg";
import imgAspectaBrienz from "@/assets/materials/flooring/aspecta-brienz.jpg";
import imgAspectaMaggiore from "@/assets/materials/flooring/aspecta-maggiore.jpg";
import imgAspectaBurned from "@/assets/materials/flooring/aspecta-burned.jpg";



const aspectaBaron: Material = {
  id: "aspecta-baron",
  image: imgAspectaBaron,
  displayName: { en: "Baron", lt: "Baron" },
  description: {
    en: "Natural oak texture.",
    lt: "Natūralaus ąžuolo tekstūra.",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Baron",
  texturePrompt: "Natural oak texture.",
  showroomIds: ["solido-grindys"],
  alternatives: {},
};

const constanceChevrone: Material = {
  id: "constance-chevrone",
  image: imgConstanceChevrone,
  displayName: {
    en: "Constance Chevrone",
    lt: "Constance Chevrone",
  },
  description: {
    en: "Medium dark grey chevron vinyl flooring with irregular tone, wood-effect finish. Soft matte finish, subtle grain, gentle variation in tone.",
    lt: "Pilkšva ąžuolo tekstūra.",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Constance",
  texturePrompt:
    "Medium dark grey chevron vinyl flooring with irregular tone, wood-effect finish. Soft matte finish, subtle grain, gentle variation in tone.",
  showroomIds: ["solido-grindys"],
  alternatives: {},
};

const comoChevrone: Material = {
  id: "solido-como",
  image: imgComoChevrone,
  displayName: { en: "Como Chevrone", lt: "Como Chevrone" },
  description: {
    en: "Light warm-oak chevron floor with a matte finish. Soft natural wood grain, gentle colour variation, classic V-shaped pattern.",
    lt: "Šviesios šilto ąžuolo eglutės rašto grindys.",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Como Chevrone",
  texturePrompt:
    "Light warm-oak chevron floor with a matte finish. Soft natural wood grain, gentle colour variation, classic V-shaped pattern.",
  showroomIds: ["solido-grindys"],
  alternatives: {},
};

const macadamia: Material = {
  id: "macadamia",
  image: imgMacadamia,
  displayName: { en: "Macadamia", lt: "Macadamia" },
  description: {
    en: "Honeyed oak in darker medium tone and herringbone pattern",
    lt: "Šiltas, vidutinio atspalvio natūralaus ąžuolo tekstūra",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Macadamia",
  texturePrompt:
    "Honeyed oak in darker medium tone and herringbone pattern",
  showroomIds: ["solido-grindys"],
  alternatives: {},
};

const calissonOak525: Material = {
  id: "525-calisson-oak",
  image: imgCalissonOak,
  displayName: { en: "525 Calisson Oak", lt: "525 Calisson Oak" },
  description: {
    en: "Warm smoked oak in a herringbone pattern.",
    lt: "Šiltas rūkytas ąžuolas eglutės raštu.",
  },
  type: "Laminate",
  categories: ["flooring"],
  tier: "optimal",
  code: "525 Calisson oak",
  texturePrompt: "Warm smoked oak in a herringbone pattern.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const pureScandiFlooring: Material = {
  id: "pure-scandi-flooring",
  image: imgPureScandiFloor,
  displayName: {
    en: "Light Natural Oak Parquet",
    lt: "Šviesaus ąžuolo parketas",
  },
  description: {
    en: "Light natural oak parquet, matte finish, subtle grain, laid in a mosaic pattern, Scandinavian feel.",
    lt: "Šviesaus ąžuolo tekstūra.",
  },
  type: "",
  categories: ["flooring"],
  tier: "optimal",
  code: "",
  texturePrompt:
    "Light natural oak parquet, matte finish, subtle grain, laid in a mosaic pattern, Scandinavian feel.",
  showroomIds: [],
  alternatives: {},
};

const lightConcrete: Material = {
  id: "light-concrete",
  image: imgLightConcrete,
  displayName: { en: "Light Concrete", lt: "Šviesus betonas" },
  description: {
    en: "Light concrete texture with subtle warm undertones, matte finish.",
    lt: "Šviesaus betono tekstūra.",
  },
  type: "",
  categories: ["flooring"],
  tier: "optimal",
  code: "",
  texturePrompt:
    "Light concrete texture with subtle warm undertones, matte finish.",
  showroomIds: [],
  alternatives: {},
};

const solidoIconicOakBolsena: Material = {
  id: "solido-bolsena",
  image: imgSolidoIconicOakBolsena,
  displayName: {
    en: "Light Smoked Oak",
    lt: "Šviesiai rūkytas ąžuolas",
  },
  description: {
    en: "Natural light smoked oak flooring",
    lt: "Natūralios šviesiai rūkyto ąžuolo tekstūra",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Bolsena",
  texturePrompt: "Natural light smoked oak flooring",
  showroomIds: ["solido-grindys"],
  alternatives: {},
};

const solidoPearl: Material = {
  id: "solido-pearl",
  image: imgSolidoPearl,
  displayName: {
    en: "Light concrete texture",
    lt: "Šviesi betono tekstūra",
  },
  description: {
    en: "Light concrete texture",
    lt: "Šviesi betono tekstūra",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Pearl",
  texturePrompt: "Light concrete texture flooring",
  showroomIds: ["jusu-salonas"],
  alternatives: {},
};

const NagojaDuron: Material = {
  id: "nagoja-duron",
  image: imgNagojaDuron,
  displayName: {
    en: "Light Smoked Oak",
    lt: "Rudas ąžuolas",
  },
  description: {
    en: "Natural light smoked oak flooring",
    lt: "Natūralios šviesiai rūkyto ąžuolo tekstūra",
  },
  type: "Engineered Wood",
  categories: ["flooring"],
  tier: "optimal",
  code: "Duron",
  texturePrompt: "Natural medium brown oak flooring",
  showroomIds: ["jusu-salonas"],
  alternatives: {},
};

const aspectaAlmond: Material = {
  id: "aspecta-almond",
  image: imgAspectaAlmond,
  displayName: { en: "Almond", lt: "Almond" },
  description: {
    en: "Warm almond-toned oak vinyl flooring, matte finish.",
    lt: "Šilto migdolo tono ąžuolo vinilinės grindys, matinis paviršius.",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Almond",
  texturePrompt: "Warm almond-toned oak vinyl flooring, matte finish.",
  showroomIds: ['solido-grindys'],
  alternatives: {},
};

const aspectaBrienz: Material = {
  id: "aspecta-brienz",
  image: imgAspectaBrienz,
  displayName: { en: "Brienz", lt: "Brienz" },
  description: {
    en: "Cool grey-toned oak vinyl flooring, matte finish.",
    lt: "Vėsaus pilko tono ąžuolo vinilinės grindys, matinis paviršius.",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Brienz",
  texturePrompt: "Cool grey-toned oak vinyl flooring, matte finish.",
  showroomIds: ['solido-grindys'],
  alternatives: {},
};

const aspectaMaggiore: Material = {
  id: "aspecta-maggiore",
  image: imgAspectaMaggiore,
  displayName: { en: "Maggiore", lt: "Maggiore" },
  description: {
    en: "Warm brown-toned oak vinyl flooring, matte finish.",
    lt: "Rudo ąžuolo vinilinės grindys, matinis paviršius.",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Maggiore",
  texturePrompt: "Warm brown-toned oak vinyl",
  showroomIds: ['solido-grindys'],
  alternatives: {},
};

const aspectaBurned: Material = {
  id: "aspecta-burned",
  image: imgAspectaBurned,
  displayName: { en: "Burned", lt: "Burned" },
  description: {
    en: "Warm brown-toned oak vinyl flooring, matte finish.",
    lt: "Tamsaus ąžuolo vinilinės grindys, matinis paviršius.",
  },
  type: "Vinyl",
  categories: ["flooring"],
  tier: "optimal",
  code: "Burned",
  texturePrompt: "Dark brown-toned oak",
  showroomIds: ['solido-grindys'],
  alternatives: {},
};

export const flooringMaterials: Material[] = [
  aspectaBaron,
  constanceChevrone,
  comoChevrone,
  macadamia,
  calissonOak525,
  pureScandiFlooring,
  lightConcrete,
  solidoIconicOakBolsena,
  solidoPearl,
  NagojaDuron,
  aspectaAlmond,
  aspectaBrienz,
  aspectaMaggiore,
  aspectaBurned,
];
