export interface GraphMaterial {
  id: string;           // UUID
  technicalCode: string;
  role: string[];
  texture: string;
  lightness: number;
  warmth: number;
  pattern: number;
  chroma: number;
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

export function countCompatible(
  candidateUuid: string,
  selectedUuids: string[],
  pairs: Set<string>,
): number {
  return selectedUuids.filter((sel) => pairs.has(pairKey(candidateUuid, sel))).length;
}

export function weightedScore(
  candidateUuid: string,
  selectedUuids: string[],
  pairWeights: Map<string, number>,
): number {
  return selectedUuids.reduce((sum, sel) => {
    const key = pairKey(candidateUuid, sel);
    return sum + (pairWeights.get(key) ?? 0);
  }, 0);
}

export function rankByCompatibility(
  candidates: GraphMaterial[],
  selectedUuids: string[],
  pairs: Set<string>,
  pairWeights?: Map<string, number>,
): GraphMaterial[] {
  return [...candidates].sort((a, b) => {
    const scoreA = pairWeights
      ? weightedScore(a.id, selectedUuids, pairWeights)
      : selectedUuids.filter((s) => pairs.has(pairKey(a.id, s))).length;
    const scoreB = pairWeights
      ? weightedScore(b.id, selectedUuids, pairWeights)
      : selectedUuids.filter((s) => pairs.has(pairKey(b.id, s))).length;
    return scoreB - scoreA;
  });
}

