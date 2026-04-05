/**
 * Material generation utilities — builds prompts and loads images from materialOverrides.
 */
import { getMaterialByCode } from "@/hooks/useGraphMaterials";
import { surfaces } from "@/data/rooms/surfaces";

export interface MaterialImageWithMeta {
  base64: string;
  slotKey: string;
  matId: string;
  purpose: string;
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
    const desc = mat.description?.en || mat.texturePrompt || matId;
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
  const items: { matId: string; purpose: string }[] = [];

  for (const [slotKey, matId] of Object.entries(overrides)) {
    if (excludedSlots?.has(slotKey)) continue;
    const slotDef = surfaces[slotKey];
    if (!slotDef) continue;

    items.push({ matId, slotKey, purpose: slotDef.label });
  }

  const promises = items.map(async ({ matId, slotKey, purpose }) => {
    const mat = getMaterialByCode(matId);
    if (!mat?.imageUrl) return null;

    try {
      const response = await fetch(mat.imageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const desc = mat.description?.en || mat.texturePrompt || "";

      return { base64, slotKey, matId, purpose, description: desc, texturePrompt: mat.texturePrompt ?? "" };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is MaterialImageWithMeta => r !== null);
}
