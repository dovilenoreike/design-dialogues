// Centralized palette thumbnail imports
import fogInTheForestImg from "@/assets/materials/fog-in-the-forest.jpg";
import behindTheLightsImg from "@/assets/materials/behind-the-lights.jpg";
import chocolateWabiSabiImg from "@/assets/materials/chocolate-wabi-sabi.jpg";
import morningForestImg from "@/assets/materials/morning-forest.jpg";

/**
 * Map of palette IDs to their thumbnail images
 */
export const paletteThumbnails: Record<string, string> = {
  "fog-in-the-forest": fogInTheForestImg,
  "behind-the-lights": behindTheLightsImg,
  "chocolate-wabi-sabi": chocolateWabiSabiImg,
  "morning-forest": morningForestImg,
};

/**
 * Get the thumbnail image for a palette by ID
 */
export function getPaletteThumbnail(paletteId: string): string | undefined {
  return paletteThumbnails[paletteId];
}
