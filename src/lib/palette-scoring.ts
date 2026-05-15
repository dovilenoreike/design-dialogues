import type { GraphMaterial } from '@/lib/graph-compatibility';

export type StyleMode = 'quiet' | 'grounded' | 'intentional';

// ─── Role anchor weights (higher = stronger anchor candidate) ─────────────────
const ROLE_ANCHOR_WEIGHT: Record<string, number> = {
  floor:      4,
  front:      3,
  worktop:    2,
  backsplash: 1,
};

// ─── Score tuning ─────────────────────────────────────────────────────────────
const SCORE_ERROR_POWER = 1.5;
const NO_ANCHOR_SCORE   = 0.5;

// ─── Texture error scaling ────────────────────────────────────────────────────
// textureError() returns categorical 0 / 0.5 / 1.0; scale so it doesn't
// dominate the continuous axes (L, W, H, C, P) that live in the same 0–1 space.
const TEXTURE_ERROR_SCALE = 0.20;

// ─── Candidate specs ──────────────────────────────────────────────────────────
// All values in normalized 0–1 space (L: /100, W: as-is, H: arc/180, C: /100, P: /100).
// idealDelta: anchor-relative offset (same for all styles — the ideal is style-independent).
// tolerance: per-style no-punishment zone; tighter = axis is more decisive.
// H idealDelta = 0: closest hue always wins.
// C, P: activity-derived ideal is the base; idealDelta adjusts texture-specifically on top.

interface StyleTolerance { quiet: number; grounded: number; intentional: number }
interface AxisSpec { idealDelta: number; tolerance: StyleTolerance }
interface CandidateSpec { L: AxisSpec; W: AxisSpec; H: AxisSpec; C: AxisSpec; P: AxisSpec }

const CANDIDATE_SPECS: Record<string, CandidateSpec> = {
  plain: {
    L: { idealDelta: +0.10, tolerance: { quiet: 0.06, grounded: 0.10, intentional: 0.14 } },
    W: { idealDelta: -0.05, tolerance: { quiet: 0.03, grounded: 0.06, intentional: 0.12 } },
    H: { idealDelta:  0,    tolerance: { quiet: 0.02, grounded: 0.03, intentional: 0.06 } },
    C: { idealDelta: -0.08, tolerance: { quiet: 0.03, grounded: 0.06, intentional: 0.10 } },
    P: { idealDelta:  0,    tolerance: { quiet: 0.02, grounded: 0.04, intentional: 0.08 } },
  },
  wood: {
    L: { idealDelta: +0.08, tolerance: { quiet: 0.05, grounded: 0.08, intentional: 0.12 } },
    W: { idealDelta:  0,    tolerance: { quiet: 0.05, grounded: 0.08, intentional: 0.14 } },
    H: { idealDelta:  0,    tolerance: { quiet: 0.02, grounded: 0.03, intentional: 0.06 } },
    C: { idealDelta: -0.05, tolerance: { quiet: 0.05, grounded: 0.08, intentional: 0.12 } },
    P: { idealDelta:  0,    tolerance: { quiet: 0.05, grounded: 0.08, intentional: 0.12 } },
  },
  stone: {
    L: { idealDelta: +0.05, tolerance: { quiet: 0.07, grounded: 0.12, intentional: 0.16 } },
    W: { idealDelta: -0.08, tolerance: { quiet: 0.03, grounded: 0.06, intentional: 0.12 } },
    H: { idealDelta:  0,    tolerance: { quiet: 0.03, grounded: 0.05, intentional: 0.08 } },
    C: { idealDelta: -0.12, tolerance: { quiet: 0.03, grounded: 0.05, intentional: 0.10 } },
    P: { idealDelta: -0.05, tolerance: { quiet: 0.04, grounded: 0.06, intentional: 0.10 } },
  },
  textile: {
    L: { idealDelta: +0.08, tolerance: { quiet: 0.06, grounded: 0.10, intentional: 0.14 } },
    W: { idealDelta: -0.03, tolerance: { quiet: 0.04, grounded: 0.07, intentional: 0.14 } },
    H: { idealDelta:  0,    tolerance: { quiet: 0.02, grounded: 0.04, intentional: 0.07 } },
    C: { idealDelta: -0.05, tolerance: { quiet: 0.04, grounded: 0.07, intentional: 0.12 } },
    P: { idealDelta: +0.05, tolerance: { quiet: 0.04, grounded: 0.06, intentional: 0.10 } },
  },
};

// Wood-on-wood: hue undertone match dominates at all style levels (very tight H tolerance).
const CANDIDATE_SPEC_WOOD_ON_WOOD: CandidateSpec = {
  L: { idealDelta: +0.08, tolerance: { quiet: 0.05, grounded: 0.07, intentional: 0.10 } },
  W: { idealDelta:  0,    tolerance: { quiet: 0.06, grounded: 0.08, intentional: 0.12 } },
  H: { idealDelta:  0,    tolerance: { quiet: 0.01, grounded: 0.01, intentional: 0.02 } },
  C: { idealDelta: -0.03, tolerance: { quiet: 0.08, grounded: 0.10, intentional: 0.14 } },
  P: { idealDelta:  0,    tolerance: { quiet: 0.08, grounded: 0.10, intentional: 0.14 } },
};

function getCandidateSpec(candidateTexture: string, anchorTexture: string): CandidateSpec {
  if (candidateTexture === 'wood' && anchorTexture === 'wood') return CANDIDATE_SPEC_WOOD_ON_WOOD;
  return CANDIDATE_SPECS[candidateTexture] ?? CANDIDATE_SPECS['plain'];
}

function toleratedError(actual: number, ideal: number, tol: number): number {
  return Math.max(0, Math.abs(actual - ideal) - tol);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ─── Colour salience ──────────────────────────────────────────────────────────
// sin(π·L/100) peaks at 1.0 at L=50, → 0 at L=0 and L=100.
// Applied to chroma errors: very dark/light surfaces are perceptually achromatic.
function colourSalience(lightness: number): number {
  return Math.sin(Math.PI * Math.max(0, Math.min(100, lightness)) / 100);
}

// ─── Activity-derived ideal factors ──────────────────────────────────────────
const CHROMA_ACTIVITY_FACTOR: Record<StyleMode, number> = {
  quiet:       0.55,
  grounded:    0.30,
  intentional: 0.50,
};

const PATTERN_ACTIVITY_FACTOR: Record<StyleMode, number> = {
  quiet:       0.75,
  grounded:    0.45,
  intentional: 0.70,
};

// ─── Texture variety limits ───────────────────────────────────────────────────
const TEXTURE_MAX_FAMILIES: Record<StyleMode, number> = {
  quiet: 2, grounded: 3, intentional: 3,
};

const PATTERN_TEXTURE_OVERLOAD_FACTOR = 2.0;

// ─── Activity metric ──────────────────────────────────────────────────────────
const TEXTURE_COMPLEXITY: Record<string, number> = {
  plain: 0, wood: 0.65, stone: 0.35, metal: 0.15,
};

function computeActivity(m: GraphMaterial): number {
  const tc = TEXTURE_COMPLEXITY[m.texture] ?? 0;
  return Math.min(100, m.pattern * 0.55 + m.chroma * 0.30 + tc * 15);
}

// ─── Composition state ────────────────────────────────────────────────────────
const ROLE_VISUAL_MASS: Record<string, number> = {
  floor: 0.35, front: 0.30, worktop: 0.10, backsplash: 0.05,
};

interface CompositionState {
  dominantWarmth:      number;
  compositionActivity: number;
}

function computeCompositionState(placed: GraphMaterial[]): CompositionState {
  let totalW = 0, warmthSum = 0, activitySum = 0;
  for (const m of placed) {
    const w = ROLE_VISUAL_MASS[m.role[0]] ?? 0.10;
    warmthSum   += m.warmth * w;
    activitySum += computeActivity(m) * w;
    totalW += w;
  }
  if (!totalW) return { dominantWarmth: 0, compositionActivity: 0 };
  return { dominantWarmth: warmthSum / totalW, compositionActivity: activitySum / totalW };
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
  if (!counts.has(ct)) {
    return counts.size >= TEXTURE_MAX_FAMILIES[style] ? 1.0 : 0.0;
  }
  if (ct === anchor.texture) return 0;
  const existing = counts.get(ct)!;
  const maxCount = Math.max(...counts.values());
  return existing >= maxCount ? 1.0 : 0.5;
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
  const spec = getCandidateSpec(candidate.texture, anchor.texture);
  const anchorActivity = computeActivity(anchor);

  // L: normalized /100
  const eL = toleratedError(
    candidate.lightness / 100,
    clamp01(anchor.lightness / 100 + spec.L.idealDelta),
    spec.L.tolerance[style],
  );

  // W: already 0–1
  const eW = toleratedError(
    candidate.warmth,
    clamp01(anchor.warmth + spec.W.idealDelta),
    spec.W.tolerance[style],
  );

  // H: shortest arc / 180 → 0–1; null handling
  let eH: number;
  if (candidate.hue_angle == null && anchor.hue_angle == null) {
    eH = 0;
  } else if (candidate.hue_angle == null) {
    eH = (anchor.chroma / 100) * colourSalience(anchor.lightness);
  } else if (anchor.hue_angle == null) {
    eH = 0;
  } else {
    const d = Math.abs(candidate.hue_angle - anchor.hue_angle);
    const arc = Math.min(d, 360 - d);
    //eH = toleratedError(arc / 180, spec.H.idealDelta, spec.H.tolerance[style]);
    eH = toleratedError(arc / 90, spec.H.idealDelta, spec.H.tolerance[style]);
  }

  // C: activity-derived ideal + idealDelta, × colourSalience
  const activityIdealC = Math.max(5, anchor.chroma - anchorActivity * CHROMA_ACTIVITY_FACTOR[style]) / 100;
  const eC = toleratedError(
    candidate.chroma / 100,
    clamp01(activityIdealC + spec.C.idealDelta),
    spec.C.tolerance[style],
  ) * colourSalience(candidate.lightness);

  // T: categorical, scaled to stay secondary to continuous axes
  const eT = textureError(candidate, placedMaterials, anchor, style) * TEXTURE_ERROR_SCALE;

  // P: activity-derived ideal + idealDelta; worktop exception; overload factor
  let activityIdealP: number;
  if (candidateRole === 'worktop' && composition.compositionActivity < 30) {
    activityIdealP = (composition.compositionActivity + (30 - composition.compositionActivity) * 0.8) / 100;
  } else {
    activityIdealP = Math.max(0, anchor.pattern - anchorActivity * PATTERN_ACTIVITY_FACTOR[style]) / 100;
  }
  const idealP = clamp01(activityIdealP + spec.P.idealDelta);
  const effectivePattern = candidate.texture === anchor.texture
    ? Math.max(0, candidate.pattern - anchor.pattern)
    : candidate.pattern;
  const nonPlainCounts = new Map<string, number>();
  for (const m of placedMaterials) {
    if (m.texture !== 'plain') nonPlainCounts.set(m.texture, (nonPlainCounts.get(m.texture) ?? 0) + 1);
  }
  const isNewTextureOverLimit =
    candidate.texture !== 'plain' &&
    !nonPlainCounts.has(candidate.texture) &&
    nonPlainCounts.size >= TEXTURE_MAX_FAMILIES[style];
  const ePRaw = candidateRole === 'backsplash'
    ? 0
    : toleratedError(effectivePattern / 100, idealP, spec.P.tolerance[style]);
  const eP = isNewTextureOverLimit ? ePRaw * PATTERN_TEXTURE_OVERLOAD_FACTOR : ePRaw;

  return [eL, eW, eH, eC, eT, eP];
}

/** Ideal target values [idealL, idealW, idealC, idealP, anchorH] for the debug overlay.
 *  Derived from anchor + style + candidate texture. */
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
  const composition = computeCompositionState(placedMaterials);
  const anchorActivity = computeActivity(anchor);
  const spec = getCandidateSpec(candidateTexture, anchorTexture);

  const idealL = clamp01(anchor.lightness / 100 + spec.L.idealDelta) * 100;
  const idealW = clamp01(anchor.warmth + spec.W.idealDelta);

  const activityIdealC = Math.max(5, anchor.chroma - anchorActivity * CHROMA_ACTIVITY_FACTOR[style]) / 100;
  const idealC = clamp01(activityIdealC + spec.C.idealDelta) * 100;

  let activityIdealP: number;
  if (candidateRole === 'worktop' && composition.compositionActivity < 30) {
    activityIdealP = (composition.compositionActivity + (30 - composition.compositionActivity) * 0.8) / 100;
  } else {
    activityIdealP = Math.max(0, anchor.pattern - anchorActivity * PATTERN_ACTIVITY_FACTOR[style]) / 100;
  }
  const idealP = clamp01(activityIdealP + spec.P.idealDelta) * 100;

  return {
    idealL: Math.round(idealL),
    idealW: Math.round(idealW * 100) / 100,
    idealC: Math.round(idealC * 10) / 10,
    idealP: Math.round(idealP * 10) / 10,
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
