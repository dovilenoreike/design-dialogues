import { getMaterialByCode, SupabaseMaterial } from "@/hooks/useGraphMaterials";

export type PaletteHintKey = "minimal" | "balanced" | "highContrast" | "mixed";
export interface PaletteHint { key: PaletteHintKey; }

// Visual dominance weights — larger surface = more influence on the palette read
const PALETTE_KEY_WEIGHTS: Record<string, number> = {
  floor:          0.30,
  bottomCabinets: 0.25,
  tallCabinets:   0.20,
  topCabinets:    0.15,
  worktops:       0.10,
  backsplash:     0.10,
  shelves:        0.10,
};
const DEFAULT_WEIGHT = 0.10;

const SIMILAR = 30;      // aggregate distance → "Minimal"
const L_STD_HIGH = 30;   // lightness weighted std dev → "High contrast" 22 original

// "Mixed": warmth-only weighted pairwise distance.
// No hard zone thresholds — measures how much warmth varies across surfaces by area weight.
// Warmth scale: -1→+1. Actual range ≈ -0.20 (cool stone/grey) to +0.45 (honey oak/walnut).
// warmthDiff is multiplied by 60 to put it on the same scale as lightness (0–100).
// A clearly warm+cool split (e.g. oak floor vs grey fronts, Δwarmth ≈ 0.45) → warmthAvgDist ≈ 17–22.
// An all-warm palette → warmthAvgDist ≈ 2–5. Threshold sits between those.
const MIXED_WARMTH_DIST = 12;

function distanceBreakdown(a: SupabaseMaterial, b: SupabaseMaterial) {
  const lightnessDiff = Math.abs(a.lightness - b.lightness);
  const warmthDiff    = Math.abs((a.warmth ?? 0) - (b.warmth ?? 0)) * 60;
  const textureDiff   = a.texture && b.texture && a.texture !== b.texture ? 20 : 0;
  return { lightnessDiff, warmthDiff, textureDiff, total: lightnessDiff + warmthDiff + textureDiff };
}

export function computePaletteHint(
  inputs: Array<{ code: string; paletteKey: string }>,
): PaletteHint | null {
  const items = inputs
    .map(({ code, paletteKey }) => ({
      mat: getMaterialByCode(code),
      w: PALETTE_KEY_WEIGHTS[paletteKey] ?? DEFAULT_WEIGHT,
      paletteKey,
      code,
    }))
    .filter((x): x is { mat: SupabaseMaterial; w: number; paletteKey: string; code: string } => !!x.mat);

  if (items.length < 2) return null;

  const totalW = items.reduce((s, x) => s + x.w, 0);
  const norm   = items.map(x => ({ ...x, w: x.w / totalW }));

  // ── Pairwise distances (all three dimensions) ────────────────────────────
  type WPair = {
    a: string; b: string;
    dist: number; breakdown: ReturnType<typeof distanceBreakdown>;
    pairW: number; contribution: number;
  };
  const pairs: WPair[] = [];
  for (let i = 0; i < norm.length; i++) {
    for (let j = i + 1; j < norm.length; j++) {
      const bd    = distanceBreakdown(norm[i].mat, norm[j].mat);
      const pairW = norm[i].w * norm[j].w;
      pairs.push({ a: norm[i].paletteKey, b: norm[j].paletteKey, dist: bd.total, breakdown: bd, pairW, contribution: bd.total * pairW });
    }
  }
  const totalPairW = pairs.reduce((s, p) => s + p.pairW, 0);

  // ── 1. Minimal: low aggregate distance across all axes ───────────────────
  const avgDist = pairs.reduce((s, p) => s + p.contribution, 0) / totalPairW;

  // ── 2. Lightness: weighted std dev ──────────────────────────────────────
  const wMeanL       = norm.reduce((s, x) => s + x.w * x.mat.lightness, 0);
  const lightnessStd = Math.sqrt(norm.reduce((s, x) => s + x.w * (x.mat.lightness - wMeanL) ** 2, 0));

  // ── 3. Warmth: weighted pairwise distance (warmth component only) ────────
  // Continuous — no hard zone thresholds. Naturally weighted by surface area via pairW.
  const warmthAvgDist = pairs.reduce((s, p) => s + p.breakdown.warmthDiff * p.pairW, 0) / totalPairW;

  const isMixed   = warmthAvgDist >= MIXED_WARMTH_DIST;
  const L_high    = lightnessStd  >= L_STD_HIGH;

  // ── 4. Classify ──────────────────────────────────────────────────────────
  let result: PaletteHintKey;
  let reason: string;

  if (avgDist <= SIMILAR) {
    result = "minimal";
    reason = `avgDist ${avgDist.toFixed(2)} ≤ ${SIMILAR}`;
  } else if (isMixed) {
    result = "mixed";
    reason = `warmthAvgDist ${warmthAvgDist.toFixed(2)} ≥ ${MIXED_WARMTH_DIST} — warm and cool surfaces without a dominant story`;
  } else if (L_high) {
    result = "highContrast";
    reason = `lightnessStd ${lightnessStd.toFixed(2)} ≥ ${L_STD_HIGH}, warmth coherent (warmthAvgDist ${warmthAvgDist.toFixed(2)})`;
  } else {
    result = "balanced";
    reason = `lightnessStd ${lightnessStd.toFixed(2)}, warmthAvgDist ${warmthAvgDist.toFixed(2)} — moderate variation, coherent`;
  }

  // ── Logging ──────────────────────────────────────────────────────────────
  console.group("[palette-hint] computation");
  console.log(`Thresholds: avgDist ≤ ${SIMILAR} → minimal | lightnessStd ≥ ${L_STD_HIGH} → highContrast | warmthAvgDist ≥ ${MIXED_WARMTH_DIST} → mixed`);
  console.log("Materials:");
  console.table(norm.map(x => ({
    paletteKey: x.paletteKey,
    code:       x.code,
    name:       (x.mat.name as { en?: string } | null)?.en ?? x.code,
    lightness:  x.mat.lightness,
    warmth:     +(x.mat.warmth ?? 0).toFixed(3),
    texture:    x.mat.texture,
    normWeight: +x.w.toFixed(3),
  })));
  console.log("\nPairwise distances:");
  console.table(pairs.map(p => ({
    pair:            `${p.a} ↔ ${p.b}`,
    lightness:       +p.breakdown.lightnessDiff.toFixed(1),
    warmthRaw:       +p.breakdown.warmthDiff.toFixed(1),
    texture:         p.breakdown.textureDiff,
    total:           +p.dist.toFixed(1),
    pairWeight:      +p.pairW.toFixed(4),
    warmthContrib:   +(p.breakdown.warmthDiff * p.pairW).toFixed(4),
  })));
  console.log(`\nAggregate:   avgDist         = ${avgDist.toFixed(2)}  (≤ ${SIMILAR} → minimal)`);
  console.log(`Lightness:   lightnessStd    = ${lightnessStd.toFixed(2)}  (≥ ${L_STD_HIGH} → highContrast)`);
  console.log(`Warmth:      warmthAvgDist   = ${warmthAvgDist.toFixed(2)}  (≥ ${MIXED_WARMTH_DIST} → mixed)`);
  console.log(`\n→ "${result}" — ${reason}`);
  console.groupEnd();

  return { key: result };
}
