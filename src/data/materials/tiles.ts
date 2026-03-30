import type { Material } from "./types";

import imgFlorimSensiLithosGrey from "@/assets/materials/tiles/florim_sensi_lithos_grey.jpg";
import imgSoftWhiteStone from "@/assets/materials/pure-scandi/material5.jpg";
import imgConfettoKaki from "@/assets/materials/caramel-morning/material2.jpg";
import imgRagnoEterna from "@/assets/materials/caramel-morning/material3.jpg";
import imgVaniglia from "@/assets/materials/caramel-morning/material4.jpg";
import imgOdaDuctileClassic from "@/assets/materials/tiles/oda_ductile_classic.jpg";
import imgOdaClassicSoft from "@/assets/materials/chocolate-wabi-sabi/material5.jpg";
import imgOdaDuctileIceCoast from "@/assets/materials/day-by-the-sea/material6.jpg";
import imgMarazziBlueGrey from "@/assets/materials/fog-in-the-forest/material2.jpg";
import imgAnthologyDark from "@/assets/materials/morning-mist/material4.jpg";
import imgFlorimOnyx from "@/assets/materials/sleeping-earth/material6.jpg";
import imgOdaSoftTextured from "@/assets/materials/tiles/oda_soft_textured.jpg";
import imgAtlasNero from "@/assets/materials/tiles/atlas_nero.jpg";
import imgFlorimSensiLithosWhite from "@/assets/materials/tiles/florim_sensi_lithos_white.jpg";

const florimSensiLithosGrey: Material = {
  id: "florim-sensi-lithos-grey",
  image: imgFlorimSensiLithosGrey,
  displayName: {
    en: "Florim Sensi Lithos Grey",
    lt: "Florim Sensi Lithos Grey",
  },
  description: {
    en: "Warm beige limestone-look tiles with a soft sandy texture",
    lt: "Šiltos smėlio spalvos kalkakmenio imitacijos plytelės",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Florim Sensi Lithos Grey",
  texturePrompt:
    "Warm beige limestone-look tiles with a soft sandy texture",
  showroomIds: ["linea"],
  alternatives: {},
};

const softWhiteStoneTiles: Material = {
  id: "soft-white-stone-tiles",
  image: imgSoftWhiteStone,
  displayName: {
    en: "Soft White Stone Tiles",
    lt: "Baltos akmens plytelės",
  },
  description: {
    en: "Soft white stone-effect tiles with subtle texture, matte finish.",
    lt: "Švelnios baltos akmens tekstūros plytelės.",
  },
  type: "",
  categories: ["tiles"],
  tier: "optimal",
  code: "",
  texturePrompt:
    "Soft white stone-effect tiles with subtle texture, matte finish.",
  showroomIds: [],
  alternatives: {},
};

const marazziConfettoKaki: Material = {
  id: "marazzi-confetto-kaki",
  image: imgConfettoKaki,
  displayName: {
    en: "Marazzi Confetto Kaki",
    lt: "Marazzi Confetto Kaki",
  },
  description: {
    en: "Matte khaki-brown small ribbed tiles with horizontal oval reliefs",
    lt: "Reljefinės chaki-rudos spalvos plytelės",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Marazzi Confetto Kaki Str. 3D Savoiardo MEUZ",
  texturePrompt:
    "Matte khaki-brown small ribbed tiles with horizontal oval reliefs",
  showroomIds: ["linea"],
  alternatives: {},
};

const ragnoEternaMix: Material = {
  id: "ragno-eterna-mix",
  image: imgRagnoEterna,
  displayName: {
    en: "Ragno Eterna Mix Multicolor",
    lt: "Ragno Eterna Mix Multicolor",
  },
  description: {
    en: "Matte terrazzo-look stone tiles with beige and warm grey base and mixed stone fragments",
    lt: "Šiltos terazo stiliaus plytelės.",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Ragno Eterna Mix Multicolor",
  texturePrompt:
    "Matte terrazzo-look stone tiles with beige and warm grey base and mixed stone fragments",
  showroomIds: ["linea"],
  alternatives: {},
};

const vanilliaLuxTermamater: Material = {
  id: "vaniglia-lux-terramater",
  image: imgVaniglia,
  displayName: {
    en: "Vaniglia Lux Terramater",
    lt: "Vaniglia Lux Terramater",
  },
  description: {
    en: "Matte off-white handmade-look tiles with slightly uneven edges and soft warm-white tone",
    lt: "Baltos rankų darbo stiliaus plytelės.",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Vaniglia Lux MPLQ Terramater",
  texturePrompt:
    "Matte off-white handmade-look tiles with slightly uneven edges and soft warm-white tone",
  showroomIds: ["linea"],
  alternatives: {},
};

const livingCeramicsOdaDuctileClassic: Material = {
  id: "living-ceramics-oda-ductile-classic",
  image: imgOdaDuctileClassic,
  displayName: {
    en: "Living Ceramics Oda Ductile Classic",
    lt: "Living Ceramics Oda Ductile Classic",
  },
  description: {
    en: "Vertically striped graphite tiles",
    lt: "Vertikaliai frezuotos grafito plytelės",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Living Ceramics Oda Ductile Classic",
  texturePrompt: "Vertically striped graphite tiles",
  showroomIds: ["linea"],
  alternatives: {},
};

const livingCeramicsOdaClassicSoft: Material = {
  id: "living-ceramics-oda-classic-soft",
  image: imgOdaClassicSoft,
  displayName: {
    en: "Living Ceramics Oda Classic Soft",
    lt: "Living Ceramics Oda Classic Soft",
  },
  description: {
    en: "Dark graphite colour stone-textured surface tiles",
    lt: "Grafito spalvos akmens tekstūra",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Living Ceramics Oda Classic Soft",
  texturePrompt:
    "Dark graphite colour stone-textured surface tiles",
  showroomIds: ["linea"],
  alternatives: {},
};

const livingCeramicsOdaDuctileIceCoast: Material = {
  id: "living-ceramics-oda-ductile-ice-coast",
  image: imgOdaDuctileIceCoast,
  displayName: {
    en: "Living Ceramics Oda Ductile Ice Coast",
    lt: "Living Ceramics Oda Ductile Ice Coast",
  },
  description: {
    en: "Ribbed tiles as subtle vertical accents of white stone texture",
    lt: "Rievėtos plytelės kaip subtilūs vertikalūs balto akmens tekstūros akcentai",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Living Ceramics Oda Ductile Ice Coast",
  texturePrompt:
    "Ribbed tiles as subtle vertical accents of white stone texture",
  showroomIds: ["linea"],
  alternatives: {},
};

const marazziGrandeMarbleLookBlueGrey: Material = {
  id: "marazzi-grande-marble-look-blue-grey",
  image: imgMarazziBlueGrey,
  displayName: {
    en: "Marazzi Grande Marble Look Blue Grey",
    lt: "Marazzi Grande Marble Look Blue Grey",
  },
  description: {
    en: "Dark grey marble with dramatic, busy pattern: mixed charcoal, grey, and subtle warm inclusions, irregular mineral texture",
    lt: "Tamsiai pilkas akmens raštas.",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Marazzi Grande Marble Look Blue Grey",
  texturePrompt:
    "Dark grey marble with dramatic, busy pattern: mixed charcoal, grey, and subtle warm inclusions, irregular mineral texture",
  showroomIds: ["linea"],
  alternatives: {},
};

const anthologyDarkNatural: Material = {
  id: "anthology-dark-natural",
  image: imgAnthologyDark,
  displayName: {
    en: "Anthology Dark Natural",
    lt: "Anthology Dark Natural",
  },
  description: {
    en: "Dark grey stone with a mixed mineral pattern: deep charcoal base, lighter grey veining, and scattered textured stone fragments.",
    lt: "Tamsiai pilkas akmuo su mišriu mineraliniu raštu.",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Anthology dark natural",
  texturePrompt:
    "Dark grey stone with a mixed mineral pattern: deep charcoal base, lighter grey veining, and scattered textured stone fragments.",
  showroomIds: ["linea"],
  alternatives: {},
};

const florimOnyxSilverPorphyry: Material = {
  id: "florim-onyx-silver-porphyry",
  image: imgFlorimOnyx,
  displayName: {
    en: "Florim Onyx Silver Porphyry",
    lt: "Florim Onyx Silver Porphyry",
  },
  description: {
    en: "Dark taupe-grey natural stone texture with high variation, cloudy movement and fractured veining. Irregular white mineral streaks cutting through the surface.",
    lt: "Pilkos plytelės su uolų tekstūra",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Florim ONYX&MORE SILVER PORPHYRY STR SAT",
  texturePrompt:
    "Dark taupe-grey natural stone texture with high variation, cloudy movement and fractured veining. Irregular white mineral streaks cutting through the surface.",
  showroomIds: ["linea"],
  alternatives: {},
};

const odaClassicSoftTextured: Material = {
  id: "oda-classic-soft-textured",
  image: imgOdaSoftTextured,
  displayName: {
    en: "Oda Classic Soft Textured",
    lt: "Oda Classic Soft Textured",
  },
  description: {
    en: "Dark fossil limestone tiles with organic shell inclusions and a muted bluish-grey undertone.",
    lt: "Tamsios fosilijų kalkakmenio raštas.",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Oda Classic Soft Textured",
  texturePrompt:
    "Dark fossil limestone tiles with organic shell inclusions and a muted bluish-grey undertone.",
  showroomIds: ["linea"],
  alternatives: {},
};

const atlasMarvelNeroMarquina: Material = {
  id: "atlas-marvel-nero-marquina",
  image: imgAtlasNero,
  displayName: {
    en: "Atlas Concorde Marvel Stone Nero Marquina",
    lt: "Atlas Concorde Marvel Stone Nero Marquina",
  },
  description: {
    en: "Deep black marble tiles featuring white veining",
    lt: "Gilios juodos marmuro plytelės su baltomis gyslelėmis",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Atlas Concorde Marvel Stone Nero Marquina",
  texturePrompt: "Deep black marble tiles featuring white veining",
  showroomIds: ["linea"],
  alternatives: {},
};

const FlorimSensiLithosWhite: Material = {
  id: "florim-sensi-lithos-white",
  image: imgFlorimSensiLithosWhite,
  displayName: {
    en: "Soft White Tiles",
    lt: "Šviesios plytelės",
  },
  description: {
    en: "Soft light of white tiles with subtle texture, matte finish.",
    lt: "Švelnios šviesios spalvos akmens tekstūros plytelės.",
  },
  type: "Tiles",
  categories: ["tiles"],
  tier: "optimal",
  code: "Florim Sensi Lithos White",
  texturePrompt:
    "Soft off-white tiles with subtle texture, matte finish.",
  showroomIds: [],
  alternatives: {},
};

export const tilesMaterials: Material[] = [
  florimSensiLithosGrey,
  softWhiteStoneTiles,
  marazziConfettoKaki,
  ragnoEternaMix,
  vanilliaLuxTermamater,
  livingCeramicsOdaDuctileClassic,
  livingCeramicsOdaClassicSoft,
  livingCeramicsOdaDuctileIceCoast,
  marazziGrandeMarbleLookBlueGrey,
  anthologyDarkNatural,
  florimOnyxSilverPorphyry,
  odaClassicSoftTextured,
  atlasMarvelNeroMarquina,
  FlorimSensiLithosWhite,
];
