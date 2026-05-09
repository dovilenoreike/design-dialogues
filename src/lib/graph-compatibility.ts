import { BUSY_PATTERN_THRESHOLD } from "@/lib/archetype-rules";

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
 *  Higher = closer match. Axes: lightness, warmth, chroma.
 *  Extra penalty when both candidate and an existing material are busy-pattern — even if
 *  they are approved pairs, two busy surfaces make the palette noisier. On a clean palette
 *  moderate or bold pattern is not penalised. */
export function descriptorScore(
  candidate: GraphMaterial,
  others: GraphMaterial[],
): number {
  if (others.length === 0) return 0;
  return others.reduce((sum, o) => {
    // Wood+wood combinations penalise warmth mismatch more heavily —
    // two woods with similar lightness but different warmth read as clashing.
    const warmthWeight = (candidate.texture === 'wood' && o.texture === 'wood') ? 2.4 : 1.2;
    // Two busy-pattern surfaces together add visual noise even when approved —
    // push cleaner alternatives higher in ranking. Only fires when the palette
    // already has a busy-pattern material — clean palettes are not penalised.
    const busyClashPenalty =
      candidate.pattern > BUSY_PATTERN_THRESHOLD && o.pattern > BUSY_PATTERN_THRESHOLD ? 30 : 0;
    return sum + (100
      - 0.5  * Math.abs(candidate.lightness - o.lightness)
      - warmthWeight * Math.abs((candidate.warmth ?? 0) - (o.warmth ?? 0)) * 50
      - 0.5  * Math.abs((candidate.chroma   ?? 0) - (o.chroma  ?? 0))
      - busyClashPenalty
    );
  }, 0) / others.length;
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
  // Max possible pair weight — used to normalise pair score to [0, 1].
  // Weights are 1.0 (plain), 2.0 (wood/stone + plain), or 3.0 (wood/stone + wood/stone).
  const maxPairW = selectedCodes.length * 3;
  return [...candidates].sort((a, b) => {
    const wa = pairWeights
      ? weightedScore(a.technicalCode, selectedCodes, pairWeights)
      : selectedCodes.filter((s) => pairs.has(pairKey(a.technicalCode, s))).length;
    const wb = pairWeights
      ? weightedScore(b.technicalCode, selectedCodes, pairWeights)
      : selectedCodes.filter((s) => pairs.has(pairKey(b.technicalCode, s))).length;
    if (others.length === 0) return wb - wa;
    // Blend normalised pair score (60 %) + descriptor similarity (40 %) so that
    // visual harmony can pull a cleaner option above one with more pairings.
    const normWa = maxPairW > 0 ? wa / maxPairW : 0;
    const normWb = maxPairW > 0 ? wb / maxPairW : 0;
    const descA = descriptorScore(a, others) / 100;
    const descB = descriptorScore(b, others) / 100;
    const combinedA = normWa * 0.6 + descA * 0.4;
    const combinedB = normWb * 0.6 + descB * 0.4;
    return combinedB - combinedA;
  });
}

