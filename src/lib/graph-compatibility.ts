export interface GraphMaterial {
  id: string;           // UUID
  technicalCode: string;
  role: string[];
  texture: string;
  lightness: number;
  warmth: number;
  pattern: number;
  chroma: number;
  hue_angle: number | null;  // 0–360°, null for achromatic materials
  archetypeId: string | null;
}

export function isSimilarLightness(a: number, b: number, threshold = 20): boolean {
  return Math.abs(a - b) <= threshold;
}

export function isSimilarMaterial(
  a: GraphMaterial, b: GraphMaterial,
  { lightnessΔ = 20, warmthΔ = 0.4, patternΔ = 25, chromaΔ = 15 } = {}
): boolean {
  return (
    Math.abs(a.lightness - b.lightness) <= lightnessΔ &&
    Math.abs(a.warmth   - b.warmth)    <= warmthΔ    &&
    Math.abs(a.pattern  - b.pattern)   <= patternΔ   &&
    Math.abs(a.chroma   - b.chroma)    <= chromaΔ
  );
}

// Normalized distance across visual dimensions — lower means more similar.
// Each axis is divided by its threshold so all axes contribute equally (1.0 = at boundary).
export function visualDistance(
  a: GraphMaterial, b: GraphMaterial,
  { lightnessΔ = 20, warmthΔ = 0.4, patternΔ = 25, chromaΔ = 15 } = {}
): number {
  return (
    Math.abs(a.lightness - b.lightness) / lightnessΔ +
    Math.abs(a.warmth   - b.warmth)    / warmthΔ    +
    Math.abs(a.pattern  - b.pattern)   / patternΔ   +
    Math.abs(a.chroma   - b.chroma)    / chromaΔ
  );
}

// Circular hue distance on 0–360° wheel. Returns null if either material is achromatic.
export function hueDistance(a: GraphMaterial, b: GraphMaterial): number | null {
  if (a.hue_angle == null || b.hue_angle == null) return null;
  const d = Math.abs(a.hue_angle - b.hue_angle);
  return Math.min(d, 360 - d);
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
  const threshold = Math.min(2, selectedUuids.length);
  return allMaterials.filter((m) => {
    if (selectedUuids.includes(m.id)) return false;
    if (targetRole && !m.role.includes(targetRole)) return false;
    return countCompatible(m.id, selectedUuids, pairs) >= threshold;
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

