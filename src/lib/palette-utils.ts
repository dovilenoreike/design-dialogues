/**
 * Palette utilities — now powered by the new material system.
 * Material images come from Material.image (no more path construction).
 */
import { getMaterialById } from "@/data/materials";
import { surfaces } from "@/data/rooms/surfaces";

export interface MaterialImageWithMeta {
  base64: string;
  slotKey: string;
  purpose: string;
  description: string;
  texturePrompt: string;
}

/**
 * Build detailed material prompt from materialOverrides (source of truth).
 * paletteId param is kept for call-site compatibility but no longer used.
 */
export function buildDetailedMaterialPromptWithOverrides(
  _paletteId: string,
  _spaceCategory: string,
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
    const mat = getMaterialById(matId);
    if (!mat) continue;

    const labels = matGroups.get(matId)!;
    const desc = typeof mat.description === "object"
      ? (mat.description as Record<string, string>).en || ""
      : String(mat.description || "");
    descriptions.push(`- ${labels.join(", ")}: ${desc || matId}`);
  }

  if (descriptions.length === 0) return palettePromptSnippet;
  return `${palettePromptSnippet}\n\nMaterials specification:\n${descriptions.join("\n")}`;
}

/**
 * Load material images with metadata from materialOverrides (source of truth).
 * paletteId param is kept for call-site compatibility but no longer used.
 */
export async function loadMaterialImagesWithOverrides(
  _paletteId: string,
  _spaceCategory: string,
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
    const mat = getMaterialById(matId);
    if (!mat?.image) return null;

    try {
      const response = await fetch(mat.image);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const desc = typeof mat.description === "object"
        ? (mat.description as Record<string, string>).en || ""
        : String(mat.description || "");

      return { base64, slotKey, purpose, description: desc, texturePrompt: mat.texturePrompt ?? "" };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is MaterialImageWithMeta => r !== null);
}

