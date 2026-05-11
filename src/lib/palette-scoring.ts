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
// Ideal absolute delta from anchor, per style and role.
const LIGHTNESS_IDEAL_DELTA: Record<StyleMode, Record<string, number>> = {
  quiet:       { front: 10, worktop: 8,  backsplash: 15 },
  grounded:    { front: 15, worktop: 20, backsplash: 15 },
  intentional: { front: 25, worktop: 32, backsplash: 22 },
};
// Error reaches 1.0 this many points away from ideal delta.
const LIGHTNESS_DELTA_SCALE = 25;
// Plain (lacquer/paint) fronts going lighter than the anchor blend with the wall — softer slope.
// Applies only when candidate.lightness > anchor.lightness. Going darker stays normally penalised.
const LIGHTNESS_PLAIN_SCALE_BONUS = 20;
const LIGHTNESS_NO_ANCHOR_SCORE = 0.5;

// ─── Axis 2: Warmth ───────────────────────────────────────────────────────────
// quiet/grounded: ideal = anchor.warmth (match temperature).
// intentional:    ideal = -anchor.warmth (invite opposite temperature).
const WARMTH_SCALE: Record<StyleMode, number> = {
  quiet:       0.35,
  grounded:    0.55,
  intentional: 0.70,
};

// ─── Axis 3: Hue undertone ────────────────────────────────────────────────────
// Ideal angular distance between anchor and candidate hue.
const HUE_IDEAL_DIST: Record<StyleMode, number> = {
  quiet:       0,    // same hue family
  grounded:    35,   // related but distinct
  intentional: 180,  // complementary
};
const HUE_SCALE = 180;

// ─── Axis 4: Chroma ───────────────────────────────────────────────────────────
// quiet/grounded: minimise chroma delta (similar saturation level).
// intentional:    no constraint (allow any chroma, neither reward nor penalise).
const CHROMA_SCALE: Partial<Record<StyleMode, number>> = {
  quiet:    6,
  grounded: 12,
};

// ─── Axis 5: Texture ──────────────────────────────────────────────────────────
const TEXTURE_MAX_FAMILIES: Record<StyleMode, number> = {
  quiet: 2, grounded: 3, intentional: 3,
};

// ─── Axis 6: Pattern ──────────────────────────────────────────────────────────
// Projected total: paletteSum + candidate.pattern.
// Quiet/grounded use tighter budgets — bold patterns are strongly penalised.
// No upper cap: errors > 1.0 are intentional for quiet/grounded with heavy pattern.
const PATTERN_PROJ_FREE: Record<StyleMode, number> = {
  quiet:       25,
  grounded:    30,
  intentional: 40,
};
const PATTERN_PROJ_SCALE: Record<StyleMode, number> = {
  quiet:       40,
  grounded:    55,
  intentional: 80,
};
// Compound factor: applied when a new texture exceeds the family limit AND brings pattern.
const PATTERN_TEXTURE_OVERLOAD_FACTOR = 2.0;

// ─────────────────────────────────────────────────────────────────────────────

/** Returns the already-placed material with the highest visual weight (the palette anchor).
 *  Uses role[0] as primary role. Returns null when no codes are placed. */
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

/** Axis 1 error — Lightness.
 *  All styles: distance from ideal contrast delta.
 *  Plain texture: wider ideal and scale (absorbs wall colour, large delta reads neutral).
 *  Wood-on-wood fronts: directional — candidate should be darker than anchor. */
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
    // Signed: positive = candidate is darker. Penalises lighter-than-anchor.
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

/** Axis 3 error — Hue undertone. Achromatic (null hue_angle) = no constraint. */
function hueError(
  candidate: GraphMaterial,
  anchor: GraphMaterial,
  style: StyleMode,
): number {
  if (anchor.hue_angle == null || candidate.hue_angle == null) return 0;
  const d = Math.abs(candidate.hue_angle - anchor.hue_angle);
  const actualDist = Math.min(d, 360 - d);
  return Math.abs(actualDist - HUE_IDEAL_DIST[style]) / HUE_SCALE;
}

/** Axis 4 error — Chroma. Quiet/grounded: minimise delta. Intentional: no constraint. */
function chromaError(
  candidate: GraphMaterial,
  anchor: GraphMaterial,
  style: StyleMode,
): number {
  const scale = CHROMA_SCALE[style];
  if (!scale) return 0;
  if (candidate.chroma <= 5) return 0; // achromatic candidate = neutral, no penalty
  const delta = Math.abs(candidate.chroma - anchor.chroma);
  if (delta < 5) return 0; // imperceptible difference
  return delta / scale;
}

/** Axis 5 error — Texture variety.
 *  Plain texture (lacquer/paint) is excluded from family counting — it reads as
 *  wall-coloured and adds no visual texture complexity.
 *  0.0 = plain candidate (always neutral), new texture within family limit, or matches anchor texture (cohesion).
 *  0.5 = present from non-anchor surface, not dominant.
 *  1.0 = dominant non-anchor repeat, or new texture exceeds family limit. */
function textureError(
  candidate: GraphMaterial,
  placedMaterials: GraphMaterial[],
  anchor: GraphMaterial,
  style: StyleMode,
): number {
  // Plain is neutral — never adds to or exceeds texture complexity
  if (candidate.texture === 'plain') return 0;
  if (placedMaterials.length === 0) return 0;
  // Build counts excluding plain (plain doesn't occupy a texture family slot)
  const counts = new Map<string, number>();
  for (const m of placedMaterials) {
    if (m.texture === 'plain') continue;
    counts.set(m.texture, (counts.get(m.texture) ?? 0) + 1);
  }
  const ct = candidate.texture;
  if (!counts.has(ct)) {
    return counts.size >= TEXTURE_MAX_FAMILIES[style] ? 1.0 : 0.0;
  }
  // Matches anchor texture = cohesion (e.g. wood floor + wood front) — no penalty.
  if (ct === anchor.texture) return 0;
  // Already present from a non-anchor surface = real accumulation.
  const existing = counts.get(ct)!;
  const maxCount = Math.max(...counts.values());
  return existing >= maxCount ? 1.0 : 0.5;
}

/** Axis 6 error — Pattern budget. Uses projected total (paletteSum + candidate.pattern).
 *  Backsplash always exempt. Error is uncapped — bold patterns in quiet/grounded
 *  intentionally produce errors > 1.0 for a strong penalty.
 *  Same-texture candidate: only the excess over the anchor pattern counts — finer grain
 *  on the same texture family reads as visual continuation, not added complexity. */
function patternError(
  candidate: GraphMaterial,
  placedMaterials: GraphMaterial[],
  candidateRole: string,
  style: StyleMode,
  anchor: GraphMaterial,
): number {
  if (candidateRole === 'backsplash') return 0;
  const candidateContribution =
    candidate.texture === anchor.texture
      ? Math.max(0, candidate.pattern - anchor.pattern)
      : candidate.pattern;
  const projected = placedMaterials.reduce((s, m) => s + m.pattern, 0) + candidateContribution;
  return Math.max(0, projected - PATTERN_PROJ_FREE[style]) / PATTERN_PROJ_SCALE[style];
}

/** Combined distance-to-ideal score for a single candidate. Returns 0–1.
 *  score = 1 / (1 + weighted_error_sum); perfect match → 1.0, worst case → ~0.5. */
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

  const errPRaw = patternError(candidate, placedMaterials, candidateRole, style, anchor);
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
