import type { Material } from "./types";

import imgOffWhiteMatte from "@/assets/materials/spicy-nord/material3.jpg";
import imgVelvet1648 from "@/assets/materials/caramel-morning/material5.jpg";
import imgElitis02DY from "@/assets/materials/caramel-morning/material6.jpg";
import imgVelazques05 from "@/assets/materials/chocolate-wabi-sabi/material2.jpg";
import imgVelvet4246 from "@/assets/materials/cabinet-fronts/velvet_4246.jpg";
import imgEggerU750 from "@/assets/materials/day-by-the-sea/material4.jpg";
import imgValchromatChocolate from "@/assets/materials/day-by-the-sea/material5.jpg";
import imgVelvet3301 from "@/assets/materials/cabinet-fronts/velvet_3301.jpg";
import imgEggerDarkGreyFineline from "@/assets/materials/cabinet-fronts/egger_dark_grey_fineline.jpg";
import imgEggerMediumGreyFineline from "@/assets/materials/cabinet-fronts/egger_medium_grey_fineline.jpg";
import imgVelvet3702 from "@/assets/materials/cabinet-fronts/velvet_3702.jpg";
import imgAlvicVulcano from "@/assets/materials/morning-mist/material3.jpg";
import imgValchromatBlack from "@/assets/materials/behind-the-lights/material2.jpg";
import imgEggerH1385 from "@/assets/materials/behind-the-lights/material4.jpg";
import imgVelvet5983 from "@/assets/materials/behind-the-lights/material7.jpg";
import imgLightOakVeneer from "@/assets/materials/pure-scandi/material4.jpg";
import imgOakVeneerAmber from "@/assets/materials/spicy-nord/material4.jpg";
import imgEggerBrownCasellaOak from "@/assets/materials/cabinet-fronts/egger_brown_casella_oak.jpg";
import imgEggerLightNaturalCasellaOak from "@/assets/materials/cabinet-fronts/egger_light_natural_casella_oak.jpg";
import imgSkinCarbonFumo from "@/assets/materials/cabinet-fronts/skin_carbon_fumo.jpg";
import imgAlviGoya03NA from "@/assets/materials/cabinet-fronts/alvic-goya-03.jpg";
import imgAlvicGoya02 from "@/assets/materials/cabinet-fronts/alvic-goya-02.jpg";
import imgVelvetSoftBlack from "@/assets/materials/cabinet-fronts/velvet-1302.jpg";
import imgAlvicValazquez04 from "@/assets/materials/cabinet-fronts/alvic_valazquez-04.jpg";
import imgAlvicValazquez05 from "@/assets/materials/cabinet-fronts/alvic_valazquez-05.jpg";
import imgVelvet3703 from "@/assets/materials/cabinet-fronts/velvet-3703.jpg";
import imgVelvet7361 from "@/assets/materials/cabinet-fronts/velvet-7361.jpg";
import imgEggerNaturalCasellaOak from "@/assets/materials/cabinet-fronts/egger-natural-casella-oak.jpg";
import imgVelvet7473 from "@/assets/materials/cabinet-fronts/velvet_7473.jpg";
import imgVelvet1551 from "@/assets/materials/cabinet-fronts/velvet_1551.jpg";
import imgPearl7901 from "@/assets/materials/cabinet-fronts/pearl_7901.jpg";
import imgEggerPremiumWhite from "@/assets/materials/worktops/egger_premium_white_w1000_ST76.jpg";
import imgVelvet7574 from "@/assets/materials/sleeping-earth/material2.jpg";
import imgVelvet7393 from "@/assets/materials/sleeping-earth/material4.jpg";

const offWhiteMatte: Material = {
  id: "off-white-matte",
  image: imgOffWhiteMatte,
  displayName: { en: "Off-White Matte", lt: "Matinė šilta balta" },
  description: {
    en: "Flat matte off-white.",
    lt: "Matinė šilta balta spalva.",
  },
  type: "",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "",
  texturePrompt: "Flat matte off-white.",
  showroomIds: [],
  alternatives: {},
};

const velvet1648: Material = {
  id: "velvet-1648",
  image: imgVelvet1648,
  displayName: { en: "Velvet 1648", lt: "Velvet 1648" },
  description: {
    en: "Flat matte off-white.",
    lt: "Šilta balta spalva.",
  },
  type: "MDF",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 1648",
  texturePrompt: "Flat matte off-white.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const alvisElitis02DY: Material = {
  id: "alvis-elitis-02-dy",
  image: imgElitis02DY,
  displayName: { en: "Alvis Elitis 02 DY", lt: "Alvis Elitis 02 DY" },
  description: {
    en: "Dark khaki-brown fronts with a subtle linear texture.",
    lt: "Chaki-ruda su subtilia linijine tekstūra.",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Alvis Elitis 02 DY",
  texturePrompt:
    "Dark khaki-brown fronts with a subtle linear texture.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const alvisVelazques05: Material = {
  id: "alvis-velazques-05",
  image: imgVelazques05,
  displayName: {
    en: "Alvis Velazques 05",
    lt: "Alvis Velazques 05",
  },
  description: {
    en: "Rich walnut veneer with deep chocolate brown tones and matte finish",
    lt: "Sodrus riešutmedžio tekstūra",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Alvis Velazques 05",
  texturePrompt:
    "Rich walnut veneer with deep chocolate brown tones and matte finish",
  showroomIds: ["impeka"],
  alternatives: {},
};

const velvet4246: Material = {
  id: "velvet-4246",
  image: imgVelvet4246,
  displayName: { en: "Velvet 4246", lt: "Velvet 4246" },
  description: {
    en: "Fjord Green flat texture, a pastel grey-blue with green undertones",
    lt: "Jūros šviesiai mėlyna matinė tekstūra",
  },
  type: "MDF",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 4246",
  texturePrompt:
    "Fjord Green flat texture, a pastel grey-blue with green undertones",
  showroomIds: ["impeka"],
  alternatives: {},
};

const eggerTaupeGrey: Material = {
  id: "egger-taupe-grey",
  image: imgEggerU750,
  displayName: { en: "Egger U750 ST9", lt: "Egger U750 ST9" },
  description: {
    en: "Light taupe matte flat finish",
    lt: "Šviesiai pilkšvai ruda matinis paviršius",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Egger U750 ST9",
  texturePrompt: "Light taupe matte flat finish",
  showroomIds: ["impeka"],
  alternatives: {},
};

const valchromatChocolate: Material = {
  id: "valchromat-chocolate",
  image: imgValchromatChocolate,
  displayName: {
    en: "Valchromat Chocolate",
    lt: "Valchromat Chocolate",
  },
  description: {
    en: "Rich, deep, earthy brown flat texture",
    lt: "Šokolado, žemiška ruda tekstūra",
  },
  type: "MDF",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Valchromat Chocolate",
  texturePrompt: "Rich, deep, earthy brown flat texture",
  showroomIds: ["impeka"],
  alternatives: {},
};

const velvet3301: Material = {
  id: "velvet-3301",
  image: imgVelvet3301,
  displayName: { en: "Velvet 3301", lt: "Velvet 3301" },
  description: {
    en: "Garrison grey colour with blue undertone. Flat surfaces.",
    lt: "Rūką primenanti melsvai pilka.",
  },
  type: "MDF",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 3301",
  texturePrompt:
    "Garrison grey colour with blue undertone. Flat surfaces.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const eggerDarkGreyFineline: Material = {
  id: "egger-dark-grey-fineline",
  image: imgEggerDarkGreyFineline,
  displayName: { en: "Egger Dark Grey Fineline", lt: "Egger Dark Grey Fineline" },
  description: {
    en: "Matte dark brown cabinet fronts with fine horizontal wood grain texture",
    lt: "Matinė tamsiai ruda medienos tekstūra",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Egger H3198 ST19",
  texturePrompt:
    "Matte dark brown cabinet fronts with fine horizontal wood grain texture",
  showroomIds: ["impeka"],
  alternatives: {},
};

const eggerMediumGreyFineline: Material = {
  id: "egger-medium-grey-fineline",
  image: imgEggerMediumGreyFineline,
  displayName: { en: "Egger Medium Grey Fineline", lt: "Egger Medium Grey Fineline" },
  description: {
    en: "Matte medium grey cabinet fronts with fine horizontal wood grain texture",
    lt: "Matinė vidutiniškai pilka medienos tekstūra",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Egger H3198 ST19",
  texturePrompt:
    "Matte dark brown cabinet fronts with fine horizontal wood grain texture",
  showroomIds: ["impeka"],
  alternatives: {},
};

const velvet3702: Material = {
  id: "velvet-3702",
  image: imgVelvet3702,
  displayName: { en: "Velvet 3702", lt: "Velvet 3702" },
  description: {
    en: "Matte grey-green color.",
    lt: "Matinė pilkai žalia spalva.",
  },
  type: "MDF",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 3702",
  texturePrompt: "Matte grey-green color.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const alvicVulcano: Material = {
  id: "alvic-vulcano",
  image: imgAlvicVulcano,
  displayName: { en: "Alvic Vulcano", lt: "Alvic Vulcano" },
  description: {
    en: "Light taupe texture with a subtle vertical ribbed texture",
    lt: "Šviesi pilkšvai ruda tekstūra su subtiliu vertikaliu rievėjimu",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Alvic Vulcano",
  texturePrompt:
    "Light taupe texture with a subtle vertical ribbed texture",
  showroomIds: ["impeka"],
  alternatives: {},
};

const valchromatBlack: Material = {
  id: "valchromat-black",
  image: imgValchromatBlack,
  displayName: { en: "Valchromat Black", lt: "Valchromat Black" },
  description: {
    en: "Graphite matte – deep dark grey surface with a smooth, velvety matte texture",
    lt: "Grafito matinis – gilus tamsiai pilkas paviršius",
  },
  type: "MDF",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Valchromat Black",
  texturePrompt:
    "Black, velvety matte",
  showroomIds: ["impeka"],
  alternatives: {},
};

const eggerH1385ST40: Material = {
  id: "egger-h1385-st40",
  image: imgEggerH1385,
  displayName: { en: "Egger H1385 ST40", lt: "Egger H1385 ST40" },
  description: {
    en: "Natural warm-toned wood with subtle vertical grain.",
    lt: "Natūralus šilto atspalvio medis.",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Egger H1385 ST40",
  texturePrompt:
    "Natural warm-toned wood with subtle vertical grain.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const velvet5983: Material = {
  id: "velvet-5983",
  image: imgVelvet5983,
  displayName: { en: "Velvet 5983", lt: "Velvet 5983" },
  description: {
    en: "Rich brick-red colour matte finish.",
    lt: "Sodriai plytų raudonos spalvos matinis paviršius.",
  },
  type: "MDF",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 5983",
  texturePrompt: "Rich brick-red colour matte finish.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const lightOakVeneer: Material = {
  id: "light-oak-veneer",
  image: imgLightOakVeneer,
  displayName: {
    en: "Light Oak Veneer",
    lt: "Šviesaus ąžuolo lukštas",
  },
  description: {
    en: "Light oak veneer fronts, vertical grain, matte natural oil finish",
    lt: "Šviesaus ąžuolo tekstūra.",
  },
  type: "",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "",
  texturePrompt:
    "Light oak veneer fronts, vertical grain, matte natural oil finish",
  showroomIds: [],
  alternatives: {},
};

const naturalOakVeneerAmber: Material = {
  id: "natural-oak-veneer-amber",
  image: imgOakVeneerAmber,
  displayName: {
    en: "Natural Oak Veneer (Amber)",
    lt: "Natūralaus ąžuolo lukštas",
  },
  description: {
    en: "Natural oak veneer, vertical grain, amber undertones, matte natural oil finish",
    lt: "Natūralaus medžio tekstūra",
  },
  type: "",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "",
  texturePrompt:
    "Natural oak veneer, vertical grain, amber undertones, matte natural oil finish",
  showroomIds: [],
  alternatives: {},
};

const EggerBrownCasellaOak: Material = {
  id: "egger-brown-casella-oak",
  image: imgEggerBrownCasellaOak,
  displayName: {
    en: "Brown Casella Oak",
    lt: "Rudas ramus ąžuolas",
  },
  description: {
    en: "Dark wood vertical texture and matte finish",
    lt: "Rudo medžio tekstūra",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "H1386 ST40",
  texturePrompt: "Dark wood vertical texture and matte finish",
  showroomIds: [],
  alternatives: {},
};

const EggerLightNaturalCasellaOak: Material = {
  id: "egger-light-natural-casella-oak",
  image: imgEggerLightNaturalCasellaOak,
  displayName: {
    en: "Light Natural Casella Oak",
    lt: "Šviesus ąžuolas",
  },
  description: {
    en: "Light natural wood vertical texture and matte finish",
    lt: "Šviesas natūralaus medžio tekstūra",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "H1367 ST40",
  texturePrompt: "Light natural wood vertical texture and matte finish",
  showroomIds: [],
  alternatives: {},
};

const SkinCarbonFumo: Material = {
  id: "skin-carbon-fumo",
  image: imgSkinCarbonFumo,
  displayName: {
    en: "Black Carbon and Wood Texture",
    lt: "Juoda anglies ir medžio tekstūra",
  },
  description: {
    en: "Black Carbon and Wood Texture",
    lt: "Juoda anglies ir medžio tekstūra",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Skin Carbon Fumo",
  texturePrompt: "Black Carbon and Wood Texture",
  showroomIds: [],
  alternatives: {},
};

const AlviGoya03NA: Material = {
  id: "alvi-goya-03-na",
  image: imgAlviGoya03NA,
  displayName: {
    en: "Dark Wood Texture",
    lt: "Tamsi medžio tektūra",
  },
  description: {
    en: "Dark wood vertical texture and matte finish",
    lt: "Tamsi medžio tektūra",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Alvi Goya 03 NA",
  texturePrompt: "Dark wood vertical texture and matte finish",
  showroomIds: [],
  alternatives: {},
};

const AlvicGoya02: Material = {
  id: "alvic-goya-02",
  image: imgAlvicGoya02,
  displayName: {
    en: "Alvic Goya 02",
    lt: "Alvic Goya 02",
  },
  description: {
    en: "Warm greige wood grain with vertical texture",
    lt: "Šiltas greige medienos grūdėlių piešinys",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Alvic Goya 02",
  texturePrompt: "Warm greige wood grain with vertical texture, matte finish.",
  showroomIds: [],
  alternatives: {},
};

const EggerSoftBlack: Material = {
  id: "velvet-1302",
  image: imgVelvetSoftBlack,
  displayName: {
    en: "Velvet Soft Black",
    lt: "Velvet Soft Black",
  },
  description: {
    en: "Soft charcoal-black matte finish",
    lt: "Minkšta anglies juodumo matinė tekstūra",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet Soft Black",
  texturePrompt: "Soft charcoal-black flat matte finish.",
  showroomIds: [],
  alternatives: {"budget": "egger-soft-black"},
};

const AlvicValazquez04: Material = {
  id: "alvic-valazquez-04",
  image: imgAlvicValazquez04,
  displayName: {
    en: "Alvic Valázquez 04",
    lt: "Alvic Valázquez 04",
  },
  description: {
    en: "Light natural oak with fine vertical grain",
    lt: "Šviesi natūrali ąžuolo mediena su smulkiu vertikaliu grūdėliu",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Alvic Valázquez 04",
  texturePrompt: "Light natural oak with fine vertical grain, matte finish.",
  showroomIds: [],
  alternatives: {},
};

const AlvicValazquez05: Material = {
  id: "alvic-valazquez-05",
  image: imgAlvicValazquez05,
  displayName: {
    en: "Alvic Valázquez 05",
    lt: "Alvic Valázquez 05",
  },
  description: {
    en: "Deep warm walnut with fine vertical grain",
    lt: "Tamsus šiltas riešutas su smulkiu vertikaliu grūdėliu",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Alvic Valázquez 05",
  texturePrompt: "Deep warm walnut with fine vertical grain, matte finish.",
  showroomIds: [],
  alternatives: {},
};

const Velvet3703: Material = {
  id: "velvet-3703",
  image: imgVelvet3703,
  displayName: {
    en: "Velvet 3703",
    lt: "Velvet 3703",
  },
  description: {
    en: "Sage grey matte lacquer finish",
    lt: "Pilkai žalsvai matinė lakuota spalva",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 3703",
  texturePrompt: "Flat sage grey matte lacquer finish.",
  showroomIds: [],
  alternatives: {},
};

const Velvet7361: Material = {
  id: "velvet-7361",
  image: imgVelvet7361,
  displayName: {
    en: "Velvet 7361",
    lt: "Velvet 7361",
  },
  description: {
    en: "Warm greige matte lacquer finish",
    lt: "Šilta greige matinė lakuota spalva",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 7361",
  texturePrompt: "Flat warm greige matte lacquer finish.",
  showroomIds: [],
  alternatives: {},
};

const EggerNaturalCasellaOak: Material = {
  id: "egger-natural-casella-oak",
  image: imgEggerNaturalCasellaOak,
  displayName: {
    en: "Egger Natural Casella Oak",
    lt: "Egger Natural Casella Oak",
  },
  description: {
    en: "Warm natural oak wood grain",
    lt: "Šiltas natūralaus ąžuolo medienos raštas",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Egger Natural Casella Oak",
  texturePrompt: "Warm natural oak wood grain, vertical texture, matte finish.",
  showroomIds: [],
  alternatives: {},
};

const Velvet7473: Material = {
  id: "velvet-7473",
  image: imgVelvet7473,
  displayName: {
    en: "Light Greige Matte",
    lt: "Šviesiai pilka matinė",
  },
  description: {
    en: "Light greige flat matte finish",
    lt: "Švelnios šviesiai greige spalvos matinės tekstūros",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 7473",
  texturePrompt: "Light greige flat matte finish",
  showroomIds: [],
  alternatives: {},
};

const Velvet1551: Material = {
  id: "velvet-1551",
  image: imgVelvet1551,
  displayName: {
    en: "Off White Matte",
    lt: "Šilta balta matinė",
  },
  description: {
    en: "Off white flat matte finish",
    lt: "Švelnios šviesiai greige spalvos matinės tekstūros",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 1551",
  texturePrompt: "Off white flat matte finish",
  showroomIds: [],
  alternatives: {},
};

const Pearl7901: Material = {
  id: "pearl-7901",
  image: imgPearl7901,
  displayName: {
    en: "Dark Bronze Matte",
    lt: "Tamsi bronza",
  },
  description: {
    en: "Dark bronze flat matte finish",
    lt: "Tamsi bronza matinės tekstūros",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Pearl 7901",
  texturePrompt: "Dark bronze flat matte finish",
  showroomIds: [],
  alternatives: {},
};

const EggerPremiumWhiteWorktop: Material = {
  id: "egger-premium-white-worktop",
  image: imgEggerPremiumWhite,
  displayName: { en: "Flat matte off-white", lt: "Šilta balta spalva" },
  description: {
    en: "Flat matte off-white.",
    lt: "Šilta balta spalva.",
  },
  type: "LMDP",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Egger W1000 ST76",
  texturePrompt: "Flat matte off-white.",
  showroomIds: ["impeka"],
  alternatives: {"budget": "egger-premium-white-worktop"},
};

const velvet7574: Material = {
  id: "velvet-7574",
  image: imgVelvet7574,
  displayName: { en: "Velvet 7574", lt: "Velvet 7574" },
  description: {
    en: "Charcoal slate colour with blue undertones",
    lt: "Nakties mėlyna su pilkšvais atspalviais",
  },
  type: "MDF",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 7574",
  texturePrompt: "Charcoal slate colour with blue undertones",
  showroomIds: ["impeka"],
  alternatives: {},
};

const velvet7393: Material = {
  id: "velvet-7393",
  image: imgVelvet7393,
  displayName: { en: "Velvet 7393", lt: "Velvet 7393" },
  description: {
    en: "Light grey texture",
    lt: "Šviesiai pilka tekstūra",
  },
  type: "MDF",
  categories: ["cabinet-fronts"],
  tier: "optimal",
  code: "Velvet 7393",
  texturePrompt: "Light grey texture",
  showroomIds: ["impeka"],
  alternatives: {},
};

export const cabinetFrontsMaterials: Material[] = [
  offWhiteMatte,
  velvet1648,
  alvisElitis02DY,
  alvisVelazques05,
  velvet4246,
  eggerTaupeGrey,
  valchromatChocolate,
  velvet3301,
  eggerDarkGreyFineline,
  eggerMediumGreyFineline,
  velvet3702,
  alvicVulcano,
  valchromatBlack,
  eggerH1385ST40,
  velvet5983,
  lightOakVeneer,
  naturalOakVeneerAmber,
  EggerBrownCasellaOak,
  EggerLightNaturalCasellaOak,
  SkinCarbonFumo,
  AlviGoya03NA,
  AlvicGoya02,
  EggerSoftBlack,
  AlvicValazquez04,
  AlvicValazquez05,
  Velvet3703,
  Velvet7361,
  EggerNaturalCasellaOak,
  Velvet7473,
  Velvet1551,
  Pearl7901,
  EggerPremiumWhiteWorktop,
  velvet7574,
  velvet7393,
];
