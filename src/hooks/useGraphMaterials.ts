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
  layoutPattern: string | null;
}

interface GraphCache {
  graphMaterials: SupabaseMaterial[];
  pairs: Set<string>;
  pairWeights: Map<string, number>;
  byCode: Map<string, SupabaseMaterial>;
  pairCountByCode: Map<string, number>;
}

let _cached: GraphCache | null = null;
let _fetchPromise: Promise<GraphCache> | null = null;

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
      'id, technical_code, role, texture, lightness, warmth, pattern, chroma, hue_angle, name, image_url, material_type, tier, showroom_ids, texture_prompt, layout_pattern'
    ),
    supabase.from('pair_compatibility' as any).select('code_a, code_b, weight'),
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
  }));
  graphMaterials.forEach((m) => {
    const primaryRole = m.role[0];
    if (primaryRole) {
      m.archetypeId = deriveArchetypeId(primaryRole, m.texture, m.lightness, m.warmth, m.pattern, m.chroma);
    }
  });
  const byCode = new Map(graphMaterials.map((m) => [m.technicalCode, m]));
  const pairs = new Set<string>();
  const pairWeights = new Map<string, number>();
  const pairCountByCode = new Map<string, number>();
  for (const r of (pc ?? [])) {
    const key = pairKey(r.code_a, r.code_b);
    const w: number = r.weight ?? 1.0;
    pairs.add(key);
    pairWeights.set(key, w);
    pairCountByCode.set(r.code_a, (pairCountByCode.get(r.code_a) ?? 0) + 1);
    pairCountByCode.set(r.code_b, (pairCountByCode.get(r.code_b) ?? 0) + 1);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
  _updateImageCache(byCode);
  return { graphMaterials, pairs, pairWeights, byCode, pairCountByCode };
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
    const { pairs, pairWeights, graphMaterials: mats } = _cached;
    if (otherCodes.length === 0) return null;
    // Gate: current material already compatible with all others → no nudge
    if (isCompatibleWithAll(slotCode, otherCodes, pairs)) return null;
    const candidates = getCompatibleCandidates(otherCodes, mats, pairs, targetRole)
      .filter((m) => m.technicalCode !== slotCode);
    if (candidates.length === 0) return null;
    // Narrow to same texture + similar lightness as the slot's current material
    const slotMat = mats.find((m) => m.technicalCode === slotCode);
    if (slotMat) {
      const narrowed = candidates.filter((m) =>
        m.texture === slotMat.texture &&
        isSimilarMaterial(m, slotMat)
      );
      if (narrowed.length === 0) return null;
      // Rank by visual similarity to the current material (most similar first),
      // so the swap preserves the user's aesthetic intent.
      const best = [...narrowed].sort((a, b) => visualDistance(a, slotMat) - visualDistance(b, slotMat))[0];
      return best?.technicalCode ?? null;
    }
    const best = rankByCompatibility(candidates, otherCodes, pairs, pairWeights)[0];
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
    const { pairs, pairWeights, graphMaterials: mats } = _cached;
    const threshold = Math.min(2, otherCodes.length);
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
    return rankByCompatibility(pool, otherCodes, pairs, pairWeights)
      .map((m) => m.technicalCode);
  }

  function isCompatibleWithOthers(slotCode: string, otherCodes: string[]): boolean {
    if (!_cached || otherCodes.length === 0) return false;
    const { pairs } = _cached;
    const threshold = Math.min(2, otherCodes.length);
    return countCompatible(slotCode, otherCodes, pairs) >= threshold;
  }

  return { loading, graphMaterials, getBestSwapCode, getRecommendedCodes, isCompatibleWithOthers };
}

function isSimilarLightness(a: number, b: number, threshold = 20): boolean {
  return Math.abs(a - b) <= threshold;
}
