import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { GraphMaterial, pairKey, getCompatibleCandidates, rankByCompatibility, isCompatibleWithAll, isSimilarMaterial, visualDistance, countCompatible, weightedScore, descriptorScore } from '@/lib/graph-compatibility';
import { paletteScoreV2, rankClusteredCandidates, computeV2Debug, type RankedClusteredEntry } from '@/lib/palette-scoring-v2';
import { deriveArchetypeId, BUSY_PATTERN_THRESHOLD, WOOD_WARMTH_MISMATCH_THRESHOLD } from '@/lib/archetype-rules';

/** Full material record as fetched from Supabase — superset of GraphMaterial. */
export interface SupabaseMaterial extends GraphMaterial {
  name: { en: string; lt: string } | null;
  imageUrl: string | null;
  materialType: string | null;
  tier: 'budget' | 'optimal' | 'premium' | null;
  texturePrompt: string | null;
  showroomIds: string[];
  layoutPattern: string | null;
  clusterId: string | null;
  synonymId: string | null;
}

interface GraphCache {
  graphMaterials: SupabaseMaterial[];
  pairs: Set<string>;
  pairWeights: Map<string, number>;
  pairApprovedBy: Map<string, string>; // pair key → approved_by (real pairs only)
  byCode: Map<string, SupabaseMaterial>;
  pairCountByCode: Map<string, number>;
}

/** Inherited pairings (via synonym_id) receive this fraction of the original weight. */
const SYNONYM_INHERIT_FACTOR = 0.85;

let _cached: GraphCache | null = null;
let _fetchPromise: Promise<GraphCache> | null = null;
let _activeScoringDirection: string | null = null;
export function setActiveScoringDirection(dir: string | null): void { _activeScoringDirection = dir; }

// ─── Image URL cache — survives page reload so first render shows real images ──
const IMAGE_CACHE_KEY = "material-image-cache";
let _imageUrlCache: Map<string, string> = new Map();
try {
  const raw = localStorage.getItem(IMAGE_CACHE_KEY);
  if (raw) _imageUrlCache = new Map(Object.entries(JSON.parse(raw)));
} catch {}

function _updateImageCache(byCode: Map<string, SupabaseMaterial>) {
  const obj: Record<string, string> = {};
  for (const [code, mat] of byCode) {
    if (mat.imageUrl) { obj[code] = mat.imageUrl; _imageUrlCache.set(code, mat.imageUrl); }
  }
  try { localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(obj)); } catch {}
}

async function loadGraphData(): Promise<GraphCache> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [{ data: mats }, { data: pc }] = await Promise.all([
    supabase.from('materials' as any).select(
      'id, technical_code, role, texture, lightness, warmth, pattern, chroma, hue_angle, name, image_url, material_type, tier, showroom_ids, texture_prompt, layout_pattern, cluster_id, synonym_id'
    ),
    supabase.from('pair_compatibility' as any).select('code_a, code_b, weight, approved_by'),
  ]);
  const graphMaterials: SupabaseMaterial[] = (mats ?? []).map((r: any) => ({
    id: r.id,
    technicalCode: r.technical_code,
    role: r.role ?? [],
    texture: r.texture,
    lightness: r.lightness,
    warmth: r.warmth,
    pattern: r.pattern ?? 0,
    chroma: r.chroma ?? 0,
    hue_angle: r.hue_angle ?? null,
    archetypeId: null,
    // extended display fields
    name: r.name ?? null,
    imageUrl: r.image_url ?? null,
    materialType: r.material_type ?? null,
    tier: r.tier ?? null,
    texturePrompt: r.texture_prompt ?? null,
    showroomIds: r.showroom_ids ?? [],
    layoutPattern: r.layout_pattern ?? null,
    clusterId: r.cluster_id ?? null,
    synonymId: r.synonym_id ?? null,
  }));
  graphMaterials.forEach((m) => {
    const primaryRole = m.role[0];
    if (primaryRole) {
      m.archetypeId = deriveArchetypeId(primaryRole, m.texture, m.lightness, m.warmth, m.pattern, m.chroma, m.hue_angle);
    }
  });
  const byCode = new Map(graphMaterials.map((m) => [m.technicalCode, m]));
  const pairs = new Set<string>();
  const pairWeights = new Map<string, number>();
  const pairApprovedBy = new Map<string, string>();
  const pairCountByCode = new Map<string, number>();
  for (const r of (pc ?? [])) {
    const key = pairKey(r.code_a, r.code_b);
    const w: number = r.weight ?? 1.0;
    pairs.add(key);
    pairWeights.set(key, w);
    if (r.approved_by) pairApprovedBy.set(key, r.approved_by);
    pairCountByCode.set(r.code_a, (pairCountByCode.get(r.code_a) ?? 0) + 1);
    pairCountByCode.set(r.code_b, (pairCountByCode.get(r.code_b) ?? 0) + 1);
  }
  // ─── Synonym pair inheritance ──────────────────────────────────────────────
  const synonymMembers = new Map<string, string[]>();
  for (const m of graphMaterials) {
    if (!m.synonymId) continue;
    if (!synonymMembers.has(m.synonymId)) synonymMembers.set(m.synonymId, []);
    synonymMembers.get(m.synonymId)!.push(m.technicalCode);
  }
  const codeToSynonym = new Map<string, string>();
  for (const m of graphMaterials) {
    if (m.synonymId) codeToSynonym.set(m.technicalCode, m.synonymId);
  }
  for (const [key, weight] of [...pairWeights]) {
    const [codeA, codeB] = key.split('::');
    for (const [code, partner] of [[codeA, codeB], [codeB, codeA]]) {
      const synId = codeToSynonym.get(code);
      if (!synId) continue;
      for (const mate of synonymMembers.get(synId) ?? []) {
        if (mate === code) continue;
        const inheritedKey = pairKey(mate, partner);
        if (pairWeights.has(inheritedKey)) continue; // real pair wins
        pairWeights.set(inheritedKey, weight * SYNONYM_INHERIT_FACTOR);
        pairs.add(inheritedKey);
        // pairCountByCode intentionally NOT updated — count reflects real pairings only
      }
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
  _updateImageCache(byCode);
  return { graphMaterials, pairs, pairWeights, pairApprovedBy, byCode, pairCountByCode };
}

// ─── Module-level synchronous lookups (readable once cache is warm) ───────────

/** Returns the full SupabaseMaterial for a technical_code, or undefined if not cached. */
export function getMaterialByCode(code: string): SupabaseMaterial | undefined {
  return _cached?.byCode.get(code);
}

/** Returns the image URL for a material code, using localStorage cache as fallback before graph loads. */
export function getCachedImageUrl(code: string): string | null {
  return _cached?.byCode.get(code)?.imageUrl ?? _imageUrlCache.get(code) ?? null;
}

/** Returns the total number of pair_compatibility entries for a given technical_code. */
export function getPairCountByCode(code: string): number {
  return _cached?.pairCountByCode.get(code) ?? 0;
}

/** Returns the weighted compatibility score of this material against the given otherCodes. */
export function getCompatibilityScore(code: string, otherCodes: string[]): number {
  if (!_cached || otherCodes.length === 0) return 0;
  return weightedScore(code, otherCodes, _cached.pairWeights);
}

/** Context-aware descriptor similarity score for a material against the current selection.
 *  Higher = more similar descriptors. Uses the v2 formula (lightness, warmth, chroma). */
export function getDescriptorScore(code: string, otherCodes: string[]): number {
  if (!_cached || otherCodes.length === 0) return 0;
  const { byCode } = _cached;
  const candidate = byCode.get(code);
  if (!candidate) return 0;
  const others = otherCodes.map(c => byCode.get(c)).filter((m): m is GraphMaterial => !!m);
  return descriptorScore(candidate, others);
}

/** Returns true if this material has an approved pair with every one of the given otherCodes. */
export function matchesAllOtherCodes(code: string, otherCodes: string[]): boolean {
  if (!_cached || otherCodes.length === 0) return false;
  const { pairs } = _cached;
  return otherCodes.every(c => c === code || pairs.has(pairKey(code, c)));
}

/**
 * Returns true if placing this material would trigger the wood-warning triangle.
 * - Same role: any unpaired wood pair warns (no warmth threshold — different woods on the
 *   same surface are always discouraged unless explicitly approved).
 * - Cross-role: only warns when warmth Δ > WOOD_WARMTH_MISMATCH_THRESHOLD and unpaired.
 */
export function wouldTriggerWoodWarning(
  code: string,
  sameRoleCodes: string[],
  otherRoleCodes: string[],
): boolean {
  if (!_cached) return false;
  const { pairs, byCode } = _cached;
  const mat = byCode.get(code);
  if (mat?.texture !== 'wood') return false;
  // Same role — no threshold, just unpaired wood+wood
  if (sameRoleCodes.some(c => {
    if (c === code) return false;
    const other = byCode.get(c);
    return other?.texture === 'wood' && !pairs.has(pairKey(code, c));
  })) return true;
  // Cross-role — warmth threshold applies
  return otherRoleCodes.some(c => {
    if (c === code) return false;
    const other = byCode.get(c);
    if (other?.texture !== 'wood') return false;
    if (pairs.has(pairKey(code, c))) return false;
    return Math.abs((mat.warmth ?? 0) - (other.warmth ?? 0)) > WOOD_WARMTH_MISMATCH_THRESHOLD;
  });
}

/**
 * Returns true if placing this material would create an unapproved busy-pattern clash —
 * i.e. the candidate has pattern > BUSY_PATTERN_THRESHOLD and at least one other code
 * (any role, any texture) also exceeds the threshold with no approved pair between them.
 */
export function wouldTriggerBusyPatternWarning(code: string, allOtherCodes: string[]): boolean {
  if (!_cached || allOtherCodes.length === 0) return false;
  const { pairs, byCode } = _cached;
  const mat = byCode.get(code);
  if ((mat?.pattern ?? 0) <= BUSY_PATTERN_THRESHOLD) return false;
  return allOtherCodes.some(c => {
    if (c === code) return false;
    const other = byCode.get(c);
    return (other?.pattern ?? 0) > BUSY_PATTERN_THRESHOLD && !pairs.has(pairKey(code, c));
  });
}

/**
 * Returns true if any two codes in the palette both have pattern > BUSY_PATTERN_THRESHOLD
 * and have no approved pair between them.
 */
export function hasUnapprovedBusyPatternClash(codes: string[]): boolean {
  if (!_cached || codes.length < 2) return false;
  const { pairs, byCode } = _cached;
  const busy = [...new Set(codes)].filter(c => (byCode.get(c)?.pattern ?? 0) > BUSY_PATTERN_THRESHOLD);
  if (busy.length < 2) return false;
  for (let i = 0; i < busy.length; i++) {
    for (let j = i + 1; j < busy.length; j++) {
      if (!pairs.has(pairKey(busy[i], busy[j]))) return true;
    }
  }
  return false;
}

/**
 * Returns true if any two codes in the palette are both wood, unpaired,
 * and have warmth Δ > WOOD_WARMTH_MISMATCH_THRESHOLD.
 */
export function hasUnapprovedWoodWarmthClash(codes: string[]): boolean {
  if (!_cached || codes.length < 2) return false;
  const { pairs, byCode } = _cached;
  const woods = [...new Set(codes)].filter(c => byCode.get(c)?.texture === 'wood');
  if (woods.length < 2) return false;
  for (let i = 0; i < woods.length; i++) {
    for (let j = i + 1; j < woods.length; j++) {
      const a = byCode.get(woods[i]);
      const b = byCode.get(woods[j]);
      if (!a || !b) continue;
      if (pairs.has(pairKey(woods[i], woods[j]))) continue;
      if (Math.abs((a.warmth ?? 0) - (b.warmth ?? 0)) > WOOD_WARMTH_MISMATCH_THRESHOLD) return true;
    }
  }
  return false;
}

/** Returns paired wood pairs that have a warmth mismatch > threshold — for admin/dev review. */
export function getPairedWoodWarmthMismatches(codes: string[]): Array<{ a: string; b: string; deltaWarmth: number }> {
  if (!_cached) return [];
  const { pairs, byCode } = _cached;
  const woods = [...new Set(codes)].filter(c => byCode.get(c)?.texture === 'wood');
  const result: Array<{ a: string; b: string; deltaWarmth: number }> = [];
  for (let i = 0; i < woods.length; i++) {
    for (let j = i + 1; j < woods.length; j++) {
      const a = byCode.get(woods[i]);
      const b = byCode.get(woods[j]);
      if (!a || !b) continue;
      const delta = Math.abs((a.warmth ?? 0) - (b.warmth ?? 0));
      if (delta > WOOD_WARMTH_MISMATCH_THRESHOLD && pairs.has(pairKey(woods[i], woods[j]))) {
        result.push({ a: woods[i], b: woods[j], deltaWarmth: +delta.toFixed(2) });
      }
    }
  }
  return result;
}

/**
 * Returns the first non-dizaino_dialogai designer whose approved pairs are
 * active within the given set of material codes, or null if none found.
 * Used to surface the designer card when a user manually assembles a palette
 * using a designer's curated pairings.
 */
export function getApprovedByDesigner(codes: string[]): string | null {
  if (!_cached || codes.length < 2) return null;
  const { pairApprovedBy } = _cached;
  const unique = [...new Set(codes)];
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const key = pairKey(unique[i], unique[j]);
      const designer = pairApprovedBy.get(key);
      if (designer && designer !== 'dizaino_dialogai') return designer;
    }
  }
  return null;
}

/** Normalised pair compatibility score (0–1) for a candidate against the given otherCodes. */
export function getPairScoreForCode(code: string, otherCodes: string[]): number {
  if (!_cached || otherCodes.length === 0) return 0;
  const maxPairW = otherCodes.length * 3;
  return maxPairW > 0 ? weightedScore(code, otherCodes, _cached.pairWeights) / maxPairW : 0;
}

/** V2 debug info for a candidate: harmonyScore, coherenceScore, directionId, directionScore, axisErrors. */
export function getV2DebugForCode(
  code: string,
  placedCodes: string[],
  role: string,
  chipArchetypeId?: string | null,
): ReturnType<typeof computeV2Debug> {
  if (!_cached || placedCodes.length === 0) return null;
  const { byCode } = _cached;
  const candidate = byCode.get(code);
  if (!candidate) return null;
  return computeV2Debug(candidate, placedCodes, byCode, role, chipArchetypeId, _activeScoringDirection);
}

/** Returns all SupabaseMaterials whose role[] includes the given role. */
export function getMaterialsByRole(role: string): SupabaseMaterial[] {
  return _cached?.graphMaterials.filter((m) => m.role.includes(role)) ?? [];
}

/** Returns all synonym siblings of a material (same synonym_id, different code). Empty if no synonyms. */
export function getSynonymMaterials(code: string): SupabaseMaterial[] {
  if (!_cached) return [];
  const mat = _cached.byCode.get(code);
  if (!mat?.synonymId) return [];
  return _cached.graphMaterials.filter(
    (m) => m.synonymId === mat.synonymId && m.technicalCode !== code
  );
}

/**
 * Resolves a material code for a specific showroom.
 * - If the material is already in the showroom, returns it unchanged.
 * - If not, looks for a synonym that IS in the showroom and returns that instead.
 * - Falls back to the original code if no synonym matches (e.g. role not covered by showroom).
 */
export function resolveCodeForShowroom(code: string, showroomId: string): string {
  if (!_cached) return code;
  const mat = _cached.byCode.get(code);
  if (!mat) return code;
  if (mat.showroomIds.includes(showroomId)) return code;
  if (!mat.synonymId) return code;
  const synonym = _cached.graphMaterials.find(
    (m) => m.synonymId === mat.synonymId && m.technicalCode !== code && m.showroomIds.includes(showroomId)
  );
  return synonym?.technicalCode ?? code;
}

// Direction-internal ranking: harmony + direction score is the signal.
// Direct pairing with placed codes is a small tiebreaker only.
export const PALETTE_WEIGHT = 1; //0.98;

// General ranking (getAllRankedCodes, perChipBestCode): both overall versatility
// (pairCountByCode) and direct pairings with placed codes are counted.
export const GENERAL_PALETTE_WEIGHT = 0.9;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGraphMaterials() {
  const [loading, setLoading] = useState(!_cached);

  useEffect(() => {
    if (_cached) return;
    if (!_fetchPromise) _fetchPromise = loadGraphData().then((c) => { _cached = c; return c; });
    _fetchPromise.then(() => setLoading(false));
  }, []);

  const graphMaterials: SupabaseMaterial[] = _cached?.graphMaterials ?? [];

  function getBestSwapCode(
    slotCode: string,
    otherCodes: string[],
    targetRole?: string,
  ): string | null {
    if (!_cached) return null;
    const { pairs, pairWeights, graphMaterials: mats } = _cached;
    if (otherCodes.length === 0) return null;
    // Gate: current material already compatible with all others → no nudge
    if (isCompatibleWithAll(slotCode, otherCodes, pairs)) { return null; }
    const slotMat = _cached.byCode.get(slotCode);
    const slotSynonymId = slotMat?.synonymId ?? null;
    const vThreshold = Math.max(1, otherCodes.length - 1);
    const currentHasV = countCompatible(slotCode, otherCodes, pairs) >= vThreshold;
    const pool = mats.filter((m) => {
      if (otherCodes.includes(m.technicalCode)) return false;
      if (m.technicalCode === slotCode) return false;
      if (slotSynonymId && m.synonymId === slotSynonymId) return false;
      if (targetRole && !m.role.includes(targetRole)) return false;
      return true;
    });
    const vvCandidates = pool.filter((m) => isCompatibleWithAll(m.technicalCode, otherCodes, pairs));
    const vCandidates = !currentHasV
      ? pool.filter((m) => countCompatible(m.technicalCode, otherCodes, pairs) >= vThreshold)
      : [];
    // Priority (table promise): VV same-tex → V same-tex → VV any → V any.
    // isSimilarMaterial is a sort key only, never a hard gate.
    if (slotMat) {
      const vvNarrowed = vvCandidates.filter((m) => m.texture === slotMat.texture && isSimilarMaterial(m, slotMat));
      const vNarrowed  = vCandidates.filter((m)  => m.texture === slotMat.texture && isSimilarMaterial(m, slotMat));
      const finalPool  = vvNarrowed.length > 0 ? vvNarrowed
        : vNarrowed.length  > 0 ? vNarrowed
        : [];
      if (finalPool.length === 0) return null;
      const best = [...finalPool].sort((a, b) => visualDistance(a, slotMat) - visualDistance(b, slotMat))[0];
      return best?.technicalCode ?? null;
    }
    const allCandidates = vvCandidates.length > 0 ? vvCandidates : vCandidates;
    const best = rankByCompatibility(allCandidates, otherCodes, pairs, pairWeights)[0];
    return best?.technicalCode ?? null;
  }

  // Returns material codes compatible with all otherCodes, optionally narrowed by
  // same texture + similar lightness as currentCode (the slot's current product).
  // If currentCode is null (empty slot), returns all compatible codes.
  function getRecommendedCodes(
    currentCode: string | null,
    otherCodes: string[],
    targetRole?: string,
  ): string[] {
    if (!_cached || otherCodes.length === 0) return [];
    const { pairs, byCode, graphMaterials: mats } = _cached;
    const threshold = Math.max(1, otherCodes.length - 1);
    let pool = mats.filter((m) => {
      if (otherCodes.includes(m.technicalCode)) return false;
      if (targetRole && !m.role.includes(targetRole)) return false;
      return countCompatible(m.technicalCode, otherCodes, pairs) >= threshold;
    });
    if (pool.length === 0) return [];
    // Narrow to same texture + similar lightness as current slot's material
    const slotMat = currentCode ? mats.find((m) => m.technicalCode === currentCode) : undefined;
    if (slotMat) {
      // Texture always matches — never suggest textile as a swap for plain or vice versa.
      // Lightness similarity is a secondary preference, relaxed if no close matches exist.
      const sameTexture = pool.filter((m) => m.texture === slotMat.texture);
      const narrowed = sameTexture.filter((m) => isSimilarLightness(m.lightness, slotMat.lightness));
      pool = narrowed.length > 0 ? narrowed : sameTexture;
    }
    const role = targetRole ?? 'front';
    return [...pool].sort((a, b) =>
      paletteScoreV2(b, otherCodes, byCode, role) - paletteScoreV2(a, otherCodes, byCode, role)
    ).map((m) => m.technicalCode);
  }

  function getAllRankedCodes(
    otherCodes: string[],
    targetRole?: string,
    chipArchetypeId?: string | null,
  ): string[] {
    if (!_cached || otherCodes.length === 0) return [];
    const { byCode, pairWeights, graphMaterials: mats } = _cached;
    const role = targetRole ?? 'front';
    const pool = mats.filter((m) => {
      if (otherCodes.includes(m.technicalCode)) return false;
      if (targetRole && !m.role.includes(targetRole)) return false;
      return true;
    });
    if (pool.length === 0) return [];
    const maxPairW = otherCodes.length * 3;
    return [...pool].sort((a, b) => {
      const pA = paletteScoreV2(a, otherCodes, byCode, role, chipArchetypeId);
      const pB = paletteScoreV2(b, otherCodes, byCode, role, chipArchetypeId);
      const cA = maxPairW > 0 ? weightedScore(a.technicalCode, otherCodes, pairWeights) / maxPairW : 0;
      const cB = maxPairW > 0 ? weightedScore(b.technicalCode, otherCodes, pairWeights) / maxPairW : 0;
      const sA = pA * GENERAL_PALETTE_WEIGHT + cA * (1 - GENERAL_PALETTE_WEIGHT);
      const sB = pB * GENERAL_PALETTE_WEIGHT + cB * (1 - GENERAL_PALETTE_WEIGHT);
      return sB - sA;
    }).map((m) => m.technicalCode);
  }

  /** New v2 API: harmony-filtered + clustered + direction-tagged candidates for the active archetype/role.
   *  When chipArchetypeId is provided, the candidate pool is scoped to that archetype so stone candidates
   *  never appear under the wood chip, etc. Plain chip is special-cased because front plain materials
   *  carry archetypeId=null (the chip itself does the routing). */
  function getClusteredRankedCodes(
    otherCodes: string[],
    targetRole?: string,
    chipArchetypeId?: string | null,
  ): RankedClusteredEntry[] {
    if (!_cached) return [];
    const { byCode, graphMaterials: mats, pairWeights, pairCountByCode } = _cached;
    const role = targetRole ?? 'front';
    const pool = mats.filter((m) => {
      if (otherCodes.includes(m.technicalCode)) return false;
      if (targetRole && !m.role.includes(targetRole)) return false;
      if (chipArchetypeId) {
        if (chipArchetypeId === 'plain') {
          if (m.texture !== 'plain') return false;
        } else if (m.archetypeId !== chipArchetypeId) {
          return false;
        }
      }
      return true;
    });
    if (pool.length === 0) return [];
    if (otherCodes.length === 0) {
      // Cross-role synthetic reference: use the most-paired material from the complementary
      // role as the color reference and pair anchor. This makes direction labels intuitive —
      // e.g. darker_echo for a front means "darker than the most popular floor."
      const COMPLEMENTARY_ROLE: Record<string, string> = {
        front: 'floor', floor: 'front', worktop: 'floor', backsplash: 'front',
      };
      const compRole = COMPLEMENTARY_ROLE[role];
      const compPool = compRole ? mats.filter(m => m.role.includes(compRole)) : [];
      const refPool = compPool.length > 0 ? compPool : pool;
      const topRef = refPool.reduce((best, m) =>
        (pairCountByCode.get(m.technicalCode) ?? 0) > (pairCountByCode.get(best.technicalCode) ?? 0) ? m : best
      );
      const syntheticPairByCode = new Map<string, number>();
      for (const m of pool) {
        syntheticPairByCode.set(m.technicalCode, weightedScore(m.technicalCode, [topRef.technicalCode], pairWeights) / 3);
      }
      return rankClusteredCandidates(pool, [topRef.technicalCode], byCode, role, chipArchetypeId, syntheticPairByCode, 1 - GENERAL_PALETTE_WEIGHT);
    }
    // Compute pair scores before scoring so pairing lifts materials within their correct
    // direction — not across the claiming boundary into the wrong direction.
    const maxPairW = otherCodes.length * 3;
    const pairByCode = new Map<string, number>();
    for (const m of pool) {
      pairByCode.set(m.technicalCode, maxPairW > 0 ? weightedScore(m.technicalCode, otherCodes, pairWeights) / maxPairW : 0);
    }
    return rankClusteredCandidates(pool, otherCodes, byCode, role, chipArchetypeId, pairByCode, 1 - PALETTE_WEIGHT);
  }

  function isCompatibleWithOthers(slotCode: string, otherCodes: string[]): boolean {
    if (!_cached || otherCodes.length === 0) return false;
    const { pairs } = _cached;
    const threshold = Math.max(1, otherCodes.length - 1);
    return countCompatible(slotCode, otherCodes, pairs) >= threshold;
  }

  function isCompatibleWithEvery(slotCode: string, otherCodes: string[]): boolean {
    if (!_cached || otherCodes.length === 0) return false;
    const { pairs } = _cached;
    return isCompatibleWithAll(slotCode, otherCodes, pairs);
  }

  function getUnapprovedWoodPartners(slotCode: string, sameRoleCodes: string[], otherRoleCodes: string[]): string[] {
    if (!_cached) return [];
    const { pairs, byCode } = _cached;
    const mat = byCode.get(slotCode);
    if (mat?.texture !== 'wood') return [];
    const sameRole = sameRoleCodes.filter(c => {
      if (c === slotCode) return false;
      const other = byCode.get(c);
      return other?.texture === 'wood' && !pairs.has(pairKey(slotCode, c));
    });
    const crossRole = otherRoleCodes.filter(c => {
      if (c === slotCode) return false;
      const other = byCode.get(c);
      if (other?.texture !== 'wood') return false;
      if (pairs.has(pairKey(slotCode, c))) return false;
      return Math.abs((mat.warmth ?? 0) - (other.warmth ?? 0)) > WOOD_WARMTH_MISMATCH_THRESHOLD;
    });
    return [...sameRole, ...crossRole];
  }

  /**
   * Returns unpaired busy-pattern codes from otherCodes (any role, any texture).
   * Triggers when this slot has pattern > BUSY_PATTERN_THRESHOLD and at least one other
   * material also exceeds the threshold with no approved pair between them.
   */
  function getUnapprovedBusyPatternPartners(slotCode: string, otherCodes: string[]): string[] {
    if (!_cached) return [];
    const { pairs, byCode } = _cached;
    const mat = byCode.get(slotCode);
    if ((mat?.pattern ?? 0) <= BUSY_PATTERN_THRESHOLD) return [];
    return otherCodes.filter(c => {
      if (c === slotCode) return false;
      const other = byCode.get(c);
      return (other?.pattern ?? 0) > BUSY_PATTERN_THRESHOLD && !pairs.has(pairKey(slotCode, c));
    });
  }

  return { loading, graphMaterials, getBestSwapCode, getRecommendedCodes, getAllRankedCodes, getClusteredRankedCodes, isCompatibleWithOthers, isCompatibleWithEvery, getUnapprovedWoodPartners, getUnapprovedBusyPatternPartners };
}

function isSimilarLightness(a: number, b: number, threshold = 20): boolean {
  return Math.abs(a - b) <= threshold;
}
