export interface Atmosphere {
  id: string;
  name: string;
  promptSnippet: string;
}

export const atmospheres: Atmosphere[] = [
  {
    id: "none",
    name: "None",
    promptSnippet: "",
  },
  {
    id: "scandi",
    name: "Scandi",
    promptSnippet: "candinavian-style interior with a calm, airy atmosphere. Use natural textures such as wool throws, linen curtains, and matte ceramics. Emphasize clean lines, natural light, and cozy simplicity. Avoid bold patterns or saturated colors, unless user prefer otherwise. Focus on warmth, harmony, and space to breathe. Look at magazines RUM, Bo Bedre, Sköna Hem for good examples.",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    promptSnippet: "The atmosphere should feel airy, quiet, and composed, where nothing feels excessive or accidental. Decor should be sparse and purposeful — a few well-chosen objects rather than many. Inspiration: Scandinavian minimalism, Japandi calm, and art-led modern interiors seen in Cereal, Kinfolk, RUM.",
  },
  {
    id: "contemporary",
    name: "Contemporary",
    promptSnippet: "Contemporary atmosphere: Modern furniture and lighting with a sense of current sophistication. references: Architectural Digest, Elle Decoration, Cereal.",
  },
  {
    id: "japandi",
    name: "Japandi",
    promptSnippet: "Japandi decor details: Add some of well chosen items such as vases or other decor elements inspired by Japanese aesthetics. Consider handcrafted ceramics, vases, branches, lighting elements. Inspiration: Interiors featured in Kinfolk, Cereal, and Sight Unseen.",
  },
  {
    id: "the-curator",
    name: "The Curator",
    promptSnippet: "Art, light and books led atmosphere: art pieces, books and sculptural light accents. References: art-led modern interiors seen in Cereal, Kinfolk, RUM.",
  },
  {
    id: "chiaroscuro",
    name: "Chiaroscuro",
    promptSnippet: "Let the sculptural lighting be the main accents. Inspiration: Cereal, Kinfolk, RUM, Cereal.",
  },
  {
    id: "bauhaus",
    name: "Bauhaus",
    promptSnippet: "Infuse with Bauhaus atmosphere: bold primary color accents, geometric forms, functional beauty. Furniture and objects reference modernist design principles with graphic clarity.",
  },
    {
    id: "quiet-luxury",
    name: "Quiet Luxury",
    promptSnippet: "Quiet luxurious atmosphere. Use a muted, refined color palette decor details with rich textures like velvet, silk, and polished wood. Emphasize elegant, understated decor and art pieces that exude timeless sophistication. Inspiration: high-end interiors featured in Architectural Digest, Elle Decoration.",
  },
];

export const getAtmosphereById = (id: string): Atmosphere | undefined => {
  return atmospheres.find((a) => a.id === id);
};
