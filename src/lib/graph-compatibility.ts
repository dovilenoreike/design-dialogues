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

// Canonical pair key — always lower code first
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

export function isCompatibleWithAll(
  candidateCode: string,
  selectedCodes: string[],
  pairs: Set<string>,
): boolean {
  return selectedCodes.every((sel) => sel === candidateCode || pairs.has(pairKey(candidateCode, sel)));
}

export function getCompatibleCandidates(
  selectedCodes: string[],
  allMaterials: GraphMaterial[],
  pairs: Set<string>,
  targetRole?: string,
): GraphMaterial[] {
  const threshold = Math.min(2, selectedCodes.length);
  return allMaterials.filter((m) => {
    if (selectedCodes.includes(m.technicalCode)) return false;
    if (targetRole && !m.role.includes(targetRole)) return false;
    return countCompatible(m.technicalCode, selectedCodes, pairs) >= threshold;
  });
}

export function countCompatible(
  candidateCode: string,
  selectedCodes: string[],
  pairs: Set<string>,
): number {
  return selectedCodes.filter((sel) => sel === candidateCode || pairs.has(pairKey(candidateCode, sel))).length;
}

export function weightedScore(
  candidateCode: string,
  selectedCodes: string[],
  pairWeights: Map<string, number>,
): number {
  return selectedCodes.reduce((sum, sel) => {
    const key = pairKey(candidateCode, sel);
    return sum + (pairWeights.get(key) ?? 0);
  }, 0);
}

/** Average descriptor similarity of a candidate against a set of already-selected materials.
 *  Higher = closer match. Uses the v2 formula: lightness, warmth, chroma weighted axes. */
export function descriptorScore(
  candidate: GraphMaterial,
  others: GraphMaterial[],
): number {
  if (others.length === 0) return 0;
  return others.reduce((sum, o) =>
    sum + (100
      - 0.5 * Math.abs(candidate.lightness - o.lightness)
      - 1.2 * Math.abs((candidate.warmth ?? 0) - (o.warmth ?? 0)) * 50
      - 0.5 * Math.abs((candidate.chroma  ?? 0) - (o.chroma  ?? 0))
    ), 0) / others.length;
}

export function rankByCompatibility(
  candidates: GraphMaterial[],
  selectedCodes: string[],
  pairs: Set<string>,
  pairWeights?: Map<string, number>,
  byCode?: Map<string, GraphMaterial>,
): GraphMaterial[] {
  const others = byCode
    ? selectedCodes.map(c => byCode.get(c)).filter((m): m is GraphMaterial => !!m)
    : [];
  return [...candidates].sort((a, b) => {
    const wa = pairWeights
      ? weightedScore(a.technicalCode, selectedCodes, pairWeights)
      : selectedCodes.filter((s) => pairs.has(pairKey(a.technicalCode, s))).length;
    const wb = pairWeights
      ? weightedScore(b.technicalCode, selectedCodes, pairWeights)
      : selectedCodes.filter((s) => pairs.has(pairKey(b.technicalCode, s))).length;
    if (wa !== wb) return wb - wa;
    if (others.length > 0) return descriptorScore(b, others) - descriptorScore(a, others);
    return 0;
  });
}

