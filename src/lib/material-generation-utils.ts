/**
 * Material generation utilities — builds prompts and loads images from materialOverrides.
 */
import { getMaterialByCode } from "@/hooks/useGraphMaterials";
import { surfaces } from "@/data/rooms/surfaces";

export const GEN_DEBUG = true; // set true to log generation prompts/models and material loading to console

export interface MaterialImageWithMeta {
  base64: string;
  slotKey: string;
  matId: string;
  purpose: string;
  category: string;
  description: string;
  texturePrompt: string;
}

/**
 * Build detailed material prompt from materialOverrides (source of truth).
 */
export function buildDetailedMaterialPromptWithOverrides(
  overrides: Record<string, string>,
  palettePromptSnippet: string,
  excludedSlots?: Set<string>,
): string {
  // Group slots by material ID
  const matGroups = new Map<string, string[]>();
  const matOrder: string[] = [];

  for (const [slotKey, matId] of Object.entries(overrides)) {
    if (excludedSlots?.has(slotKey)) continue;
    const slotDef = surfaces[slotKey];
    if (!slotDef) continue;

    const existing = matGroups.get(matId);
    if (existing) {
      existing.push(slotDef.label);
    } else {
      matGroups.set(matId, [slotDef.label]);
      matOrder.push(matId);
    }
  }

  const descriptions: string[] = [];
  for (const matId of matOrder) {
    const mat = getMaterialByCode(matId);
    if (!mat) continue;

    const labels = matGroups.get(matId)!;
    const desc = mat.texturePrompt || matId;
    descriptions.push(`- ${labels.join(", ")}: ${desc}`);
  }

  if (descriptions.length === 0) return palettePromptSnippet;
  return `${palettePromptSnippet}\n\nMaterials specification:\n${descriptions.join("\n")}`;
}

/**
 * Load material images with metadata from materialOverrides (source of truth).
 */
export async function loadMaterialImagesWithOverrides(
  overrides: Record<string, string>,
  excludedSlots?: Set<string>,
): Promise<MaterialImageWithMeta[]> {
  // One entry per slot
  const items: { matId: string; slotKey: string; purpose: string; category: string }[] = [];

  for (const [slotKey, matId] of Object.entries(overrides)) {
    if (excludedSlots?.has(slotKey)) continue;
    const slotDef = surfaces[slotKey];
    if (!slotDef) continue;

    items.push({ matId, slotKey, purpose: slotDef.label, category: slotDef.category });
  }

  const promises = items.map(async ({ matId, slotKey, purpose, category }) => {
    const mat = getMaterialByCode(matId);
    if (!mat) { if (GEN_DEBUG) console.log("[loadMats] skip (not in cache):", slotKey, matId); return null; }
    if (!mat.imageUrl) { if (GEN_DEBUG) console.log("[loadMats] skip (imageUrl null):", slotKey, matId); return null; }

    try {
      const response = await fetch(mat.imageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      return { base64, slotKey, matId, purpose, category, description: mat.texturePrompt || "", texturePrompt: mat.texturePrompt ?? "" };
    } catch (e) {
      if (GEN_DEBUG) console.log("[loadMats] fetch failed:", slotKey, matId, e);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is MaterialImageWithMeta => r !== null);
}
