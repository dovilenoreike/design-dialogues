import type { Architecture } from "@/types/architecture";

import organicImg from "@/assets/styles/organic.jpg";
import industrialImg from "@/assets/styles/industrial.png";
import classicImg from "@/assets/styles/classic.jpg";
import minimalistImg from "@/assets/styles/minimalist.jpg";

export const architectures: Architecture[] = [
  {
    id: "minimalist",
    name: "Minimalist",
    desc: "Clean lines and natural materials",
    promptSnippet: "Scandinavian minimalism interiors seen in Cereal, Kinfolk, RUM."
  },
  {
    id: "organic",
    name: "Organic",
    desc: "Beauty in imperfection",
    promptSnippet: "Japandi style. Magazine references: Kinfolk, Cereal, and Sight Unseen."
  },
  {
    id: "classic",
    name: "Classic",
    desc: "Timeless sophistication",
    promptSnippet: "Classic interiors seen in Architectural Digest and Elle Decor"
  },
  {
    id: "industrial",
    name: "Industrial",
    desc: "Bold & raw",
    promptSnippet: "Urban-industrial. Magazine references: RUM Magazine, Openhouse, and Belgian or Italian minimalism."
  },
];

export const architectureImages: Record<string, string> = {
  "organic": organicImg,
  "industrial": industrialImg,
  "classic": classicImg,
  "minimalist": minimalistImg,
};

export const getArchitectureById = (id: string): Architecture | undefined => {
  return architectures.find(arch => arch.id === id);
};

export const getArchitectureImage = (id: string): string | undefined => {
  return architectureImages[id];
};
