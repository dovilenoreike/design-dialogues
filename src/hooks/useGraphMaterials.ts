import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { GraphMaterial, pairKey, getCompatibleCandidates, rankByCompatibility, isCompatibleWithAll, isSimilarLightness } from '@/lib/graph-compatibility';
import { deriveArchetypeId } from '@/lib/archetype-rules';

/** Full material record as fetched from Supabase — superset of GraphMaterial. */
export interface SupabaseMaterial extends GraphMaterial {
  name: { en: string; lt: string } | null;
  description: { en: string; lt: string } | null;
  imageUrl: string | null;
  materialType: string | null;
  tier: 'budget' | 'optimal' | 'premium' | null;
  texturePrompt: string | null;
  showroomIds: string[];
}

interface GraphCache {
  graphMaterials: SupabaseMaterial[];
  pairs: Set<string>;
  codeToId: Map<string, string>;
  idToCode: Map<string, string>;
  byCode: Map<string, SupabaseMaterial>;
}

let _cached: GraphCache | null = null;
let _fetchPromise: Promise<GraphCache> | null = null;

async function loadGraphData(): Promise<GraphCache> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [{ data: mats }, { data: pc }] = await Promise.all([
    supabase.from('materials' as any).select(
      'id, technical_code, role, texture, lightness, warmth, pattern, name, description, image_url, material_type, tier, showroom_ids, texture_prompt'
    ),
    supabase.from('pair_compatibility' as any).select('material_a, material_b'),
  ]);
  const graphMaterials: SupabaseMaterial[] = (mats ?? []).map((r: any) => ({
    id: r.id,
    technicalCode: r.technical_code,
    role: r.role ?? [],
    texture: r.texture,
    lightness: r.lightness,
    warmth: r.warmth,
    pattern: r.pattern ?? 0,
    archetypeId: null,
    // extended display fields
    name: r.name ?? null,
    description: r.description ?? null,
    imageUrl: r.image_url ?? null,
    materialType: r.material_type ?? null,
    tier: r.tier ?? null,
    texturePrompt: r.texture_prompt ?? null,
    showroomIds: r.showroom_ids ?? [],
  }));
  graphMaterials.forEach((m) => {
    const primaryRole = m.role[0];
    if (primaryRole) {
      m.archetypeId = deriveArchetypeId(primaryRole, m.texture, m.lightness, m.warmth, m.pattern);
    }
  });
  const codeToId = new Map(graphMaterials.map((m) => [m.technicalCode, m.id]));
  const idToCode = new Map(graphMaterials.map((m) => [m.id, m.technicalCode]));
  const byCode   = new Map(graphMaterials.map((m) => [m.technicalCode, m]));
  const pairs = new Set<string>(
    (pc ?? []).map((r: any) => pairKey(r.material_a, r.material_b))
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return { graphMaterials, pairs, codeToId, idToCode, byCode };
}

// ─── Module-level synchronous lookups (readable once cache is warm) ───────────

/** Returns the full SupabaseMaterial for a technical_code, or undefined if not cached. */
export function getMaterialByCode(code: string): SupabaseMaterial | undefined {
  return _cached?.byCode.get(code);
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
    const { codeToId, idToCode, pairs, graphMaterials: mats } = _cached;
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
        isSimilarLightness(m.lightness, slotMat.lightness) &&
        (!slotMat.archetypeId || m.archetypeId === slotMat.archetypeId)
      );
      if (narrowed.length === 0) return null;
      const best = rankByCompatibility(narrowed, otherUuids, pairs)[0];
      return best ? (idToCode.get(best.id) ?? null) : null;
    }
    const best = rankByCompatibility(candidates, otherUuids, pairs)[0];
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
    const { codeToId, idToCode, pairs, graphMaterials: mats } = _cached;
    const otherUuids = otherCodes.map((c) => codeToId.get(c)).filter((id): id is string => !!id);
    // Strict coverage: every code must resolve to a known UUID
    if (otherUuids.length !== otherCodes.length) return [];
    const compatible = getCompatibleCandidates(otherUuids, mats, pairs, targetRole);
    if (!currentCode) {
      return compatible.map((m) => idToCode.get(m.id)!).filter(Boolean);
    }
    const currentUuid = codeToId.get(currentCode);
    const slotMat = currentUuid ? mats.find((m) => m.id === currentUuid) : undefined;
    if (!slotMat) {
      return compatible.map((m) => idToCode.get(m.id)!).filter(Boolean);
    }
    const narrowed = compatible.filter((m) =>
      m.texture === slotMat.texture && isSimilarLightness(m.lightness, slotMat.lightness)
    );
    const pool = narrowed.length > 0 ? narrowed : compatible;
    return pool.map((m) => idToCode.get(m.id)!).filter(Boolean);
  }

  function isCompatibleWithOthers(slotCode: string, otherCodes: string[]): boolean {
    if (!_cached || otherCodes.length === 0) return true;
    const { codeToId, pairs } = _cached;
    const slotUuid = codeToId.get(slotCode);
    if (!slotUuid) return false;
    const otherUuids = otherCodes.map(c => codeToId.get(c)).filter((id): id is string => !!id);
    if (otherUuids.length !== otherCodes.length) return false;
    return isCompatibleWithAll(slotUuid, otherUuids, pairs);
  }

  return { loading, graphMaterials, getBestSwapCode, getRecommendedCodes, isCompatibleWithOthers };
}
