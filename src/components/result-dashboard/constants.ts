/**
 * ResultDashboard constants - material images and fallback data
 */

// Import fog-in-the-forest material images (only palette with images currently)
import fogMaterial1 from "@/assets/materials/fog-in-the-forest/material1.jpg";
import fogMaterial2 from "@/assets/materials/fog-in-the-forest/material2.jpg";
import fogMaterial3 from "@/assets/materials/fog-in-the-forest/material3.jpg";
import fogMaterial4 from "@/assets/materials/fog-in-the-forest/material4.jpg";
import fogMaterial5 from "@/assets/materials/fog-in-the-forest/material5.jpg";
import fogMaterial6 from "@/assets/materials/fog-in-the-forest/material6.jpg";
import fogMaterial7 from "@/assets/materials/fog-in-the-forest/material7.jpg";
import fogMaterial8 from "@/assets/materials/fog-in-the-forest/material8.jpg";

/**
 * Map material keys to imported images for fog-in-the-forest
 */
export const fogMaterialImages: Record<string, string> = {
  material1: fogMaterial1,
  material2: fogMaterial2,
  material3: fogMaterial3,
  material4: fogMaterial4,
  material5: fogMaterial5,
  material6: fogMaterial6,
  material7: fogMaterial7,
  material8: fogMaterial8,
};

/**
 * Material display names for fog-in-the-forest palette
 */
export const fogMaterialNames: Record<string, string> = {
  material1: "Chevron Oak",
  material2: "Dark Marble",
  material3: "Sage Matte",
  material4: "Stone Grey",
  material5: "Matte Nickel",
  material6: "Soft White",
  material7: "Walnut Grain",
  material8: "Ribbed Glass",
};

/**
 * Fallback materials if no palette selected or palette has no images
 */
export const defaultMaterials = [
  {
    swatchColors: ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100", "bg-neutral-400"],
    title: "Engineered Wood",
    category: "Oak Finish",
  },
  {
    swatchColors: ["bg-gray-200", "bg-gray-300", "bg-gray-100", "bg-gray-400"],
    title: "Painted MDF",
    category: "Matte White",
  },
  {
    swatchColors: ["bg-zinc-300", "bg-zinc-400", "bg-zinc-200", "bg-zinc-500"],
    title: "LED System",
    category: "Dimmable Track",
  },
  {
    swatchColors: ["bg-neutral-200", "bg-neutral-300", "bg-neutral-100", "bg-neutral-400"],
    title: "Wall Panels",
    category: "Textured Finish",
  },
];
