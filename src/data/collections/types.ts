// Layer 1: Vibe Tag — captures mood, narrows the active collection pool.
export type VibeTag = "light-and-airy" | "warm-and-grounded" | "bold-and-moody";

export interface CollectionV2 {
  id: string;
  name: { en: string; lt: string };
  designer: string;
  vibe: VibeTag;
  promptBase: string;
  // Curated specific material codes per slot (technical_code values from Supabase).
  // Collections are presentation presets only — compatibility is handled by the graph.
  defaults: {
    floor?: string;
    mainFronts?: string;
    additionalFronts?: string;
    worktops?: string;
    accents?: string;
    mainTiles?: string;
    additionalTiles?: string;
  };
}
