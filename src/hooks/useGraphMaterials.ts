import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { GraphMaterial, pairKey, getCompatibleCandidates, rankByCompatibility, isCompatibleWithAll, isSimilarMaterial, visualDistance, countCompatible, weightedScore } from '@/lib/graph-compatibility';
import { deriveArchetypeId } from '@/lib/archetype-rules';

/** Full material record as fetched from Supabase — superset of GraphMaterial. */
export interface SupabaseMaterial extends GraphMaterial {
  name: { en: string; lt: string } | null;
  imageUrl: string | null;
  materialType: string | null;
  tier: 'budget' | 'optimal' | 'premium' | null;
  texturePrompt: string | null;
  showroomIds: string[];
}

interface GraphCache {
  graphMaterials: SupabaseMaterial[];
  pairs: Set<string>;
  pairWeights: Map<string, number>;
  codeToId: Map<string, string>;
  idToCode: Map<string, string>;
  byCode: Map<string, SupabaseMaterial>;
  pairCountByUuid: Map<string, number>;
}

let _cached: GraphCache | null = null;
let _fetchPromise: Promise<GraphCache> | null = null;

async function loadGraphData(): Promise<GraphCache> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [{ data: mats }, { data: pc }] = await Promise.all([
    supabase.from('materials' as any).select(
      'id, technical_code, role, texture, lightness, warmth, pattern, chroma, hue_angle, name, image_url, material_type, tier, showroom_ids, texture_prompt'
    ),
    supabase.from('pair_compatibility' as any).select('material_a, material_b, weight'),
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
  }));
  graphMaterials.forEach((m) => {
    const primaryRole = m.role[0];
    if (primaryRole) {
      m.archetypeId = deriveArchetypeId(primaryRole, m.texture, m.lightness, m.warmth, m.pattern, m.chroma);
    }
  });
  const codeToId = new Map(graphMaterials.map((m) => [m.technicalCode, m.id]));
  const idToCode = new Map(graphMaterials.map((m) => [m.id, m.technicalCode]));
  const byCode   = new Map(graphMaterials.map((m) => [m.technicalCode, m]));
  const pairs = new Set<string>();
  const pairWeights = new Map<string, number>();
  const pairCountByUuid = new Map<string, number>();
  for (const r of (pc ?? [])) {
    const key = pairKey(r.material_a, r.material_b);
    const w: number = r.weight ?? 1.0;
    pairs.add(key);
    pairWeights.set(key, w);
    const sep = key.indexOf('::');
    const a = key.slice(0, sep);
    const b = key.slice(sep + 2);
    pairCountByUuid.set(a, (pairCountByUuid.get(a) ?? 0) + 1);
    pairCountByUuid.set(b, (pairCountByUuid.get(b) ?? 0) + 1);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return { graphMaterials, pairs, pairWeights, codeToId, idToCode, byCode, pairCountByUuid };
}

// ─── Module-level synchronous lookups (readable once cache is warm) ───────────

/** Returns the full SupabaseMaterial for a technical_code, or undefined if not cached. */
export function getMaterialByCode(code: string): SupabaseMaterial | undefined {
  return _cached?.byCode.get(code);
}

/** Returns the total number of pair_compatibility entries for a given technical_code. */
export function getPairCountByCode(code: string): number {
  const id = _cached?.codeToId.get(code);
  if (!id) return 0;
  return _cached?.pairCountByUuid.get(id) ?? 0;
}

/** Returns the weighted compatibility score of this material against the given otherCodes. */
export function getCompatibilityScore(code: string, otherCodes: string[]): number {
  if (!_cached || otherCodes.length === 0) return 0;
  const { codeToId, pairWeights } = _cached;
  const id = codeToId.get(code);
  if (!id) return 0;
  const otherUuids = otherCodes.map((c) => codeToId.get(c)).filter((id): id is string => !!id);
  if (otherUuids.length === 0) return 0;
  return weightedScore(id, otherUuids, pairWeights);
}

/** Returns all SupabaseMaterials whose role[] includes the given role. */
export function getMaterialsByRole(role: string): SupabaseMaterial[] {
  return _cached?.graphMaterials.filter((m) => m.role.includes(role)) ?? [];
}

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
    const { codeToId, idToCode, pairs, pairWeights, graphMaterials: mats } = _cached;
    const slotUuid = codeToId.get(slotCode);
    const otherUuids = otherCodes.map((c) => codeToId.get(c)).filter((id): id is string => !!id);
    if (!slotUuid || otherUuids.length === 0) return null;
    // Gate: current material already compatible with all others → no nudge
    if (isCompatibleWithAll(slotUuid, otherUuids, pairs)) return null;
    const candidates = getCompatibleCandidates(otherUuids, mats, pairs, targetRole)
      .filter((m) => m.id !== slotUuid);
    if (candidates.length === 0) return null;
    // Narrow to same texture + similar lightness as the slot's current material
    const slotMat = mats.find((m) => m.id === slotUuid);
    if (slotMat) {
      const narrowed = candidates.filter((m) =>
        m.texture === slotMat.texture &&
        isSimilarMaterial(m, slotMat)
      );
      if (narrowed.length === 0) return null;
      // Rank by visual similarity to the current material (most similar first),
      // so the swap preserves the user's aesthetic intent.
      const best = [...narrowed].sort((a, b) => visualDistance(a, slotMat) - visualDistance(b, slotMat))[0];
      return best ? (idToCode.get(best.id) ?? null) : null;
    }
    const best = rankByCompatibility(candidates, otherUuids, pairs, pairWeights)[0];
    return best ? (idToCode.get(best.id) ?? null) : null;
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
    const { codeToId, idToCode, pairs, pairWeights, graphMaterials: mats } = _cached;
    const otherUuids = otherCodes.map((c) => codeToId.get(c)).filter((id): id is string => !!id);
    if (otherUuids.length === 0) return [];
    const threshold = Math.min(2, otherUuids.length);
    let pool = mats.filter((m) => {
      if (otherUuids.includes(m.id)) return false;
      if (targetRole && !m.role.includes(targetRole)) return false;
      return countCompatible(m.id, otherUuids, pairs) >= threshold;
    });
    if (pool.length === 0) return [];
    // Narrow to same texture + similar lightness as current slot's material
    const currentUuid = currentCode ? codeToId.get(currentCode) : undefined;
    const slotMat = currentUuid ? mats.find((m) => m.id === currentUuid) : undefined;
    if (slotMat) {
      // Texture always matches — never suggest textile as a swap for plain or vice versa.
      // Lightness similarity is a secondary preference, relaxed if no close matches exist.
      const sameTexture = pool.filter((m) => m.texture === slotMat.texture);
      const narrowed = sameTexture.filter((m) => isSimilarLightness(m.lightness, slotMat.lightness));
      pool = narrowed.length > 0 ? narrowed : sameTexture;
    }
    return rankByCompatibility(pool, otherUuids, pairs, pairWeights)
      .map((m) => idToCode.get(m.id)!)
      .filter(Boolean);
  }

  function isCompatibleWithOthers(slotCode: string, otherCodes: string[]): boolean {
    if (!_cached || otherCodes.length === 0) return false;
    const { codeToId, pairs } = _cached;
    const slotUuid = codeToId.get(slotCode);
    if (!slotUuid) return false;
    const otherUuids = otherCodes.map((c) => codeToId.get(c)).filter((id): id is string => !!id);
    if (otherUuids.length === 0) return false;
    const threshold = Math.min(2, otherUuids.length);
    return countCompatible(slotUuid, otherUuids, pairs) >= threshold;
  }

  return { loading, graphMaterials, getBestSwapCode, getRecommendedCodes, isCompatibleWithOthers };
}
