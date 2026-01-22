// Centralized palette thumbnail imports
import fogInTheForestImg from "@/assets/materials/fog-in-the-forest.jpg";
import behindTheLightsImg from "@/assets/materials/behind-the-lights.jpg";
import chocolateWabiSabiImg from "@/assets/materials/chocolate-wabi-sabi.jpg";
import morningMistImg from "@/assets/materials/morning-mist.jpg";
import dayByTheSeaImg from "@/assets/materials/day-by-the-sea.jpg";

/**
 * Map of palette IDs to their thumbnail images
 */
export const paletteThumbnails: Record<string, string> = {
  "fog-in-the-forest": fogInTheForestImg,
  "behind-the-lights": behindTheLightsImg,
  "chocolate-wabi-sabi": chocolateWabiSabiImg,
  "morning-mist": morningMistImg,
  "day-by-the-sea": dayByTheSeaImg,
};

/**
 * Get the thumbnail image for a palette by ID
 */
export function getPaletteThumbnail(paletteId: string): string | undefined {
  return paletteThumbnails[paletteId];
}
