import { architectureImages } from "@/data/architectures";

export interface StyleConfig {
  architecture: string;
  atmosphere: string | null;
}

export interface Style {
  id: string;
  name: string;
  config: StyleConfig;
}

export const styles: Style[] = [
  {
    id: "scandinavian-minimalism",
    name: "Scandinavian Minimalism",
    config: { architecture: "minimalist", atmosphere: "scandi" },
  },
  {
    id: "quiet-luxury",
    name: "Quiet Luxury",
    config: { architecture: "minimalist", atmosphere: "quiet-luxury" },
  },
  {
    id: "art-inspired-modernism",
    name: "Art-Inspired Modernism",
    config: { architecture: "minimalist", atmosphere: "the-curator" },
  },
  {
    id: "japandi",
    name: "Japandi",
    config: { architecture: "organic", atmosphere: "japandi" },
  },
  {
    id: "modern-classic",
    name: "Modern Classic",
    config: { architecture: "classic", atmosphere: "contemporary" },
  },
  {
    id: "soft-industrial",
    name: "Soft Industrial",
    config: { architecture: "industrial", atmosphere: "chiaroscuro" },
  },
];

export const getStyleById = (id: string): Style | undefined => {
  return styles.find((style) => style.id === id);
};

// Get image for a style (uses architecture image as fallback)
export const getStyleImage = (id: string): string | undefined => {
  const style = getStyleById(id);
  if (!style) return undefined;
  return architectureImages[style.config.architecture];
};
