import type { Palette } from "@/types/palette";

import fogInTheForest from "./fog-in-the-forest.json";
import behindTheLights from "./behind-the-lights.json";
import chocolateWabiSabi from "./chocolate-wabi-sabi.json";
import morningForest from "./morning-forest.json";

export const palettes: Palette[] = [
  fogInTheForest as Palette,
  behindTheLights as Palette,
  chocolateWabiSabi as Palette,
  morningForest as Palette,
];

export function getPaletteById(id: string): Palette | undefined {
  return palettes.find((p) => p.id === id);
}

export function getPaletteByName(name: string): Palette | undefined {
  return palettes.find((p) => p.name === name);
}

export { fogInTheForest, behindTheLights, chocolateWabiSabi, morningForest };
