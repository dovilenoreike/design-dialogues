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
    name: "Contemporary Luxury", 
    desc: "Bold statements",
    promptSnippet: "rich materials, dramatic lighting, sculptural furniture, layered textures, metallic accents, statement art pieces"
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
