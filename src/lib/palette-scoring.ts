import type { GraphMaterial } from '@/lib/graph-compatibility';

export type StyleMode = 'quiet' | 'grounded' | 'intentional';

// ─── Role anchor weights (higher = stronger anchor candidate) ─────────────────
const ROLE_ANCHOR_WEIGHT: Record<string, number> = {
  floor:      4,
  front:      3,
  worktop:    2,
  backsplash: 1,
};

// ─── Combined axis weights [lightness, warmth, hue, chroma, texture, pattern] ─
const AXIS_WEIGHTS: Record<StyleMode, [number, number, number, number, number, number]> = {
  quiet:       [0.20, 0.25, 0.15, 0.10, 0.15, 0.15],
  grounded:    [0.20, 0.20, 0.15, 0.10, 0.20, 0.15],
  intentional: [0.30, 0.15, 0.20, 0.05, 0.20, 0.10],
};

// ─── Axis 1: Lightness ────────────────────────────────────────────────────────
const LIGHTNESS_IDEAL_DELTA: Record<StyleMode, Record<string, number>> = {
  quiet:       { front: 10, worktop: 8,  backsplash: 15 },
  grounded:    { front: 15, worktop: 20, backsplash: 15 },
  intentional: { front: 25, worktop: 32, backsplash: 22 },
};
const LIGHTNESS_DELTA_SCALE = 25;
const LIGHTNESS_PLAIN_SCALE_BONUS = 20;
const LIGHTNESS_NO_ANCHOR_SCORE = 0.5;

// ─── Axis 2: Warmth ───────────────────────────────────────────────────────────
const WARMTH_SCALE: Record<StyleMode, number> = {
  quiet:       0.35,
  grounded:    0.55,
  intentional: 0.70,
};

// ─── Axis 3: Hue undertone ────────────────────────────────────────────────────
const HUE_IDEAL_DIST: Record<StyleMode, number> = {
  quiet:       0,
  grounded:    35,
  intentional: 180,
};
const HUE_SCALE = 180;
// Wood-on-wood hue: undertone family should match — drift reads as a clash.
const HUE_WOOD_SCALE = 70;

// ─── Axis 4: Chroma ───────────────────────────────────────────────────────────
const CHROMA_SCALE: Partial<Record<StyleMode, number>> = {
  quiet:    6,
  grounded: 12,
};

// How much the ideal candidate chroma drops per unit of anchor activity.
const CHROMA_ACTIVITY_FACTOR: Record<StyleMode, number> = {
  quiet:       0.55,
  grounded:    0.30,
  intentional: 0.50,
};

// ─── Axis 5: Texture ──────────────────────────────────────────────────────────
const TEXTURE_MAX_FAMILIES: Record<StyleMode, number> = {
  quiet: 2, grounded: 3, intentional: 3,
};

// ─── Axis 6: Pattern ──────────────────────────────────────────────────────────
// Error reaches 1.0 when candidate pattern is this many points from ideal.
const PATTERN_PROJ_SCALE: Record<StyleMode, number> = {
  quiet:       40,
  grounded:    55,
  intentional: 80,
};
// How much the ideal candidate pattern drops per unit of anchor activity.
const PATTERN_ACTIVITY_FACTOR: Record<StyleMode, number> = {
  quiet:       0.75,
  grounded:    0.45,
  intentional: 0.70,
};
// Compound factor: applied when a new texture exceeds the family limit AND brings pattern.
const PATTERN_TEXTURE_OVERLOAD_FACTOR = 2.0;

// ─── Activity metric ──────────────────────────────────────────────────────────
// Texture visual complexity contribution (not DB-stored — per-type constant).
const TEXTURE_COMPLEXITY: Record<string, number> = {
  plain: 0, wood: 0.65, stone: 0.35, metal: 0.15,
};

function computeActivity(m: GraphMaterial): number {
  const tc = TEXTURE_COMPLEXITY[m.texture] ?? 0;
  return Math.min(100, m.pattern * 0.55 + m.chroma * 0.30 + tc * 15);
}

// ─── Composition state ────────────────────────────────────────────────────────
// Visual mass weights for placed materials — heavier surfaces dominate the read.
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

/** Axis 1 error — Lightness. */
function lightnessError(
  candidate: GraphMaterial,
  anchor: GraphMaterial,
  candidateRole: string,
  style: StyleMode,
): number {
  const idealDelta = LIGHTNESS_IDEAL_DELTA[style]?.[candidateRole] ?? 15;
  const isPlainGoingLighter =
    candidate.texture === 'plain' && candidate.lightness > anchor.lightness;
  const scale = isPlainGoingLighter
    ? LIGHTNESS_DELTA_SCALE + LIGHTNESS_PLAIN_SCALE_BONUS
    : LIGHTNESS_DELTA_SCALE;

  const woodOnWoodFront =
    candidateRole === 'front' &&
    candidate.texture === 'wood' &&
    anchor.texture === 'wood';

  if (woodOnWoodFront) {
    const signedDelta = anchor.lightness - candidate.lightness;
    return Math.abs(signedDelta - idealDelta) / scale;
  }

  const actualDelta = Math.abs(candidate.lightness - anchor.lightness);
  return Math.abs(actualDelta - idealDelta) / scale;
}

/** Axis 2 error — Warmth. */
function warmthError(
  candidate: GraphMaterial,
  anchor: GraphMaterial,
  style: StyleMode,
): number {
  const ideal = style === 'intentional' ? -anchor.warmth : anchor.warmth;
  return Math.abs(candidate.warmth - ideal) / WARMTH_SCALE[style];
}

/** Axis 3 error — Hue undertone. Achromatic (null hue_angle) = no constraint.
 *  Wood-on-wood: idealDist = 0° with a tight scale — undertone family must match. */
function hueError(
  candidate: GraphMaterial,
  anchor: GraphMaterial,
  style: StyleMode,
): number {
  if (candidate.hue_angle == null && anchor.hue_angle == null) return 0;
  if (candidate.hue_angle == null) return anchor.chroma / 80; // achromatic candidate next to chromatic anchor
  if (anchor.hue_angle == null) return 0;
  const d = Math.abs(candidate.hue_angle - anchor.hue_angle);
  const actualDist = Math.min(d, 360 - d);
  if (candidate.texture === 'wood' && anchor.texture === 'wood') {
    return actualDist / HUE_WOOD_SCALE;
  }
  return Math.abs(actualDist - HUE_IDEAL_DIST[style]) / HUE_SCALE;
}

/** Axis 4 error — Chroma.
 *  Ideal candidate chroma is derived from anchor activity: the more active the anchor,
 *  the lower the target chroma. Intentional style has no chroma constraint. */
function chromaError(
  candidate: GraphMaterial,
  anchor: GraphMaterial,
  style: StyleMode,
): number {
  const scale = CHROMA_SCALE[style];
  if (!scale) return 0;
  const anchorActivity = computeActivity(anchor);
  const idealChroma = Math.max(5, anchor.chroma - anchorActivity * CHROMA_ACTIVITY_FACTOR[style]);
  return Math.abs(candidate.chroma - idealChroma) / scale;
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

/** Axis 6 error — Pattern.
 *  Ideal candidate pattern is activity-derived: the busier the anchor, the calmer
 *  the next surface should be.
 *  Worktop exception: compensatory role — if the composition is calm, the worktop
 *  is allowed to be expressive (adds richness to an otherwise flat palette).
 *  Backsplash is always exempt. */
function patternError(
  candidate: GraphMaterial,
  candidateRole: string,
  anchor: GraphMaterial,
  composition: CompositionState,
  style: StyleMode,
): number {
  if (candidateRole === 'backsplash') return 0;

  const anchorActivity = computeActivity(anchor);

  let idealPattern: number;
  if (candidateRole === 'worktop' && composition.compositionActivity < 30) {
    // Calm composition: countertop earns the right to introduce richness
    idealPattern = composition.compositionActivity + (30 - composition.compositionActivity) * 0.8;
  } else {
    idealPattern = Math.max(0, anchor.pattern - anchorActivity * PATTERN_ACTIVITY_FACTOR[style]);
  }

  // Same-texture continuation: only the excess over anchor pattern counts.
  // A front with the same texture family and similar or lower grain = visual continuation.
  const effectivePattern = candidate.texture === anchor.texture
    ? Math.max(0, candidate.pattern - anchor.pattern)
    : candidate.pattern;

  return Math.abs(effectivePattern - idealPattern) / PATTERN_PROJ_SCALE[style];
}

/** Combined distance-to-ideal score for a single candidate. Returns 0–1.
 *  score = 1 / (1 + weighted_error_sum); perfect match → 1.0. */
export function scoreCandidate(
  candidate: GraphMaterial,
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  style: StyleMode,
): number {
  const placedMaterials = placedCodes
    .map((c) => byCode.get(c))
    .filter((m): m is GraphMaterial => !!m);
  const anchor = identifyAnchor(placedCodes, byCode);
  if (!anchor) return LIGHTNESS_NO_ANCHOR_SCORE;

  const composition = computeCompositionState(placedMaterials);

  const errL = lightnessError(candidate, anchor, candidateRole, style);
  const errW = warmthError(candidate, anchor, style);
  const errH = hueError(candidate, anchor, style);
  const errC = chromaError(candidate, anchor, style);
  const errT = textureError(candidate, placedMaterials, anchor, style);

  // Compound penalty: new non-plain texture exceeds family limit AND brings high pattern.
  const nonPlainCounts = new Map<string, number>();
  for (const m of placedMaterials) {
    if (m.texture !== 'plain') nonPlainCounts.set(m.texture, (nonPlainCounts.get(m.texture) ?? 0) + 1);
  }
  const isNewTextureOverLimit =
    candidate.texture !== 'plain' &&
    !nonPlainCounts.has(candidate.texture) &&
    nonPlainCounts.size >= TEXTURE_MAX_FAMILIES[style];

  const errPRaw = patternError(candidate, candidateRole, anchor, composition, style);
  const errP = isNewTextureOverLimit ? errPRaw * PATTERN_TEXTURE_OVERLOAD_FACTOR : errPRaw;

  const [wL, wW, wH, wC, wT, wP] = AXIS_WEIGHTS[style];
  const d = wL * errL + wW * errW + wH * errH + wC * errC + wT * errT + wP * errP;
  return 1 / (1 + d);
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
