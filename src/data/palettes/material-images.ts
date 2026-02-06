// Centralized material image imports for each palette

// Fog in the Forest
import fogMaterial1 from "@/assets/materials/fog-in-the-forest/material1.jpg";
import fogMaterial2 from "@/assets/materials/fog-in-the-forest/material2.jpg";
import fogMaterial3 from "@/assets/materials/fog-in-the-forest/material3.jpg";
import fogMaterial4 from "@/assets/materials/fog-in-the-forest/material4.jpg";
import fogMaterial5 from "@/assets/materials/fog-in-the-forest/material5.jpg";

// Behind the Lights
import behindMaterial1 from "@/assets/materials/behind-the-lights/material1.jpg";
import behindMaterial2 from "@/assets/materials/behind-the-lights/material2.jpg";
import behindMaterial3 from "@/assets/materials/behind-the-lights/material3.jpg";
import behindMaterial4 from "@/assets/materials/behind-the-lights/material4.jpg";
import behindMaterial5 from "@/assets/materials/behind-the-lights/material5.jpg";

// Chocolate Wabi-Sabi
import chocolateMaterial1 from "@/assets/materials/chocolate-wabi-sabi/material1.jpg";
import chocolateMaterial2 from "@/assets/materials/chocolate-wabi-sabi/material2.jpg";
import chocolateMaterial3 from "@/assets/materials/chocolate-wabi-sabi/material3.jpg";
import chocolateMaterial4 from "@/assets/materials/chocolate-wabi-sabi/material4.jpg";
import chocolateMaterial5 from "@/assets/materials/chocolate-wabi-sabi/material5.jpg";

// Morning Mist
import morningMaterial1 from "@/assets/materials/morning-mist/material1.jpg";
import morningMaterial2 from "@/assets/materials/morning-mist/material2.jpg";
import morningMaterial3 from "@/assets/materials/morning-mist/material3.jpg";
import morningMaterial4 from "@/assets/materials/morning-mist/material4.jpg";
import morningMaterial5 from "@/assets/materials/morning-mist/material5.jpg";

// Day by the Sea
import seaMaterial1 from "@/assets/materials/day-by-the-sea/material1.jpg";
import seaMaterial2 from "@/assets/materials/day-by-the-sea/material2.jpg";
import seaMaterial3 from "@/assets/materials/day-by-the-sea/material3.jpg";
import seaMaterial4 from "@/assets/materials/day-by-the-sea/material4.jpg";
import seaMaterial5 from "@/assets/materials/day-by-the-sea/material5.jpg";

// Caramel Morning
import caramelMaterial1 from "@/assets/materials/caramel-morning/material1.jpg";
import caramelMaterial2 from "@/assets/materials/caramel-morning/material2.jpg";
import caramelMaterial3 from "@/assets/materials/caramel-morning/material3.jpg";
import caramelMaterial4 from "@/assets/materials/caramel-morning/material4.jpg";
import caramelMaterial5 from "@/assets/materials/caramel-morning/material5.jpg";

/**
 * Map of palette IDs to their first 5 material images
 */
export const paletteMaterialImages: Record<string, string[]> = {
  "fog-in-the-forest": [fogMaterial1, fogMaterial2, fogMaterial3, fogMaterial4, fogMaterial5],
  "behind-the-lights": [behindMaterial1, behindMaterial2, behindMaterial3, behindMaterial4, behindMaterial5],
  "chocolate-wabi-sabi": [chocolateMaterial1, chocolateMaterial2, chocolateMaterial3, chocolateMaterial4, chocolateMaterial5],
  "morning-mist": [morningMaterial1, morningMaterial2, morningMaterial3, morningMaterial4, morningMaterial5],
  "day-by-the-sea": [seaMaterial1, seaMaterial2, seaMaterial3, seaMaterial4, seaMaterial5],
  "caramel-morning": [caramelMaterial1, caramelMaterial2, caramelMaterial3, caramelMaterial4, caramelMaterial5],
};

/**
 * Get material images for a palette by ID
 */
export function getPaletteMaterialImages(paletteId: string): string[] {
  return paletteMaterialImages[paletteId] || [];
}
