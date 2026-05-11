import type { GraphMaterial } from '@/lib/graph-compatibility';

export type StyleMode = 'quiet' | 'grounded' | 'intentional';

// ─── Role anchor weights (higher = stronger anchor candidate) ─────────────────
const ROLE_ANCHOR_WEIGHT: Record<string, number> = {
  floor:      4,
  front:      3,
  worktop:    2,
  backsplash: 1,
};

// ─── Axis 1: Lightness ────────────────────────────────────────────────────────
// Target absolute delta [low, high] between candidate and anchor, by style and candidate role.
const LIGHTNESS_RANGES: Record<StyleMode, Record<string, [number, number]>> = {
  quiet:       { front: [5,  20], worktop: [0,  20], backsplash: [0, 30] },
  grounded:    { front: [15, 35], worktop: [10, 30], backsplash: [0, 40] },
  intentional: { front: [30, 55], worktop: [20, 45], backsplash: [0, 50] },
};
// Linear decay width outside range edges before score reaches 0.
const LIGHTNESS_DECAY_WIDTH = 15;
const LIGHTNESS_NO_ANCHOR_SCORE = 0.5;

// ─── Axis 2: Warmth ───────────────────────────────────────────────────────────
// Anchors above STRONG_WARM or below STRONG_COOL activate directional rules.
// Neutral anchors impose no constraint (score = 1.0 for any candidate).
const WARMTH_STRONG_WARM =  0.4;
const WARMTH_STRONG_COOL = -0.4;
// Target zones [low, high] for warm / cool anchors.
const WARMTH_TARGET_WARM_ANCHOR: [number, number] = [-0.2,  0.3];
const WARMTH_TARGET_COOL_ANCHOR: [number, number] = [-0.3,  0.2];
// Score decays to 0 once candidate warmth crosses the penalty boundary.
const WARMTH_PENALTY_WARM =  0.4;
const WARMTH_PENALTY_COOL = -0.4;
const WARMTH_NO_ANCHOR_SCORE = 0.5;

// ─── Axis 3: Hue undertone ────────────────────────────────────────────────────
// Step scores keyed by upper bound of each angular distance zone (degrees).
const HUE_ZONE_SCORES: Array<{ maxDeg: number; score: number }> = [
  { maxDeg:  40, score: 1.0 },  // tight family match
  { maxDeg:  60, score: 0.5 },  // ambiguous
  { maxDeg: 120, score: 0.1 },  // undertone clash
  { maxDeg: 150, score: 0.5 },  // transition zone
  { maxDeg: 210, score: 0.9 },  // complementary
];
// Returned when either material has no hue_angle (achromatic = compatible with anything).
const HUE_NULL_SCORE = 0.5;

// ─── Axis 4: Texture ──────────────────────────────────────────────────────────
const TEXTURE_SCORE_NEW       = 1.0;  // texture not yet in palette (within family limit)
const TEXTURE_SCORE_PRESENT   = 0.5;  // texture present but not dominant
const TEXTURE_SCORE_DOMINANT  = 0.1;  // candidate shares the most-used texture
const TEXTURE_MAX_FAMILIES: Record<StyleMode, number> = {
  quiet: 2, grounded: 3, intentional: 3,
};
const TEXTURE_OVER_LIMIT_SCORE = 0.1;  // new texture would exceed style's family limit

// ─── Axis 5: Pattern ──────────────────────────────────────────────────────────
// Thresholds for palette pattern sum.
const PATTERN_SUM_FREE     = 20;  // below this: any candidate is unconstrained
const PATTERN_SUM_MODERATE = 50;  // above this: strong penalty zone
// Candidate pattern decay ranges when palette sum is in the moderate zone (20–50).
const PATTERN_MOD_SOFT = 30;      // decay starts here
const PATTERN_MOD_HARD = 40;      // score reaches 0 here
// Candidate pattern decay ranges when palette sum exceeds 50.
const PATTERN_HIGH_SOFT = 15;
const PATTERN_HIGH_HARD = 30;

// ─── Combined axis weights [lightness, warmth, undertone, texture, pattern] ───
const AXIS_WEIGHTS: Record<StyleMode, [number, number, number, number, number]> = {
  quiet:       [0.25, 0.30, 0.20, 0.15, 0.10],
  grounded:    [0.25, 0.25, 0.20, 0.20, 0.10],
  intentional: [0.30, 0.20, 0.20, 0.20, 0.10],
};

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

/** Axis 1 — Lightness. Score 1.0 inside target delta range; linear decay outside. */
export function scoreLightness(
  candidate: GraphMaterial,
  anchor: GraphMaterial | null,
  candidateRole: string,
  style: StyleMode,
): number {
  if (!anchor) return LIGHTNESS_NO_ANCHOR_SCORE;
  const range = LIGHTNESS_RANGES[style][candidateRole];
  if (!range) return LIGHTNESS_NO_ANCHOR_SCORE;
  const [low, high] = range;
  const delta = Math.abs(candidate.lightness - anchor.lightness);
  if (delta >= low && delta <= high) return 1.0;
  if (delta < low) return Math.max(0, 1 - (low - delta) / LIGHTNESS_DECAY_WIDTH);
  return Math.max(0, 1 - (delta - high) / LIGHTNESS_DECAY_WIDTH);
}

/** Axis 2 — Warmth. Penalises warmth duplication when anchor is strongly warm or cool. */
export function scoreWarmth(
  candidate: GraphMaterial,
  anchor: GraphMaterial | null,
): number {
  if (!anchor) return WARMTH_NO_ANCHOR_SCORE;
  const aw = anchor.warmth;
  // Neutral anchor: no constraint.
  if (aw > WARMTH_STRONG_COOL && aw < WARMTH_STRONG_WARM) return 1.0;
  const cw = candidate.warmth;
  if (aw >= WARMTH_STRONG_WARM) {
    const [, high] = WARMTH_TARGET_WARM_ANCHOR;
    if (cw <= high) return 1.0;
    if (cw >= WARMTH_PENALTY_WARM) return 0.0;
    return 1 - (cw - high) / (WARMTH_PENALTY_WARM - high);
  }
  // Cool anchor (aw <= WARMTH_STRONG_COOL).
  const [low] = WARMTH_TARGET_COOL_ANCHOR;
  if (cw >= low) return 1.0;
  if (cw <= WARMTH_PENALTY_COOL) return 0.0;
  return 1 - (low - cw) / (low - WARMTH_PENALTY_COOL);
}

/** Axis 3 — Hue undertone. Uses circular angular distance; null hue_angle → neutral 0.5. */
export function scoreHueUndertone(
  candidate: GraphMaterial,
  anchor: GraphMaterial | null,
): number {
  if (!anchor || anchor.hue_angle == null || candidate.hue_angle == null) return HUE_NULL_SCORE;
  const d = Math.abs(candidate.hue_angle - anchor.hue_angle);
  const dist = Math.min(d, 360 - d);
  for (const zone of HUE_ZONE_SCORES) {
    if (dist <= zone.maxDeg) return zone.score;
  }
  // Beyond 210° wraps back toward complementary.
  return HUE_ZONE_SCORES[HUE_ZONE_SCORES.length - 1].score;
}

/** Axis 4 — Texture variety. Rewards introducing a new family; penalises duplication. */
export function scoreTexture(
  candidate: GraphMaterial,
  placedMaterials: GraphMaterial[],
  style: StyleMode,
): number {
  if (placedMaterials.length === 0) return TEXTURE_SCORE_NEW;
  const counts = new Map<string, number>();
  for (const m of placedMaterials) {
    counts.set(m.texture, (counts.get(m.texture) ?? 0) + 1);
  }
  const ct = candidate.texture;
  if (!counts.has(ct)) {
    return counts.size >= TEXTURE_MAX_FAMILIES[style]
      ? TEXTURE_OVER_LIMIT_SCORE
      : TEXTURE_SCORE_NEW;
  }
  const maxCount = Math.max(...counts.values());
  return (counts.get(ct)! >= maxCount) ? TEXTURE_SCORE_DOMINANT : TEXTURE_SCORE_PRESENT;
}

/** Axis 5 — Pattern budget. Backsplash is always exempt (accent role). */
export function scorePattern(
  candidate: GraphMaterial,
  placedMaterials: GraphMaterial[],
  candidateRole: string,
): number {
  if (candidateRole === 'backsplash') return 1.0;
  const paletteSum = placedMaterials.reduce((s, m) => s + m.pattern, 0);
  const cp = candidate.pattern;
  if (paletteSum <= PATTERN_SUM_FREE) return 1.0;
  if (paletteSum <= PATTERN_SUM_MODERATE) {
    if (cp <= PATTERN_MOD_SOFT) return 1.0;
    if (cp >= PATTERN_MOD_HARD) return 0.0;
    return 1 - (cp - PATTERN_MOD_SOFT) / (PATTERN_MOD_HARD - PATTERN_MOD_SOFT);
  }
  // paletteSum > PATTERN_SUM_MODERATE
  if (cp <= PATTERN_HIGH_SOFT) return 1.0;
  if (cp >= PATTERN_HIGH_HARD) return 0.0;
  return 1 - (cp - PATTERN_HIGH_SOFT) / (PATTERN_HIGH_HARD - PATTERN_HIGH_SOFT);
}

/** Combined 5-axis palette harmony score for a single candidate. Returns 0–1. */
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
  const s1 = scoreLightness(candidate, anchor, candidateRole, style);
  const s2 = scoreWarmth(candidate, anchor);
  const s3 = scoreHueUndertone(candidate, anchor);
  const s4 = scoreTexture(candidate, placedMaterials, style);
  const s5 = scorePattern(candidate, placedMaterials, candidateRole);
  const [w1, w2, w3, w4, w5] = AXIS_WEIGHTS[style];
  return w1 * s1 + w2 * s2 + w3 * s3 + w4 * s4 + w5 * s5;
}

/** Returns candidates sorted descending by palette harmony score. */
export function rankByPaletteScore(
  candidates: GraphMaterial[],
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  style: StyleMode,
): GraphMaterial[] {
  // Pre-compute scores to avoid redundant calls inside the sort comparator.
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
