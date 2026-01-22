import type { DesignerProfile } from "@/types/palette";

const ALL_STYLES = [
  "scandinavian-minimalism",
  "japandi",
  "art-inspired-modernism",
  "modern-brutalism",
  "quiet-luxury",
  "classic-modern",
];

export const designers: Record<string, DesignerProfile> = {
  "Sigita Kulikajeva": {
    name: "Sigita Kulikajeva",
    title: "Interior Architect",
    bio: "Award-winning interior architect specializing in contemporary residential design. With over 15 years of experience, I create spaces that balance functionality with timeless aesthetics, drawing inspiration from natural materials and Scandinavian minimalism.",
    styles: [ "scandinavian-minimalism", "japandi", "art-inspired-modernism", "modern-brutalism", "quiet-luxury",],
    email: "hello@sigitadesign.com",
    instagram: "sigita.design",
    website: "https://sigitadesign.com",
  },
  "Athena Blackbird": {
    name: "Athena Blackbird",
    title: "Interior Architect",
    bio: "I strive to design spaces that feel elevated, are functional and remain timeless - thus creating exceptional living experiences",
    styles: ALL_STYLES,
    email: "athenablackbird@gmail.com",
    instagram: "athenablackbird",
    website: "https://athenablackbird.com",
  },
};

export function getDesignerByName(name: string): DesignerProfile | undefined {
  return designers[name];
}

export function getDesignerWithFallback(name: string, title: string): DesignerProfile {
  return designers[name] || {
    name,
    title,
    bio: "Interior designer passionate about creating beautiful, functional spaces.",
    styles: ALL_STYLES,
  };
}
