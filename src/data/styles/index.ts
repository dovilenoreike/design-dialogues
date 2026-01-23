import type { Style } from "@/types/style";

import japandiImg from "@/assets/styles/japandi.jpg";
import artInspiredModernismImg from "@/assets/styles/art-inspired-modernism.jpg";
import modernBrutalismImg from "@/assets/styles/modern-brutalism.png";
import quietLuxuryImg from "@/assets/styles/quiet-luxury.jpg";

import classicModernImg from "@/assets/styles/classic-modern.jpg";
import scandinavianMinimalismImg from "@/assets/styles/scandinavian-minimalism.jpg";

export const styles: Style[] = [
  {
    id: "scandinavian-minimalism",
    name: "Scandinavian",
    desc: "Clean lines and natural materials",
    promptSnippet: "Minimalist interior focused on clarity, light, and intentional restraint. Emphasize clean lines, balanced proportions, and generous negative space. Decor should be sparse and purposeful — a few well-chosen objects rather than many. The atmosphere should feel airy, quiet, and composed, where nothing feels excessive or accidental. Inspiration: Scandinavian minimalism, Japandi calm, and art-led modern interiors seen in Cereal, Kinfolk, RUM."
  },
  {
    id: "japandi",
    name: "Japandi",
    desc: "Beuty in imperfection",
    promptSnippet: "Organic minimalist interior, a synthesis of Japanese Wabi-Sabi, Modern Scandinavian, Organic Minimalism, and creates a modern, tranquil atmosphere. Avoid rustic or heavy elements — keep the mood elevated, airy, and contemporary. Prioritise upholstered furniture. Add some of well chosen items such as vases or other decor elements inspired by Japanese aesthetics. Inspiration: Japandi interiors featured in Kinfolk, Cereal, and Sight Unseen."
  },
  {
    id: "classic-modern",
    name: "Classic Modern",
    desc: "Timeless sophistication",
    promptSnippet: "Refined old-money interior that blends classical principles with contemporary restraint. Focus on symmetry, proportion, and architectural clarity, paired with modern, sculptural furniture. Decorative elements may reference heritage (mouldings, framed art, tailored details), but always simplified and never ornate. The mood should feel calm, confident, and enduring rather than trendy. Everything appears curated, balanced, and quietly luxurious. Inspiration: modern Parisian interiors featured in Architectural Digest, Elle Decoration, Cereal."
  },
  {
    id: "modern-brutalism",
    name: "Modern Brutalism",
    desc: "Bold & raw",
    promptSnippet: "Urban-industrial interior that highlights structure, material honesty, and contrast. Use elements such as exposed concrete, plaster, steel, stone, and dark or natural wood, balanced with clean-lined modern furniture. Surfaces may feel raw, but the overall composition remains intentional and refined. Introduce contrast through light and shadow rather than decoration. Avoid clutter and excessive ornamentation; instead, add interest through architectural forms, sculptural lighting, or a single bold material moment. The atmosphere should feel strong, contemporary, and livable, inspired by modern brutalism and European industrial minimalism seen in Cereal, Kinfolk, RUM."
  },
  {
    id: "art-inspired-modernism",
    name: "Art-Inspired Modernism",
    desc: "Art meets function",
    promptSnippet: "Art-Inspired Modernism. Take inspiration from interiors where art or photography quietly defines the atmosphere. Sculptural forms and geometric lines bring structure, while subtle textures ensure calm restraint. Each piece feels curated and intentional, creating balance between simplicity and expression. Materials such as matte metals, stone, and natural fabrics highlight clean proportions without excess. Look at magazines Cereal, Kinfolk, and Sight Unseen for refined examples."
  },

  {
    id: "quiet-luxury",
    name: "Quiet Luxury",
    desc: "Understated elegance",
    promptSnippet: "Take inspiration from Quiet Luxury interiors that radiate understated elegance through quality and restraint. Focus on timeless materials — fine woods, natural stone, soft wool, cashmere, and linen — paired with impeccable craftsmanship and tailored detailing. Prioritize balance, proportion, and generous negative space to create calm sophistication. Allow each piece to feel curated and intentional rather than excessive. Look at magazines Cereal, Kinfolk, Elle Decoration, and RUM for good examples."
  },

];

export const styleImages: Record<string, string> = {
  "japandi": japandiImg,
  "art-inspired-modernism": artInspiredModernismImg,
  "modern-brutalism": modernBrutalismImg,
  "quiet-luxury": quietLuxuryImg,
  "classic-modern": classicModernImg,
  "scandinavian-minimalism": scandinavianMinimalismImg,
};

export const getStyleById = (id: string): Style | undefined => {
  return styles.find(style => style.id === id);
};

export const getStyleImage = (id: string): string | undefined => {
  return styleImages[id];
};
