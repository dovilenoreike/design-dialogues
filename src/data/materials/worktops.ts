import type { Material } from "./types";

import imgEggerF244 from "@/assets/materials/fog-in-the-forest/material3.jpg";
import imgEggerF229 from "@/assets/materials/chocolate-wabi-sabi/material3.jpg";
import imgIconoEleganza from "@/assets/materials/day-by-the-sea/material3.jpg";
import imgEggerU702 from "@/assets/materials/chocolate-wabi-sabi/material6.jpg";
import imgFondi23 from "@/assets/materials/sleeping-earth/material3.jpg";
import imgFondi40 from "@/assets/materials/worktops/fondi-40-peperino-marmo.jpg";
import imgCalacattaViola from "@/assets/materials/spicy-nord/material2.jpg";
import imgGreyBeigeMarble from "@/assets/materials/pure-scandi/material2.jpg";
import imgIconoMarquinaCava from "@/assets/materials/worktops/icono_C35_marquina_cava.jpg";
import imgIconoSerenoNoto from "@/assets/materials/worktops/icono_C45_sereno_noto.jpg";
import imgIconoArabescaMarmo from "@/assets/materials/worktops/icono-c42-arabesca-marmo.jpg";
import imgIconoPicassoMarrone from "@/assets/materials/worktops/icono-c59-picasso-marrone.jpg";
import imgIconoLaurentCarrata from "@/assets/materials/worktops/icono-c31-laurent-carata.jpg";
import imgFondi32VentoMarmo from "@/assets/materials/worktops/fondi-32-vento-marmo.jpg";
import imgEggerCremonaMarble from "@/assets/materials/worktops/egger-cremona-marble.jpg";
import imgEggerSoftBlack from "@/assets/materials/worktops/egger-soft-black.jpg";

const eggerF244ST76: Material = {
  id: "egger-f244-st76",
  image: imgEggerF244,
  displayName: { en: "Egger F244 ST76", lt: "Egger F244 ST76" },
  description: {
    en: "Dark grey marble with dramatic, busy pattern: mixed charcoal, grey, and subtle warm inclusions, irregular mineral texture",
    lt: "Tamsiai pilkas akmens raštas.",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Egger F244 ST76",
  texturePrompt:
    "Dark grey marble with dramatic, busy pattern: mixed charcoal, grey, and subtle warm inclusions, irregular mineral texture",
  showroomIds: ["impeka"],
  alternatives: {},
};

const eggerF229ST75: Material = {
  id: "egger-f229-st75",
  image: imgEggerF229,
  displayName: { en: "Egger F229 ST75", lt: "Egger F229 ST75" },
  description: {
    en: "Soft beige worktops, stone-textured surface",
    lt: "Šilta balta akmens tekstūra",
  },
  type: "LMDP",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Egger F229 ST75",
  texturePrompt: "Soft beige worktops, stone-textured surface",
  showroomIds: ["impeka"],
  alternatives: {},
};

const iconoC43EleganzaBianco: Material = {
  id: "icono-c43-eleganza-bianco",
  image: imgIconoEleganza,
  displayName: {
    en: "ICONO C43 Eleganza Bianco",
    lt: "ICONO C43 Eleganza Bianco",
  },
  description: {
    en: "Stone-textured warm white",
    lt: "Šilta balta su akmens tekstūra",
  },
  type: "LMDP",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "ICONO C43 Eleganza Bianco",
  texturePrompt: "Stone-textured warm white",
  showroomIds: ["impeka"],
  alternatives: {},
};

const eggerU702ST75: Material = {
  id: "egger-u702-st75",
  image: imgEggerU702,
  displayName: { en: "Egger U702 ST75", lt: "Egger U702 ST75" },
  description: {
    en: "Smooth grey stone finish",
    lt: "Lygus pilko akmens paviršius",
  },
  type: "LMDP",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Egger U702 ST75",
  texturePrompt: "Smooth grey stone finish",
  showroomIds: ["impeka"],
  alternatives: {},
};

const fondi23VulcanoGrigia: Material = {
  id: "fondi-23-vulcano-grigia",
  image: imgFondi23,
  displayName: {
    en: "FONDI 23 Vulcano Grigia",
    lt: "FONDI 23 Vulcano Grigia",
  },
  description: {
    en: "Dark grey stone texture",
    lt: "Tamsiai pilka akmens tekstūra",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "FONDI 23 Vulcano Grigia",
  texturePrompt: "Dark grey stone texture",
  showroomIds: ["impeka"],
  alternatives: {},
};

const fondi40PeperinoMarmo: Material = {
  id: "fondi-40-peperino-marmo",
  image: imgFondi40,
  displayName: {
    en: "Fondi 40 Peperino Marmo",
    lt: "Fondi 40 Peperino Marmo",
  },
  description: {
    en: "Warm grey-brown medium tone marble with white veining and a calm, honed stone texture.",
    lt: "Šilta pilka marmuro tekstūra.",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Fondi 40 Peperino Marmo",
  texturePrompt:
    "Warm grey-brown medium tone marble with white veining and a calm, honed stone texture.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const calacattaViola: Material = {
  id: "calacatta-viola",
  image: imgCalacattaViola,
  displayName: { en: "Calacatta Viola", lt: "Calacatta Viola" },
  description: {
    en: "Bold white and black marble calacatta viola texture.",
    lt: "Drąsi juodo ir balto marmuro tekstūra.",
  },
  type: "",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "",
  texturePrompt:
    "Bold white and black marble calacatta viola texture.",
  showroomIds: [  ],
  alternatives: {},
};

const greyBeigeMarble: Material = {
  id: "grey-beige-marble",
  image: imgGreyBeigeMarble,
  displayName: {
    en: "Grey-Beige Marble",
    lt: "Pilkai smėlinis marmuras",
  },
  description: {
    en: "Natural soft grey-beige marble, cloudy movement, dark rich veins.",
    lt: "Šviesaus natūralaus akmens tekstūra.",
  },
  type: "",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "",
  texturePrompt:
    "Natural soft grey-beige marble, cloudy movement, dark rich veins.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const IconoMarquinaCava: Material = {
  id: "icono-marquina-cava",
  image: imgIconoMarquinaCava,
  displayName: {
    en: "Icono Marquina Cava",
    lt: "Icono Marquina Cava",
  },
  description: {
    en: "Deep black marble featuring white veining",
    lt: "Juodas marmuras su baltomis gyslelėmis",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Icono Marquina Cava",
  texturePrompt: "Black marble featuring white veining",
  showroomIds: ["impeka"],
  alternatives: {},
};

const IconoSerenoNoto: Material = {
  id: "icono-sereno-noto",
  image: imgIconoSerenoNoto,
  displayName: {
    en: "Icono Sereno Noto",
    lt: "Icono Sereno Noto",
  },
  description: {
    en: "Grey concrete texture with subtle warm undertones",
    lt: "Pilkas betonas su subtiliais šiltais atspalviais",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Icono Sereno Noto",
  texturePrompt: "Grey concrete texture with subtle warm undertones, matte finish.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const IconoArabescaMarmo: Material = {
  id: "icono-arabesca-marmo",
  image: imgIconoArabescaMarmo,
  displayName: {
    en: "Icono Arabesca Marmo",
    lt: "Icono Arabesca Marmo",
  },
  description: {
    en: "Light grey marble with soft white veining",
    lt: "Šviesiai pilkas marmuras su subtiliomis baltomis gyslelėmis",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Icono C42 Arabesca Marmo",
  texturePrompt: "Light grey marble with soft white veining, matte finish.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const IconoPicassoMarrone: Material = {
  id: "icono-picasso-marrone",
  image: imgIconoPicassoMarrone,
  displayName: {
    en: "Icono Picasso Marrone",
    lt: "Icono Picasso Marrone",
  },
  description: {
    en: "Dark grey-brown stone with warm rust veining",
    lt: "Tamsiai pilkai rudas akmuo su šiltomis rūdžių gyslelėmis",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Icono C59 Picasso Marrone",
  texturePrompt: "Dark grey-brown stone with warm rust veining, matte finish.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const IconoLaurentCarrata: Material = {
  id: "icono-laurent-carrata",
  image: imgIconoLaurentCarrata,
  displayName: {
    en: "Icono Laurent Carrata",
    lt: "Icono Laurent Carrata",
  },
  description: {
    en: "White stone with bold texture",
    lt: "Baltas akmuo su charakteringu raštu",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Icono C31 Laurent Carrata",
  texturePrompt: "White stone with bold texture.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const Fondi32VentoMarmo: Material = {
  id: "fondi-32-vento-marmo",
  image: imgFondi32VentoMarmo,
  displayName: {
    en: "Fondi 32 Vento Marmo",
    lt: "Fondi 32 Vento Marmo",
  },
  description: {
    en: "Light warm marble with soft grey veining",
    lt: "Šviesi šilta marmurinė tekstūra su subtiliomis pilkomis gyslelėmis",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Fondi 32 Vento Marmo",
  texturePrompt: "Light warm marble with soft grey veining, matte finish.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const EggerCremonaMarble: Material = {
  id: "egger-cremona-marble",
  image: imgEggerCremonaMarble,
  displayName: {
    en: "Egger Cremona Marble",
    lt: "Egger Kremona marmuras",
  },
  description: {
    en: "Warm beige marble with soft brown veining",
    lt: "Šiltas bežinis marmuras su subtiliomis rudomis gyslelėmis",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "Egger Cremona Marble",
  texturePrompt: "Warm beige marble with soft brown veining, matte finish.",
  showroomIds: ["impeka"],
  alternatives: {},
};

const EggerSoftBlack: Material = {
  id: "egger-soft-black",
  image: imgEggerSoftBlack,
  displayName: {
    en: "Egger Soft Black",
    lt: "Egger Soft Black",
  },
  description: {
    en: "Dark grey-black marble with subtle white veining",
    lt: "Tamsiai pilkai juodas marmuras su subtiliomis baltomis gyslelėmis",
  },
  type: "Compact HPL",
  categories: ["worktops-and-backsplashes"],
  tier: "optimal",
  code: "U899 ST9",
  texturePrompt: "Dark grey-black color matte finish.",
  showroomIds: ["impeka"],
  alternatives: {},
};

export const worktopsMaterials: Material[] = [
  eggerF244ST76,
  eggerF229ST75,
  iconoC43EleganzaBianco,
  eggerU702ST75,
  fondi23VulcanoGrigia,
  fondi40PeperinoMarmo,
  calacattaViola,
  greyBeigeMarble,
  IconoMarquinaCava,
  IconoSerenoNoto,
  IconoArabescaMarmo,
  IconoPicassoMarrone,
  IconoLaurentCarrata,
  Fondi32VentoMarmo,
  EggerCremonaMarble,
];
