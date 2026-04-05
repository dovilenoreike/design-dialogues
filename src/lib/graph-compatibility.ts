export interface GraphMaterial {
  id: string;           // UUID
  technicalCode: string;
  role: string[];
  texture: string;
  lightness: number;
  warmth: number;
  pattern: number;
  archetypeId: string | null;
}

export function isSimilarLightness(a: number, b: number, threshold = 20): boolean {
  return Math.abs(a - b) <= threshold;
}

// Canonical pair key — always lower UUID first
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

export function isCompatibleWithAll(
  candidateUuid: string,
  selectedUuids: string[],
  pairs: Set<string>,
): boolean {
  return selectedUuids.every((sel) => pairs.has(pairKey(candidateUuid, sel)));
}

export function getCompatibleCandidates(
  selectedUuids: string[],
  allMaterials: GraphMaterial[],
  pairs: Set<string>,
  targetRole?: string,
): GraphMaterial[] {
  return allMaterials.filter((m) => {
    if (selectedUuids.includes(m.id)) return false;
    if (targetRole && !m.role.includes(targetRole)) return false;
    return isCompatibleWithAll(m.id, selectedUuids, pairs);
  });
}

export function rankByCompatibility(
  candidates: GraphMaterial[],
  selectedUuids: string[],
  pairs: Set<string>,
): GraphMaterial[] {
  return [...candidates].sort((a, b) => {
    const scoreA = selectedUuids.filter((s) => pairs.has(pairKey(a.id, s))).length;
    const scoreB = selectedUuids.filter((s) => pairs.has(pairKey(b.id, s))).length;
    return scoreB - scoreA;
  });
}

