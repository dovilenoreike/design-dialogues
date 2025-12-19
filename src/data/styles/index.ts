import type { Style } from "@/types/style";

import minimalistImg from "@/assets/styles/minimalist.jpg";
import midCenturyImg from "@/assets/styles/mid-century-modern.jpg";
import bauhausImg from "@/assets/styles/bauhaus.png";
import contemporaryLuxuryImg from "@/assets/styles/contemporary-luxury.jpg";

export const styles: Style[] = [
  { 
    id: "minimalist",
    name: "Minimalist", 
    desc: "Less is more",
    promptSnippet: "clean lines, neutral palette, open space, uncluttered surfaces, natural light, subtle textures"
  },
  { 
    id: "mid-century-modern",
    name: "Mid-Century Modern", 
    desc: "Organic curves",
    promptSnippet: "organic shapes, warm wood tones, tapered legs, statement lighting, bold accent colors, retro patterns"
  },
  { 
    id: "bauhaus",
    name: "Bauhaus", 
    desc: "Form follows function",
    promptSnippet: "geometric forms, primary colors, tubular steel, functional design, asymmetric balance, industrial materials"
  },
  { 
    id: "contemporary-luxury",
    name: "Silent Luxury", 
    desc: "Understated elegance",
    promptSnippet: "Take inspiration from Quiet Luxury interiors that radiate understated elegance through quality and restraint. Focus on timeless materials — fine woods, natural stone, soft wool, cashmere, and linen — paired with impeccable craftsmanship and tailored detailing. Prioritize balance, proportion, and generous negative space to create calm sophistication. Allow each piece to feel curated and intentional rather than excessive. Look at magazines Cereal, Kinfolk, Elle Decoration, and RUM for good examples."
  },
];

export const styleImages: Record<string, string> = {
  "minimalist": minimalistImg,
  "mid-century-modern": midCenturyImg,
  "bauhaus": bauhausImg,
  "contemporary-luxury": contemporaryLuxuryImg,
};

export const getStyleById = (id: string): Style | undefined => {
  return styles.find(style => style.id === id);
};

export const getStyleImage = (id: string): string | undefined => {
  return styleImages[id];
};
