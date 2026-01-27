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
    promptSnippet: "Minimalist space focused on clarity, light, and intentional restraint. Emphasize clean lines, balanced proportions, and generous negative space."
  },
  {
    id: "organic",
    name: "Organic",
    desc: "Beauty in imperfection",
    promptSnippet: "A soft, organic space with a warm and tactile atmosphere. Prioritize rounded forms. Avoid glossy finishes or industrial hardness."
  },
  {
    id: "classic",
    name: "Classic",
    desc: "Timeless sophistication",
    promptSnippet: "Refined old-money space that blends classical principles with contemporary restraint. Focus on timeless elegance expressed through symmetry, proportion, and architectural clarity. Decorative wall elements may reference heritage such as mouldings, but always simplified and never too ornate."
  },
  {
    id: "industrial",
    name: "Industrial",
    desc: "Bold & raw",
    promptSnippet: "Inspired by urban-industrial that highlights structure, material honesty. Some elements such as ceiling or wall elements in exposed plaster, concrete, steel, stone. These surfaces may feel raw, but the overall composition remains intentional and refined. Inspired by RUM Magazine, Openhouse, and Belgian or Italian minimalism."
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
