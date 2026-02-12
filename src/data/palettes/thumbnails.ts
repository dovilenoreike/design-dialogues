// Centralized palette thumbnail imports
import fogInTheForestImg from "@/assets/materials/fog-in-the-forest.jpg";
import behindTheLightsImg from "@/assets/materials/behind-the-lights.jpg";
import chocolateWabiSabiImg from "@/assets/materials/chocolate-wabi-sabi.jpg";
import morningMistImg from "@/assets/materials/morning-mist.jpg";
import dayByTheSeaImg from "@/assets/materials/day-by-the-sea.jpg";
import caramelMorningImg from "@/assets/materials/caramel-morning.jpg";
import sleepingEarthImg from "@/assets/materials/sleeping-earth.jpg";
import urbanDuskImg from "@/assets/materials/urban-dusk.jpg";
import pureScandiImg from "@/assets/materials/pure-scandi.jpg";
import spicyNordImg from "@/assets/materials/spicy-nord.jpg";


/**
 * Map of palette IDs to their thumbnail images
 */
export const paletteThumbnails: Record<string, string> = {
  "fog-in-the-forest": fogInTheForestImg,
  "behind-the-lights": behindTheLightsImg,
  "chocolate-wabi-sabi": chocolateWabiSabiImg,
  "morning-mist": morningMistImg,
  "day-by-the-sea": dayByTheSeaImg,
  "caramel-morning": caramelMorningImg,
  "sleeping-earth": sleepingEarthImg,
  "urban-dusk": urbanDuskImg,
  "pure-scandi": pureScandiImg,
  "spicy-nord": spicyNordImg, // Placeholder until specific thumbnail is created
};

/**
 * Get the thumbnail image for a palette by ID
 */
export function getPaletteThumbnail(paletteId: string): string | undefined {
  return paletteThumbnails[paletteId];
}
