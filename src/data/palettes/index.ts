import type { Palette } from "@/types/palette";

import fogInTheForest from "./fog-in-the-forest.json";
import behindTheLights from "./behind-the-lights.json";
import chocolateWabiSabi from "./chocolate-wabi-sabi.json";
import morningMist from "./morning-mist.json";
import dayByTheSea from "./day-by-the-sea.json";
import caramelMorning from "./caramel-morning.json";
import sleepingEarth from "./sleeping-earth.json";
import urbanDusk from "./urban-dusk.json";
import pureScandi from "./pure-scandi.json";
import spicyNord from "./spicy-nord.json";

export const palettes: Palette[] = [
  fogInTheForest as Palette,
  caramelMorning as Palette,
  behindTheLights as Palette,
  chocolateWabiSabi as Palette,
  morningMist as Palette,
  dayByTheSea as Palette,
  sleepingEarth as Palette,
  urbanDusk as Palette,
  pureScandi as Palette,
  spicyNord as Palette,
];

export function getPaletteById(id: string): Palette | undefined {
  return palettes.find((p) => p.id === id);
}

export function getPaletteByName(name: string): Palette | undefined {
  return palettes.find((p) => p.name === name);
}

export function isComingSoon(paletteId: string): boolean {
  const palette = getPaletteById(paletteId);
  return palette?.status === "coming-soon";
}

export { fogInTheForest, behindTheLights, chocolateWabiSabi, morningMist, dayByTheSea, caramelMorning, sleepingEarth, urbanDusk, pureScandi };
