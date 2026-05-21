import type { GraphMaterial } from '@/lib/graph-compatibility';

export type StyleMode = 'quiet' | 'grounded' | 'intentional';

// ─── Pure utilities ───────────────────────────────────────────────────────────
function toleratedError(actual: number, ideal: number, tol: number): number {
  return Math.max(0, Math.abs(actual - ideal) - tol);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// sin(π·L/100) peaks at 1.0 at L=50, → 0 at L=0 and L=100.
// Applied to chroma errors: very dark/light surfaces are perceptually achromatic.
function colourSalience(lightness: number): number {
  return Math.sin(Math.PI * Math.max(0, Math.min(100, lightness)) / 100);
}

// ─── Activity + composition ───────────────────────────────────────────────────
const TEXTURE_COMPLEXITY: Record<string, number> = {
  plain: 0, wood: 0.65, stone: 0.35, metal: 0.15,
};

function computeActivity(m: GraphMaterial): number {
  const tc = TEXTURE_COMPLEXITY[m.texture] ?? 0;
  return Math.min(100, m.pattern * 0.55 + (m.chroma * colourSalience(m.lightness)) * 0.30 + tc * 15);
}

const ROLE_VISUAL_MASS: Record<string, number> = {
  floor: 0.35, front: 0.30, worktop: 0.10, backsplash: 0.05,
};

interface CompositionState {
  dominantWarmth:      number;
  compositionActivity: number;
  dominantHue:         number | null; // circular mean of placed hue angles, weighted by mass × visualChroma
  avgChroma:           number;        // weighted mean of placed materials' raw chroma (by mass)
}

function computeCompositionState(placed: GraphMaterial[]): CompositionState {
  let totalW = 0, warmthSum = 0, activitySum = 0, chromaSum = 0;
  let sinSum = 0, cosSum = 0, hueWeightTotal = 0;
  for (const m of placed) {
    const w = ROLE_VISUAL_MASS[m.role[0]] ?? 0.10;
    warmthSum   += m.warmth * w;
    activitySum += computeActivity(m) * w;
    chromaSum   += m.chroma * w;
    totalW += w;
    if (m.hue_angle != null) {
      const hw = w * m.chroma * colourSalience(m.lightness);
      sinSum += hw * Math.sin(m.hue_angle * Math.PI / 180);
      cosSum += hw * Math.cos(m.hue_angle * Math.PI / 180);
      hueWeightTotal += hw;
    }
  }
  if (!totalW) return { dominantWarmth: 0, compositionActivity: 0, dominantHue: null, avgChroma: 0 };
  const dominantHue = hueWeightTotal > 0
    ? (Math.atan2(sinSum, cosSum) * 180 / Math.PI + 360) % 360
    : null;
  return {
    dominantWarmth:      warmthSum / totalW,
    compositionActivity: activitySum / totalW,
    dominantHue,
    avgChroma:           chromaSum / totalW,
  };
}

// ─── Score tuning ─────────────────────────────────────────────────────────────
const ROLE_ANCHOR_WEIGHT: Record<string, number> = {
  floor: 4, front: 3, worktop: 2, backsplash: 1,
};

const SCORE_ERROR_POWER  = 1.5;
const NO_ANCHOR_SCORE    = 0.5;
// textureError() returns categorical 0 / 0.5 / 1.0; scale so it doesn't
// dominate the continuous axes (L, W, H, C, P) that live in the same 0–1 space.
const TEXTURE_ERROR_SCALE = 0.20;

// ─── Activity-derived ideal factors ──────────────────────────────────────────
const CHROMA_ACTIVITY_FACTOR: Record<StyleMode, number> = {
  quiet: 0.55, grounded: 0.30, intentional: 0.50,
};

const PATTERN_ACTIVITY_FACTOR: Record<StyleMode, number> = {
  quiet: 0.75, grounded: 0.45, intentional: 0.70,
};

const TEXTURE_MAX_FAMILIES: Record<StyleMode, number> = {
  quiet: 2, grounded: 3, intentional: 3,
};

const PATTERN_TEXTURE_OVERLOAD_FACTOR = 2.0;

// ─── Ideal functions ──────────────────────────────────────────────────────────
// Each axis ideal is a function of this context object.
// The function returns the absolute 0–1 normalized target for the candidate.
// All values in normalized space: L /100, W as-is, H arc/90, C /100, P /100.

interface IdealContext {
  anchor:            GraphMaterial;
  candidateRole:     string;
  style:             StyleMode;
  anchorActivity:    number;
  composition:       CompositionState;
  candidateLightness: number;
}

type IdealFn = (ctx: IdealContext) => number;

// ── Factory helpers — cover the common anchor-relative delta case ──────────────
// Use these for static deltas. For dynamic formulas, write a named IdealFn below.

const lDelta = (d: number): IdealFn => (ctx) =>
  clamp01(ctx.anchor.lightness / 100 + d);

const wDelta = (d: number): IdealFn => (ctx) =>
  clamp01(ctx.anchor.warmth + d);

// H ideal is an absolute arc/90 target (0 = same hue).
const hAbsolute = (target: number): IdealFn => () => target;

// C ideal: activity-derived base (busier anchor → lower chroma target) + fixed delta.
// Uses anchor visual chroma so dark/light anchors don't over-drive the target.
const cActivityDelta = (d: number): IdealFn => (ctx) => {
  const anchorVisualC = ctx.anchor.chroma * colourSalience(ctx.anchor.lightness);
  const base = Math.max(5, anchorVisualC - ctx.anchorActivity * CHROMA_ACTIVITY_FACTOR[ctx.style]) / 100;
  return clamp01(base + d);
};

// P ideal: activity-derived base + fixed delta; worktop earns more richness in calm compositions.
const pActivityDelta = (d: number): IdealFn => (ctx) => {
  let base: number;
  if (ctx.candidateRole === 'worktop' && ctx.composition.compositionActivity < 30) {
    base = (ctx.composition.compositionActivity + (30 - ctx.composition.compositionActivity) * 0.8) / 100;
  } else {
    base = Math.max(0, ctx.anchor.pattern - ctx.anchorActivity * PATTERN_ACTIVITY_FACTOR[ctx.style]) / 100;
  }
  return clamp01(base + d);
};

// ── Custom ideal functions ────────────────────────────────────────────────────
// Add named IdealFn constants here when a factory delta isn't expressive enough.

// H ideal for chromatic plain materials — composition-activity-driven.
// Busy palette (high activity) → harmonise with composition hue (target arc 0°).
// Calm palette (low activity) → add gentle hue interest (target arc ~30°).
// Intentional style → bold contrast encouraged (target arc ~90°).
const hChromatic: IdealFn = (ctx) => {
  if (ctx.style === 'intentional') return 1.0;
  const activityNorm = Math.min(1, ctx.composition.compositionActivity / 50);
  return clamp01((1 - activityNorm) / 3.0);
};

// C ideal for chromatic plains — targets 85% of composition's average raw chroma.
// Slight muted-first lean; colourSalience on the error (in computeNormalizedErrors)
// naturally excuses pure-white and pure-black candidates.
const cCompositionAligned: IdealFn = (ctx) => {
  const target = Math.max(5, ctx.composition.avgChroma * 0.85);
  const s = colourSalience(ctx.candidateLightness);
  return clamp01(target / (Math.max(0.1, s) * 100));
};

// Wood L: pulls toward a balanced midpoint (BALANCED_WOOD).
// For floor↔front pairs the direction is role-determined so that starting from
// the floor or from the fronts both agree: floor is lighter, fronts are darker.
// For other role pairs: balanced-midpoint direction (closer to 0.5 → less pull).
const BALANCED_WOOD      = 0.5;
const MAX_WOOD_DIFFERENCE = 0.2;

const woodLIdeal: IdealFn = (ctx) => {
  const anchorLNorm = ctx.anchor.lightness / 100;
  const diff        = anchorLNorm - BALANCED_WOOD;
  const magnitude   = MAX_WOOD_DIFFERENCE * Math.sqrt(Math.abs(diff) / BALANCED_WOOD);
  const anchorRole  = ctx.anchor.role[0];
  if (ctx.candidateRole === 'front' && anchorRole === 'floor') return clamp01(anchorLNorm - magnitude);
  if (ctx.candidateRole === 'floor' && anchorRole === 'front') return clamp01(anchorLNorm + magnitude);
  return clamp01(anchorLNorm - Math.sign(diff) * magnitude);
};

// ─── Candidate specs ──────────────────────────────────────────────────────────
// One entry per candidateTexture. Each axis: { ideal: IdealFn, tolerance: per-style }.
// Tolerance = no-punishment zone in 0–1 space. Tighter → axis is more decisive.

interface StyleTolerance { quiet: number; grounded: number; intentional: number }
interface AxisSpec { ideal: IdealFn; tolerance: StyleTolerance }
interface CandidateSpec { L: AxisSpec; W: AxisSpec; H: AxisSpec; C: AxisSpec; P: AxisSpec }

const CANDIDATE_SPECS: Record<string, CandidateSpec> = {
  plain: {
    L: { ideal: lDelta(+0.10),          tolerance: { quiet: 0.06, grounded: 0.10, intentional: 0.14 } },
    W: { ideal: wDelta(-0.05),          tolerance: { quiet: 0.03, grounded: 0.06, intentional: 0.12 } },
    H: { ideal: hAbsolute(0),           tolerance: { quiet: 0.02, grounded: 0.03, intentional: 0.06 } },
    C: { ideal: cActivityDelta(-0.08),  tolerance: { quiet: 0.03, grounded: 0.06, intentional: 0.10 } },
    P: { ideal: pActivityDelta(0),      tolerance: { quiet: 0.02, grounded: 0.04, intentional: 0.08 } },
  },
  wood: {
    L: { ideal: woodLIdeal,             tolerance: { quiet: 0.05, grounded: 0.08, intentional: 0.12 } },
    W: { ideal: wDelta(0),              tolerance: { quiet: 0.05, grounded: 0.08, intentional: 0.14 } },
    H: { ideal: hAbsolute(0),           tolerance: { quiet: 0.02, grounded: 0.03, intentional: 0.06 } },
    C: { ideal: cActivityDelta(-0.05),  tolerance: { quiet: 0.05, grounded: 0.08, intentional: 0.12 } },
    P: { ideal: pActivityDelta(0),      tolerance: { quiet: 0.05, grounded: 0.08, intentional: 0.12 } },
  },
  stone: {
    L: { ideal: lDelta(+0.05),          tolerance: { quiet: 0.07, grounded: 0.12, intentional: 0.16 } },
    W: { ideal: wDelta(-0.08),          tolerance: { quiet: 0.03, grounded: 0.06, intentional: 0.12 } },
    H: { ideal: hAbsolute(0),           tolerance: { quiet: 0.03, grounded: 0.05, intentional: 0.08 } },
    C: { ideal: cActivityDelta(-0.12),  tolerance: { quiet: 0.03, grounded: 0.05, intentional: 0.10 } },
    P: { ideal: pActivityDelta(0.05),  tolerance: { quiet: 0.05, grounded: 0.15, intentional: 0.30 } },
  },
  textile: {
    L: { ideal: lDelta(+0.08),          tolerance: { quiet: 0.06, grounded: 0.10, intentional: 0.14 } },
    W: { ideal: wDelta(-0.03),          tolerance: { quiet: 0.04, grounded: 0.07, intentional: 0.14 } },
    H: { ideal: hAbsolute(0),           tolerance: { quiet: 0.02, grounded: 0.04, intentional: 0.07 } },
    C: { ideal: cActivityDelta(-0.05),  tolerance: { quiet: 0.04, grounded: 0.07, intentional: 0.12 } },
    P: { ideal: pActivityDelta(+0.05),  tolerance: { quiet: 0.04, grounded: 0.06, intentional: 0.10 } },
  },
};

// ─── Chromatic plain spec ─────────────────────────────────────────────────────
// Single spec for all plain materials with raw chroma ≥ PLAIN_CHROMA_THRESHOLD.
// Replaces the former muted/bold split which caused cliff effects at vc=30.

const PLAIN_CHROMA_THRESHOLD = 15;  // below → neutral plain spec

const CANDIDATE_SPEC_PLAIN_CHROMATIC: CandidateSpec = {
  L: { ideal: lDelta(+0.10),       tolerance: { quiet: 0.06, grounded: 0.10, intentional: 0.16 } },
  W: { ideal: wDelta(-0.05),       tolerance: { quiet: 0.03, grounded: 0.06, intentional: 0.12 } },
  H: { ideal: hChromatic,          tolerance: { quiet: 0.16, grounded: 0.30, intentional: 0.50 } },
  C: { ideal: cCompositionAligned, tolerance: { quiet: 0.08, grounded: 0.15, intentional: 0.22 } },
  P: { ideal: pActivityDelta(0),   tolerance: { quiet: 0.02, grounded: 0.04, intentional: 0.08 } },
};

// Wood-on-wood: hue undertone match dominates at all style levels (very tight H tolerance).
// woodLIdeal handles both the general wood case and wood-on-wood via role detection.
const CANDIDATE_SPEC_WOOD_ON_WOOD: CandidateSpec = {
  L: { ideal: woodLIdeal,             tolerance: { quiet: 0.05, grounded: 0.07, intentional: 0.10 } },
  W: { ideal: wDelta(0),              tolerance: { quiet: 0.06, grounded: 0.08, intentional: 0.12 } },
  H: { ideal: hAbsolute(0),           tolerance: { quiet: 0.01, grounded: 0.01, intentional: 0.02 } },
  C: { ideal: cActivityDelta(-0.03),  tolerance: { quiet: 0.08, grounded: 0.10, intentional: 0.14 } },
  P: { ideal: pActivityDelta(0),      tolerance: { quiet: 0.08, grounded: 0.10, intentional: 0.14 } },
};

function getCandidateSpec(
  candidateTexture: string,
  anchorTexture: string,
  candidateChroma?: number,
): CandidateSpec {
  if (candidateTexture === 'wood' && anchorTexture === 'wood') return CANDIDATE_SPEC_WOOD_ON_WOOD;
  if (candidateTexture === 'plain' && candidateChroma != null && candidateChroma >= PLAIN_CHROMA_THRESHOLD) {
    return CANDIDATE_SPEC_PLAIN_CHROMATIC;
  }
  return CANDIDATE_SPECS[candidateTexture] ?? CANDIDATE_SPECS['plain'];
}

// ─────────────────────────────────────────────────────────────────────────────

/** Returns the already-placed material with the highest visual weight (the palette anchor). */
export function identifyAnchor(
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
): GraphMaterial | null {
  let anchor: GraphMaterial | null = null;
  let best = -1;
  for (const code of placedCodes) {
    const mat = byCode.get(code);
    if (!mat) continue;
    const weight = ROLE_ANCHOR_WEIGHT[mat.role[0]] ?? 0;
    if (weight > best) { best = weight; anchor = mat; }
  }
  return anchor;
}

/** Axis 5 error — Texture variety. Plain is excluded from family counting. */
function textureError(
  candidate: GraphMaterial,
  placedMaterials: GraphMaterial[],
  anchor: GraphMaterial,
  style: StyleMode,
): number {
  if (candidate.texture === 'plain') return 0;
  if (placedMaterials.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const m of placedMaterials) {
    if (m.texture === 'plain') continue;
    counts.set(m.texture, (counts.get(m.texture) ?? 0) + 1);
  }
  const ct = candidate.texture;
  if (!counts.has(ct)) return counts.size >= TEXTURE_MAX_FAMILIES[style] ? 1.0 : 0.0;
  if (ct === anchor.texture) return 0;
  const existing = counts.get(ct)!;
  return existing >= Math.max(...counts.values()) ? 1.0 : 0.5;
}

/** Per-axis errors in normalized 0–1 space: [L, W, H, C, T, P].
 *  No weights — importance is expressed through tolerance tightness in CANDIDATE_SPECS. */
function computeNormalizedErrors(
  candidate: GraphMaterial,
  anchor: GraphMaterial,
  placedMaterials: GraphMaterial[],
  candidateRole: string,
  style: StyleMode,
  composition: CompositionState,
): [number, number, number, number, number, number] {
  const isChromatic = candidate.texture === 'plain' && (candidate.chroma ?? 0) >= PLAIN_CHROMA_THRESHOLD;
  const spec = getCandidateSpec(candidate.texture, anchor.texture, candidate.chroma);
  const anchorActivity = computeActivity(anchor);
  const ctx: IdealContext = { anchor, candidateRole, style, anchorActivity, composition, candidateLightness: candidate.lightness };

  // L
  const eL = toleratedError(candidate.lightness / 100, spec.L.ideal(ctx), spec.L.tolerance[style]);

  // W
  const eW = toleratedError(candidate.warmth, spec.W.ideal(ctx), spec.W.tolerance[style]);

  // H: shortest arc / 90 → 0–1 (90° = full error).
  // Chromatic plains use composition dominantHue as reference (not just floor).
  let eH: number;
  const hRef = isChromatic && composition.dominantHue != null ? composition.dominantHue : anchor.hue_angle;
  if (candidate.hue_angle == null && hRef == null) {
    eH = 0;
  } else if (candidate.hue_angle == null) {
    eH = (anchor.chroma / 100) * colourSalience(anchor.lightness);
  } else if (hRef == null) {
    eH = 0;
  } else {
    const d   = Math.abs(candidate.hue_angle - hRef);
    const arc = Math.min(d, 360 - d);
    eH = toleratedError(arc / 90, spec.H.ideal(ctx), spec.H.tolerance[style]);
  }

  // C: × colourSalience so chroma errors shrink at extreme lightness
  const eC = toleratedError(candidate.chroma / 100, spec.C.ideal(ctx), spec.C.tolerance[style])
    * colourSalience(candidate.lightness);

  // T: categorical, scaled to stay secondary to continuous axes
  const eT = textureError(candidate, placedMaterials, anchor, style) * TEXTURE_ERROR_SCALE;

  // P: backsplash exempt; overload factor when new texture exceeds family limit
  const nonPlainCounts = new Map<string, number>();
  for (const m of placedMaterials) {
    if (m.texture !== 'plain') nonPlainCounts.set(m.texture, (nonPlainCounts.get(m.texture) ?? 0) + 1);
  }
  const isNewTextureOverLimit =
    candidate.texture !== 'plain' &&
    !nonPlainCounts.has(candidate.texture) &&
    nonPlainCounts.size >= TEXTURE_MAX_FAMILIES[style];
  const effectivePattern = candidate.texture === anchor.texture
    ? Math.max(0, candidate.pattern - anchor.pattern)
    : candidate.pattern;
  const ePRaw = candidateRole === 'backsplash'
    ? 0
    : toleratedError(effectivePattern / 100, spec.P.ideal(ctx), spec.P.tolerance[style]);
  const eP = isNewTextureOverLimit ? ePRaw * PATTERN_TEXTURE_OVERLOAD_FACTOR : ePRaw;

  return [eL, eW, eH, eC, eT, eP];
}

/** Ideal target values [idealL, idealW, idealC, idealP, anchorH] for the debug overlay. */
export function computeIdealTargets(
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  style: StyleMode,
  candidateTexture: string,
  anchorTexture: string,
): { idealL: number; idealW: number; idealC: number; idealP: number; anchorH: number | null } | null {
  const anchor = identifyAnchor(placedCodes, byCode);
  if (!anchor) return null;
  const placedMaterials = placedCodes.map((c) => byCode.get(c)).filter((m): m is GraphMaterial => !!m);
  const composition    = computeCompositionState(placedMaterials);
  const anchorActivity = computeActivity(anchor);
  const spec = getCandidateSpec(candidateTexture, anchorTexture);
  const ctx: IdealContext = { anchor, candidateRole, style, anchorActivity, composition, candidateLightness: 50 };

  return {
    idealL:  Math.round(spec.L.ideal(ctx) * 100),
    idealW:  Math.round(spec.W.ideal(ctx) * 100) / 100,
    idealC:  Math.round(spec.C.ideal(ctx) * 100 * 10) / 10,
    idealP:  Math.round(spec.P.ideal(ctx) * 100 * 10) / 10,
    anchorH: anchor.hue_angle ?? null,
  };
}

/** Raw per-axis errors [L, W, H, C, T, P] for a single candidate (normalized 0–1). */
export function computeAxisErrors(
  candidate: GraphMaterial,
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  style: StyleMode,
): [number, number, number, number, number, number] {
  const anchor = identifyAnchor(placedCodes, byCode);
  if (!anchor) return [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  const placedMaterials = placedCodes.map((c) => byCode.get(c)).filter((m): m is GraphMaterial => !!m);
  const composition = computeCompositionState(placedMaterials);
  return computeNormalizedErrors(candidate, anchor, placedMaterials, candidateRole, style, composition);
}

/** Combined distance-to-ideal score for a single candidate. Returns 0–1.
 *  score = 1 / (1 + sum(error^SCORE_ERROR_POWER)); perfect match → 1.0. */
export function scoreCandidate(
  candidate: GraphMaterial,
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  style: StyleMode,
): number {
  const anchor = identifyAnchor(placedCodes, byCode);
  if (!anchor) return NO_ANCHOR_SCORE;
  const placedMaterials = placedCodes.map((c) => byCode.get(c)).filter((m): m is GraphMaterial => !!m);
  const composition = computeCompositionState(placedMaterials);
  const errors = computeNormalizedErrors(candidate, anchor, placedMaterials, candidateRole, style, composition);
  const d = errors.reduce((s, e) => s + e ** SCORE_ERROR_POWER, 0);
  return 1 / (1 + d);
}

/** Rank a group of candidates by within-group harmony using per-axis min-subtraction.
 *  Neutralises axes where all members are structurally stuck, without explicit weights. */
export function rankWithinCluster(
  members: GraphMaterial[],
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  style: StyleMode,
): GraphMaterial[] {
  if (members.length <= 1) return [...members];
  const anchor = identifyAnchor(placedCodes, byCode);
  if (!anchor) return [...members];

  const placedMaterials = placedCodes.map((c) => byCode.get(c)).filter((m): m is GraphMaterial => !!m);
  const composition = computeCompositionState(placedMaterials);

  type SixErrors = [number, number, number, number, number, number];
  const allErrors: SixErrors[] = members.map((m) =>
    computeNormalizedErrors(m, anchor, placedMaterials, candidateRole, style, composition)
  );

  const mins = ([0, 1, 2, 3, 4, 5] as const).map((i) =>
    Math.min(...allErrors.map((e) => e[i]))
  );

  const pw = SCORE_ERROR_POWER;
  return [...members]
    .map((m, mi) => {
      const d = allErrors[mi].reduce((s, e, i) => s + Math.max(0, e - mins[i]) ** pw, 0);
      return { m, score: 1 / (1 + d) };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
}

/** Returns candidates sorted descending by palette harmony score. */
export function rankByPaletteScore(
  candidates: GraphMaterial[],
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  style: StyleMode,
): GraphMaterial[] {
  const scores = new Map(
    candidates.map((c) => [
      c.technicalCode,
      scoreCandidate(c, placedCodes, byCode, candidateRole, style),
    ])
  );
  return [...candidates].sort(
    (a, b) => (scores.get(b.technicalCode) ?? 0) - (scores.get(a.technicalCode) ?? 0)
  );
}
