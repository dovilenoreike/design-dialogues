import type { Style } from "@/types/style";

import japandiImg from "@/assets/styles/japandi.jpg";
import artInspiredModernismImg from "@/assets/styles/art-inspired-modernism.jpg";
import modernBrutalismImg from "@/assets/styles/modern-brutalism.png";
import quietLuxuryImg from "@/assets/styles/quiet-luxury.jpg";
import classicModernImg from "@/assets/styles/classic-modern.jpg";
import scandinavianMinimalismImg from "@/assets/styles/scandinavian-minimalism.jpg";

export const styles: Style[] = [
  { 
    id: "japandi",
    name: "Japandi", 
    desc: "Beuty in imperfection",
    promptSnippet: "Take inspiration from Japanese Wabi-Sabi interiors and create a modern, tranquil atmosphere with imperfect textures. Use organic materials like stone, raw wood, handmade ceramics, large vases, branches, paper lamps, and linen. Let asymmetry and emptiness speak — focus on restraint, simplicity, and presence.  Avoid rustic or heavy elements — keep the mood elevated, airy, and contemporary. References: Kinfolk, Cereal Magazine, Casa BRUTUS."
  },
  { 
    id: "art-inspired-modernism",
    name: "Art-Inspired Modernism", 
    desc: "Art meets function",
    promptSnippet: "Art-Inspired Modernism. Take inspiration from interiors where art or photography quietly defines the atmosphere. Sculptural forms and geometric lines bring structure, while subtle textures ensure calm restraint. Each piece feels curated and intentional, creating balance between simplicity and expression. Materials such as matte metals, stone, and natural fabrics highlight clean proportions without excess. Look at magazines Cereal, Kinfolk, and Sight Unseen for refined examples."
  },
  { 
    id: "modern-brutalism",
    name: "Modern Brutalism", 
    desc: "Bold & raw",
    promptSnippet: "Take inspiration from modern brutalism. Use some elements of exposed concrete, plaster, stone, metal, and wood. Use concrete carefully, not overdoing. Use different shades of light and darker materials to give contrast and interest to the space.  Include clean-lined, modern furniture. Avoid decorative clutter, but incorporate thoughtful touches like a sculptural lighting, or greenery to make the space feel livable. Inspired by RUM Magazine, Openhouse, and Belgian or Italian minimalism."
  },
  { 
    id: "quiet-luxury",
    name: "Quiet Luxury", 
    desc: "Understated elegance",
    promptSnippet: "Take inspiration from Quiet Luxury interiors that radiate understated elegance through quality and restraint. Focus on timeless materials — fine woods, natural stone, soft wool, cashmere, and linen — paired with impeccable craftsmanship and tailored detailing. Prioritize balance, proportion, and generous negative space to create calm sophistication. Allow each piece to feel curated and intentional rather than excessive. Look at magazines Cereal, Kinfolk, Elle Decoration, and RUM for good examples."
  },
  { 
    id: "classic-modern",
    name: "Classic Modern", 
    desc: "Timeless sophistication",
    promptSnippet: "Take inspiration from classic design, but reinterpret it with a modern sensibility. Focus on timeless elegance expressed through symmetry, refined materials, and sculptural yet contemporary furniture. Use soft fabrics, and layered lighting. Architectural details like wall mouldings or framed art can appear, but in a clean, simplified form rather than ornate reproductions. Choose lighting and accessories that reference heritage without feeling antique. The atmosphere should reflect calm luxury, graceful proportions, and quiet prestige, as seen in updated classic interiors featured in Architectural Digest and Elle Decoration."
  },
  { 
    id: "scandinavian-minimalism",
    name: "Scandinavian", 
    desc: "Clean lines and natural materials",
    promptSnippet: "Take inspiration from Scandinavian-style interior with a calm, airy atmosphere. Use natural textures such as wool throws, linen curtains, and matte ceramics. Emphasize clean lines, natural light, and cozy simplicity. Avoid bold patterns or saturated colors, unless user prefer otherwise. Focus on warmth, harmony, and space to breathe. Look at magazines RUM, Bo Bedre, Sköna Hem for good examples."
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
