import type { Style } from "@/types/style";

import organicImg from "@/assets/styles/organic.jpg";
import industrialImg from "@/assets/styles/industrial.png";
import classicImg from "@/assets/styles/classic.jpg";
import minimalistImg from "@/assets/styles/minimalist.jpg";

export const styles: Style[] = [
  {
    id: "minimalist",
    name: "Minimalist",
    desc: "Clean lines and natural materials",
    promptSnippet: "Minimalist interior focused on clarity, light, and intentional restraint. Emphasize clean lines, balanced proportions, and generous negative space. Decor should be sparse and purposeful — a few well-chosen objects rather than many. The atmosphere should feel airy, quiet, and composed, where nothing feels excessive or accidental. Inspiration: Scandinavian minimalism, Japandi calm, and art-led modern interiors seen in Cereal, Kinfolk, RUM."
  },
  {
    id: "organic",
    name: "Organic",
    desc: "Beauty in imperfection",
    promptSnippet: "Organic minimalist interior, a synthesis of Japanese Wabi-Sabi, Modern Scandinavian, Organic Minimalism, and creates a modern, tranquil atmosphere. Avoid rustic or heavy elements — keep the mood elevated, airy, and contemporary. Prioritise upholstered furniture. Add some of well chosen items such as vases or other decor elements inspired by Japanese aesthetics. Inspiration: Japandi interiors featured in Kinfolk, Cereal, and Sight Unseen."
  },
  {
    id: "classic",
    name: "Classic",
    desc: "Timeless sophistication",
    promptSnippet: "Refined old-money interior that blends classical principles with contemporary restraint. Focus on symmetry, proportion, and architectural clarity, paired with modern, sculptural furniture. Decorative elements may reference heritage (mouldings, framed art, tailored details), but always simplified and never ornate. The mood should feel calm, confident, and enduring rather than trendy. Everything appears curated, balanced, and quietly luxurious. Inspiration: modern Parisian interiors featured in Architectural Digest, Elle Decoration, Cereal."
  },
  {
    id: "industrial",
    name: "Industrial",
    desc: "Bold & raw",
    promptSnippet: "Urban-industrial interior that highlights structure, material honesty, and contrast. Use elements such as exposed concrete, plaster, steel, stone, and dark or natural wood, balanced with clean-lined modern furniture. Surfaces may feel raw, but the overall composition remains intentional and refined. Introduce contrast through light and shadow rather than decoration. Avoid clutter and excessive ornamentation; instead, add interest through architectural forms, sculptural lighting, or a single bold material moment. The atmosphere should feel strong, contemporary, and livable, inspired by modern brutalism and European industrial minimalism seen in Cereal, Kinfolk, RUM."
  },
];

export const styleImages: Record<string, string> = {
  "organic": organicImg,
  "industrial": industrialImg,
  "classic": classicImg,
  "minimalist": minimalistImg,
};

export const getStyleById = (id: string): Style | undefined => {
  return styles.find(style => style.id === id);
};

export const getStyleImage = (id: string): string | undefined => {
  return styleImages[id];
};
