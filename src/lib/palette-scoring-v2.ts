import type { GraphMaterial } from '@/lib/graph-compatibility';
import { woodCurve, DEFAULT_CONSTANTS as WOOD_CURVE_CONSTANTS } from '@/lib/wood-curve';

// ─── Pure utilities ──────────────────────────────────────────────────────────
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function toleratedError(delta: number, ideal: number, tol: number): number {
  return Math.max(0, Math.abs(delta - ideal) - tol);
}

function colourSalience(lightness: number): number {
  return Math.sin(Math.PI * Math.max(0, Math.min(100, lightness)) / 100);
}

// ─── Activity + mass ─────────────────────────────────────────────────────────
const TEXTURE_COMPLEXITY: Record<string, number> = {
  plain: 0, wood: 0.65, stone: 0.35, metallic: 0.15,
};

function computeActivity(m: GraphMaterial): number {
  const tc = TEXTURE_COMPLEXITY[m.texture] ?? 0;
  return Math.min(100, m.pattern * 0.55 + (m.chroma * colourSalience(m.lightness)) * 0.30 + tc * 15);
}

const ROLE_VISUAL_MASS: Record<string, number> = {
  floor: 0.30, front: 0.30, worktop: 0.30, backsplash: 0.05,
};

const ROLE_ANCHOR_WEIGHT: Record<string, number> = {
  floor: 3, front: 3, worktop: 2, backsplash: 1,
};

function massOf(m: GraphMaterial): number {
  return ROLE_VISUAL_MASS[m.role[0]] ?? 0.10;
}

// ─── PaletteState ────────────────────────────────────────────────────────────
export interface PaletteState {
  L_avg:   number; L_range:   number;        // 0–100
  W_avg:   number; W_range:   number;        // warmth in DB units (−1..1)
  H_mean:  number | null; H_spread: number;  // degrees; spread = circular variance 0–1
  C_avg:   number; C_range:   number;        // 0–100
  activity:       number;                     // 0–100, mass-weighted
  textureVariety: number;                     // count of distinct non-plain texture families
  tension:        number;                     // 0–1, computed from the above
  byRole:         Map<string, GraphMaterial[]>;
  byArchetype:    Map<string, GraphMaterial[]>;
  placedCount:    number;
}

const EMPTY_STATE: PaletteState = {
  L_avg: 50, L_range: 0,
  W_avg: 0,  W_range: 0,
  H_mean: null, H_spread: 0,
  C_avg: 0,  C_range: 0,
  activity: 0,
  textureVariety: 0,
  tension: 0,
  byRole: new Map(),
  byArchetype: new Map(),
  placedCount: 0,
};

/** Mass-weighted aggregate stats across the placed materials. */
export function computePaletteState(placed: GraphMaterial[]): PaletteState {
  if (placed.length === 0) return EMPTY_STATE;

  let totalW = 0, lSum = 0, wSum = 0, cSum = 0, actSum = 0;
  let lMin = Infinity, lMax = -Infinity;
  let wMin = Infinity, wMax = -Infinity;
  let cMin = Infinity, cMax = -Infinity;
  let sinSum = 0, cosSum = 0, hWeightTotal = 0;
  const textures = new Set<string>();
  const byRole = new Map<string, GraphMaterial[]>();
  const byArchetype = new Map<string, GraphMaterial[]>();

  for (const m of placed) {
    const w = massOf(m);
    totalW += w;
    lSum   += m.lightness * w;
    wSum   += m.warmth    * w;
    cSum   += m.chroma    * w;
    actSum += computeActivity(m) * w;

    if (m.lightness < lMin) lMin = m.lightness;
    if (m.lightness > lMax) lMax = m.lightness;
    if (m.warmth    < wMin) wMin = m.warmth;
    if (m.warmth    > wMax) wMax = m.warmth;
    if (m.chroma    < cMin) cMin = m.chroma;
    if (m.chroma    > cMax) cMax = m.chroma;

    if (m.hue_angle != null) {
      const hw = w * m.chroma * colourSalience(m.lightness);
      sinSum += hw * Math.sin(m.hue_angle * Math.PI / 180);
      cosSum += hw * Math.cos(m.hue_angle * Math.PI / 180);
      hWeightTotal += hw;
    }

    if (m.texture !== 'plain') textures.add(m.texture);

    const role = m.role[0];
    if (role) {
      const arr = byRole.get(role) ?? [];
      arr.push(m);
      byRole.set(role, arr);
    }
    if (m.archetypeId) {
      const arr = byArchetype.get(m.archetypeId) ?? [];
      arr.push(m);
      byArchetype.set(m.archetypeId, arr);
    }
  }

  // Hue stats: circular mean + circular variance (1 − R).
  const H_mean = hWeightTotal > 0
    ? (Math.atan2(sinSum, cosSum) * 180 / Math.PI + 360) % 360
    : null;
  const R = hWeightTotal > 0
    ? Math.sqrt(sinSum * sinSum + cosSum * cosSum) / hWeightTotal
    : 0;
  const H_spread = hWeightTotal > 0 ? clamp01(1 - R) : 0;

  const L_avg = lSum / totalW;
  const W_avg = wSum / totalW;
  const C_avg = cSum / totalW;
  const activity = actSum / totalW;

  const L_range = placed.length > 1 ? lMax - lMin : 0;
  const W_range = placed.length > 1 ? wMax - wMin : 0;
  const C_range = placed.length > 1 ? cMax - cMin : 0;

  const partial: Omit<PaletteState, 'tension'> = {
    L_avg, L_range,
    W_avg, W_range,
    H_mean, H_spread,
    C_avg, C_range,
    activity,
    textureVariety: textures.size,
    byRole,
    byArchetype,
    placedCount: placed.length,
  };

  return { ...partial, tension: computeTensionFromPartial(partial) };
}

// ─── Tension ─────────────────────────────────────────────────────────────────
// Normalisation scales — what counts as "strong variation" on each axis.
// Tuned to typical interior palettes; revisit during Step 3 validation.
const L_RANGE_SCALE = 40;   // 40-point L spread → full contribution
const W_RANGE_SCALE = 0.6;  // 0.6 warmth spread → full contribution
const C_RANGE_SCALE = 25;   // 25-point chroma spread → full contribution

function computeTensionFromPartial(s: Omit<PaletteState, 'tension'>): number {
  if (s.placedCount < 2) return 0;
  const stdL = s.L_range / L_RANGE_SCALE;
  const stdW = s.W_range / W_RANGE_SCALE;
  const stdC = s.C_range / C_RANGE_SCALE;
  const act  = s.activity / 100;
  return clamp01(
    0.35 * stdL +
    0.20 * stdW +
    0.20 * stdC +
    0.15 * s.H_spread +
    0.10 * act
  );
}

export function computeTension(state: PaletteState): number {
  return state.tension;
}

// ─── Harmony threshold ───────────────────────────────────────────────────────
// Threshold rises with tension so calm palettes demand more harmony.
// The picker re-tries with a relaxed threshold if too few candidates pass.
export const HARMONY_THRESHOLD_FLOOR = 0.30;
export function harmonyThreshold(tension: number): number {
  return Math.max(HARMONY_THRESHOLD_FLOOR, 0.55 + 0.15 * tension);
}

// ─── Relationship matrix ─────────────────────────────────────────────────────
// No fixed centres — every relationship just declares which axes matter and how
// much. Tolerance is computed at score time from `tension` + palette range on
// that axis. Targets emerge from the candidate vs the placed material itself
// (centre = 0, "match the placed material" is the natural attractor; wide
// palette + high tension softens that into a broader tolerance envelope).
export interface Relationship {
  axisWeights: { L?: number; W?: number; H?: number; C?: number };
  bridge?: boolean;       // worktop-mediation: also score against the mean of the other roles
  intent?: 'continuity' | 'contrast' | 'auto';
}

const RELATIONSHIPS: Record<string, Relationship> = {
  // Floor stabilises; fronts define identity. L matters most, hue is secondary.
  'floor::front':         { axisWeights: { L: 1.0, W: 0.6, H: 0.4, C: 0.3 } },
  // Worktop mediates between fronts. Chroma matters more here (worktop materials carry colour).
  //'front::worktop':       { axisWeights: { L: 0.7, W: 0.5, H: 0.5, C: 0.6 }, bridge: true }, our current worktops are actually backsplashes
  'front::worktop':      { axisWeights: { L: 0.6, W: 0.5, H: 0.6, C: 0.5 } },
  // Floor↔worktop is a looser pair — both horizontal surfaces, hue continuity nice but not vital.
  //'floor::worktop':       { axisWeights: { L: 0.6, W: 0.4, H: 0.5, C: 0.4 } },
  'floor::worktop':       { axisWeights: { L: 0.6, W: 0.2, H: 0.5, C: 0.4 } },
  // Backsplash sits on the wall behind worktop — tight L+hue match reads as one surface.
  'backsplash::worktop':  { axisWeights: { L: 0.8, W: 0.6, H: 0.6, C: 0.5 } },
  // Fronts ↔ backsplash: visually adjacent but on different planes.
  'backsplash::front':    { axisWeights: { L: 0.6, W: 0.5, H: 0.5, C: 0.5 } },
  // Floor ↔ backsplash: distant pair; only soft continuity matters.
  'backsplash::floor':    { axisWeights: { L: 0.4, W: 0.3, H: 0.3, C: 0.2 } },
  // Accents are small visual elements — chroma/hue can pop, but base axes are gentler.
  'accent::floor':        { axisWeights: { L: 0.3, W: 0.2, H: 0.3, C: 0.2 } },
  'accent::front':        { axisWeights: { L: 0.4, W: 0.3, H: 0.4, C: 0.3 } },
  //'accent::worktop':      { axisWeights: { L: 0.4, W: 0.3, H: 0.4, C: 0.3 } },
  'accent::worktop':      { axisWeights: { L: 0.3, W: 0.2, H: 0.3, C: 0.2 } },
  'accent::backsplash':   { axisWeights: { L: 0.3, W: 0.2, H: 0.3, C: 0.2 } },
};

const DEFAULT_RELATIONSHIP: Relationship = {
  axisWeights: { L: 0.5, W: 0.3, H: 0.3, C: 0.3 },
};

function pairKeyRoles(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

export function desiredRelationship(roleA: string, roleB: string, _state: PaletteState): Relationship {
  return RELATIONSHIPS[pairKeyRoles(roleA, roleB)] ?? DEFAULT_RELATIONSHIP;
}

// ─── Harmony score ───────────────────────────────────────────────────────────
// Base tolerance per axis in normalised 0–1 space. These + axisWeights +
// the two tension/range factors below are the only tunable knobs.
const BASE_TOL: Record<'L' | 'W' | 'H' | 'C', number> = {
  L: 0.3, W: 0.08, H: 0.10, C: 0.08,
};
const TENSION_FACTOR = 0.15;
const SCORE_ERROR_POWER = 1.5;

// Achromatic candidates (hue_angle = null, e.g. pure white) skip the H axis entirely
// and get zero hue error — which inflates their score in coloured palettes.
// Apply a small neutrality cost proportional to how chromatic the placed material is,
// so white-next-to-white is fine but white-next-to-colour is modestly penalised.
const ACHROMATIC_HUE_PENALTY = 0.15;

// Per-axis normalised delta — 0 = match, 1 = full opposite. Hue uses
// shortest arc / 90 (matches v1 convention so the tolerance numbers stay comparable).
function deltaL(a: number, b: number): number { return Math.abs(a - b) / 100; }
function deltaW(a: number, b: number): number { return Math.abs(a - b) / 2; }
function deltaC(a: number, b: number): number { return Math.abs(a - b) / 100; }
function deltaH(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d) / 90;
}


function tolFor(axis: 'L' | 'W' | 'H' | 'C', state: PaletteState): number {
  return BASE_TOL[axis] * (1 + TENSION_FACTOR * state.tension);
}

// Score one pair (candidate ↔ placed material) → average tolerated error across
// the axes that matter for this relationship.
function pairError(
  candidate: GraphMaterial,
  placed: GraphMaterial,
  rel: Relationship,
  state: PaletteState,
): number {
  const aw = rel.axisWeights;
  let errSum = 0, weightSum = 0;

  if (aw.L != null && aw.L > 0) {
    const err = toleratedError(deltaL(candidate.lightness, placed.lightness), 0, tolFor('L', state));
    errSum += err * aw.L; weightSum += aw.L;
  }
  if (aw.W != null && aw.W > 0) {
    const err = toleratedError(deltaW(candidate.warmth, placed.warmth), 0, tolFor('W', state));
    errSum += err * aw.W; weightSum += aw.W;
  }
  if (aw.C != null && aw.C > 0) {
    // Chroma error scaled by candidate's perceptual salience — dark/light surfaces
    // are perceptually less chromatic, so the same delta hurts less there.
    const salience = colourSalience(candidate.lightness);
    const err = toleratedError(deltaC(candidate.chroma, placed.chroma), 0, tolFor('C', state)) * salience;
    errSum += err * aw.C; weightSum += aw.C;
  }
  if (aw.H != null && aw.H > 0) {
    const d = deltaH(candidate.hue_angle, placed.hue_angle);
    if (d != null) {
      const err = toleratedError(d, 0, tolFor('H', state));
      errSum += err * aw.H; weightSum += aw.H;
    } else if (candidate.hue_angle == null && placed.hue_angle != null) {
      // Candidate is achromatic — scale penalty by how chromatic the placed material is.
      const placedVisualChroma = clamp01((placed.chroma / 100) * colourSalience(placed.lightness) * 2);
      errSum += ACHROMATIC_HUE_PENALTY * placedVisualChroma * aw.H;
      weightSum += aw.H;
    }
  }

  if (rel.intent === 'contrast') {
    // Flip the error: inside the tolerance envelope is bad (too similar).
    // Approximated by re-scoring around a "centre" of `tol` instead of 0.
    // Out of scope for Step 1 — log only.
  }

  return weightSum > 0 ? errSum / weightSum : 0;
}

// Bridge bonus: for relationships flagged `bridge: true`, reward candidates
// whose values sit between the placed material and the palette mean — i.e.
// the worktop "mediating" between fronts. Implemented as a small extra penalty
// when the candidate sits outside the (placed, mean) range.
function bridgeError(
  candidate: GraphMaterial,
  placed: GraphMaterial,
  state: PaletteState,
): number {
  const lo = Math.min(placed.lightness, state.L_avg);
  const hi = Math.max(placed.lightness, state.L_avg);
  if (candidate.lightness >= lo && candidate.lightness <= hi) return 0;
  const dist = candidate.lightness < lo ? lo - candidate.lightness : candidate.lightness - hi;
  return toleratedError(dist / 100, 0, BASE_TOL.L);
}

/** Harmony score for a single candidate against the current palette.
 *  Returns 0–1; 1.0 = perfect fit. Empty palette returns NO_PALETTE_SCORE
 *  (matches v1 NO_ANCHOR_SCORE so the blend at the caller side stays neutral). */
export const NO_PALETTE_SCORE = 0.5;

export function harmonyScore(
  candidate: GraphMaterial,
  placed: GraphMaterial[],
  state: PaletteState,
  candidateRole: string,
  _chipArchetypeId?: string | null,
): number {
  if (placed.length === 0) return NO_PALETTE_SCORE;

  let relErrSum    = 0;
  let relWeightSum = 0;

  for (const p of placed) {
    const placedRole = p.role[0];
    if (!placedRole) continue;
    const rel = desiredRelationship(candidateRole, placedRole, state);
    if (!rel) continue;

    const roleWeight = ROLE_ANCHOR_WEIGHT[placedRole] ?? 1;
    let err = pairError(candidate, p, rel, state);
    if (rel.bridge) err += bridgeError(candidate, p, state) * 0.5;
    relErrSum    += err * roleWeight;
    relWeightSum += roleWeight;
  }

  if (relWeightSum === 0) return NO_PALETTE_SCORE;
  const avgErr = relErrSum / relWeightSum;
  return 1 / (1 + Math.pow(avgErr, SCORE_ERROR_POWER));
}

// ─── Grand Harmony Score (evaluative — complete palette) ────────────────────
// Separate from harmonyScore (which is generative/candidate-selection).
// Evaluates a finished three-material palette on lightness topology,
// undertone coherence, and chroma hierarchy.

export const DEAD_CENTER       = 7;   // ΔL value that gets maximum dead-zone penalty
export const DEAD_SIGMA        = 32;  // 2σ² denominator; controls Gaussian sharpness
export const CHROMA_THRESHOLD  = 20;  // C above which a non-hero material "fights"
export const PATTERN_THRESHOLD = 40;  // pattern score above which a material is "bold"

export interface PaletteHarmonyEval {
  ghs: number;
  tier: 'excellent' | 'passable' | 'clash';
  penalties: { L: number; H: number; W: number; C: number; P: number };
}

export function evaluatePaletteHarmony(placed: GraphMaterial[]): PaletteHarmonyEval {
  const materials = placed.filter(m => ['floor', 'front', 'worktop'].includes(m.role[0]));
  if (materials.length < 2) return { ghs: 100, tier: 'excellent', penalties: { L: 0, H: 0, W: 0, C: 0, P: 0 } };

  // ── P_L: lightness dead-zone penalty ────────────────────────────────────
  let rawPL = 0;
  let pairCount = 0;
  for (let i = 0; i < materials.length; i++) {
    for (let j = i + 1; j < materials.length; j++) {
      const dL = Math.abs(materials[i].lightness - materials[j].lightness);
      rawPL += Math.exp(-Math.pow(dL - DEAD_CENTER, 2) / DEAD_SIGMA);
      pairCount++;
    }
  }
  const P_L = pairCount > 0 ? rawPL / pairCount : 0;  // 0–1

  // ── P_U: undertone penalty (hue spread + warmth std) ────────────────────
  const state = computePaletteState(materials);
  const H_spread = state.H_spread;  // circular variance 0–1, neutrals already down-weighted

  const wValues = materials.map(m => m.warmth);
  const wMean = wValues.reduce((s, v) => s + v, 0) / wValues.length;
  const W_std = Math.sqrt(wValues.reduce((s, v) => s + Math.pow(v - wMean, 2), 0) / wValues.length);

  const P_U = 1.5 * H_spread + 1.0 * W_std;  // H: 0–1, W: 0–~0.82; sum ~0–2.32

  // ── P_C: chroma harmony — crowding + adaptive variance ─────────────────
  // Crowding: hero gets a free pass; non-heroes penalised for exceeding the threshold.
  const chromaValues = materials.map(m => m.chroma);
  const chromaHeroIdx = chromaValues.indexOf(Math.max(...chromaValues));
  let rawPCCrowd = 0;
  if (chromaValues.filter(c => c > CHROMA_THRESHOLD).length >= 2) {
    for (let i = 0; i < chromaValues.length; i++) {
      if (i === chromaHeroIdx) continue;
      rawPCCrowd += Math.max(0, chromaValues[i] - CHROMA_THRESHOLD);
    }
  }
  const P_C_crowd = rawPCCrowd / 100;  // 0–~1.2

  // Adaptive variance: dark rooms need chroma spread for definition;
  // bright rooms need constrained chroma to avoid clashing colour casts.
  // σ_target slides from 14 (very dark) down to 2 (very bright); floored at 2.
  const C_avg_simple = chromaValues.reduce((s, v) => s + v, 0) / chromaValues.length;
  const C_ssd = chromaValues.reduce((s, v) => s + Math.pow(v - C_avg_simple, 2), 0) / Math.max(1, chromaValues.length - 1);
  const sigma_C = Math.sqrt(C_ssd);
  const sigma_target = Math.max(14 - 0.10 * state.L_avg, 2);
  const P_C_var = clamp01(Math.pow(sigma_C - sigma_target, 2) / 200);

  const P_C = 0.70 * clamp01(P_C_crowd) + 0.30 * P_C_var;

  // ── P_P: pattern crowding — same logic as P_C ───────────────────────────
  // One bold-pattern material is the visual hero. Two or more fight for attention.
  const patternValues = materials.map(m => m.pattern);
  const patternHeroIdx = patternValues.indexOf(Math.max(...patternValues));
  let rawPP = 0;
  if (patternValues.filter(p => p > PATTERN_THRESHOLD).length >= 2) {
    for (let i = 0; i < patternValues.length; i++) {
      if (i === patternHeroIdx) continue;
      rawPP += Math.max(0, patternValues[i] - PATTERN_THRESHOLD);
    }
  }
  const P_P = rawPP / 100;  // 0–~1.2

  // ── GHS — weights sum to 1.0 ─────────────────────────────────────────────
  const P_U_norm = clamp01(P_U / 2.32);
  const rawGHS = 100 - (
    0.40 * P_L              * 100 +
    0.30 * P_U_norm         * 100 +
    0.15 * clamp01(P_C)     * 100 +
    0.15 * clamp01(P_P)     * 100
  );
  const ghs = Math.round(clamp01(rawGHS / 100) * 100);

  const tier: PaletteHarmonyEval['tier'] =
    ghs >= 85 ? 'excellent' : ghs >= 60 ? 'passable' : 'clash';

  return { ghs, tier, penalties: { L: P_L, H: H_spread, W: W_std, C: clamp01(P_C), P: clamp01(P_P) } };
}

// ─── Drop-in palette score (v1.scoreCandidate replacement) ───────────────────
/** Same signature shape and 0–1 range as v1 scoreCandidate. */
export function paletteScoreV2(
  candidate: GraphMaterial,
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  chipArchetypeId?: string | null,
): number {
  const placed = placedCodes
    .map((c) => byCode.get(c))
    .filter((m): m is GraphMaterial => !!m);
  const state = computePaletteState(placed);
  return harmonyScore(candidate, placed, state, candidateRole, chipArchetypeId);
}

// ─── Direction taxonomy ──────────────────────────────────────────────────────
export type DirectionId =
  | 'tonal_match' | 'lighter_echo' | 'darker_echo'
  | 'soft_contrast' | 'temperature_shift'
  | 'light_neutral' | 'medium_neutral' | 'dark_neutral'
  | 'pastel' | 'rich_colour' | 'muted'
  | 'quiet_stone' | 'natural_stone' | 'bold_movement'
  | 'metallic';

export const DIRECTIONS_BY_ARCHETYPE: Record<string, DirectionId[]> = {
  wood:     ['lighter_echo', 'tonal_match', 'darker_echo', 'soft_contrast'],
  stone:    ['quiet_stone', 'natural_stone', 'bold_movement'],
  plain:    ['light_neutral', 'medium_neutral', 'dark_neutral', 'pastel', 'rich_colour', 'muted'],
  metallic: ['metallic'],
};

// Default direction shown on the archetype chip before any materials are placed.
// Encodes intuitive interior logic: floors trend lighter, fronts darker, worktops tonal.
export const CANONICAL_DIRECTION: Partial<Record<string, Partial<Record<string, DirectionId>>>> = {
  wood:  { floor: 'lighter_echo', front: 'darker_echo', worktop: 'tonal_match' },
  stone: { floor: 'natural_stone', worktop: 'natural_stone' },
  plain: { front: 'light_neutral', worktop: 'medium_neutral' },
};

// Claiming priority: which direction gets exclusive ownership of a material when it scores
// well across multiple directions. Separate from UI display order (DIRECTIONS_BY_ARCHETYPE).
// tonal_match claims wood first — it's the most specific match and should not be "stolen"
// by a lighter/darker slot just because it also happens to be a good echo.
export const CLAIMING_PRIORITY: Record<string, DirectionId[]> = {
  wood:     ['tonal_match', 'lighter_echo', 'darker_echo', 'soft_contrast'],
  stone:    ['quiet_stone', 'natural_stone', 'bold_movement'],
  plain:    ['light_neutral', 'medium_neutral', 'dark_neutral', 'pastel', 'rich_colour', 'muted'],
  metallic: ['metallic'],
};

// Resolve which direction family applies. Prefer the explicit chip routing
// from the picker; fall back to the material's own archetype, then texture.
function archetypeForDirections(c: GraphMaterial, chipArchetypeId?: string | null): string | null {
  // Wood is scored by the generative curve (WOOD_CURVE_SPECS), not DIRECTION_CONFIGS.
  const known = (id: string) => DIRECTIONS_BY_ARCHETYPE[id] && (DIRECTION_CONFIGS[id] || id === 'wood');
  if (chipArchetypeId && known(chipArchetypeId)) return chipArchetypeId;
  if (c.archetypeId  && known(c.archetypeId))   return c.archetypeId;
  const fromTexture = c.texture === 'plain' ? 'plain'
                    : c.texture === 'wood'  ? 'wood'
                    : (c.texture === 'stone' || c.texture === 'concrete') ? 'stone'
                    : c.texture === 'metallic' ? 'metallic'
                    : null;
  return fromTexture && known(fromTexture) ? fromTexture : null;
}

/** Reference point for relative direction tagging.
 *  Precedence: same-archetype mass-weighted mean → palette mean → null. */
interface DirectionRef {
  L: number;
  W: number;
  C: number;
  hue: number | null;
  pattern: number;
  L_range: number;   // from state.L_range — drives rangeBonus on L axes + balance scaling
  C_range: number;   // from state.C_range — drives rangeBonus on C axes + balance scaling
  W_range: number;   // from state.W_range — drives balance scaling on W axis
  H_spread: number;  // from state.H_spread — kept for reference; not used in balance
  H_range: number;   // raw max pairwise hue arc among placed materials (degrees, 0–180); drives H balance
}

/** Max pairwise hue arc (degrees, 0–180) among materials with known hue angles. */
function rawHueRange(materials: GraphMaterial[]): number {
  const hues = materials.map(m => m.hue_angle).filter((h): h is number => h != null);
  let max = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const d = Math.abs(hues[i] - hues[j]);
      max = Math.max(max, Math.min(d, 360 - d));
    }
  }
  return max;
}

function directionReference(
  archetype: string,
  state: PaletteState,
): DirectionRef | null {
  const allPlaced = [...state.byRole.values()].flat();
  const paletteHRange = rawHueRange(allPlaced);

  const sameArchetype = state.byArchetype.get(archetype);
  if (sameArchetype && sameArchetype.length > 0) {
    let totalW = 0, lSum = 0, wSum = 0, cSum = 0, pSum = 0;
    let sinSum = 0, cosSum = 0, hueW = 0;
    for (const m of sameArchetype) {
      const w = massOf(m);
      totalW += w;
      lSum += m.lightness * w;
      wSum += m.warmth * w;
      cSum += m.chroma * w;
      pSum += m.pattern * w;
      if (m.hue_angle != null) {
        const hw = w * m.chroma * colourSalience(m.lightness);
        sinSum += hw * Math.sin(m.hue_angle * Math.PI / 180);
        cosSum += hw * Math.cos(m.hue_angle * Math.PI / 180);
        hueW += hw;
      }
    }
    if (totalW > 0) {
      return {
        L: lSum / totalW,
        W: wSum / totalW,
        C: cSum / totalW,
        hue: hueW > 0 ? (Math.atan2(sinSum, cosSum) * 180 / Math.PI + 360) % 360 : null,
        pattern: pSum / totalW,
        L_range: state.L_range,
        C_range: state.C_range,
        W_range: state.W_range,
        H_spread: state.H_spread,
        H_range: paletteHRange,
      };
    }
  }
  if (state.placedCount > 0) {
    return {
      L: state.L_avg,
      W: state.W_avg,
      C: state.C_avg,
      hue: state.H_mean,
      pattern: 0,
      L_range: state.L_range,
      C_range: state.C_range,
      W_range: state.W_range,
      H_spread: state.H_spread,
      H_range: paletteHRange,
    };
  }
  return null;
}

/** Tag a candidate with a relative direction id based on how it moves the palette.
 *  Returns null for empty palettes (no reference) or archetypes without a direction set. */
export function directionForCandidate(
  candidate: GraphMaterial,
  state: PaletteState,
  chipArchetypeId?: string | null,
): DirectionId | null {
  const archetype = archetypeForDirections(candidate, chipArchetypeId);
  if (!archetype) return null;
  const ref = directionReference(archetype, state);
  if (!ref) return null;

  const dL = (candidate.lightness - ref.L) / 100;
  const dC = (candidate.chroma - ref.C) / 100;

  if (archetype === 'plain') {
    if (dC > 0.25) return 'rich_colour';
    if (dC > 0.10 && candidate.chroma < 30) return 'pastel';
    // Muted: moderate chroma, stays near ref L — coloured but restrained.
    if (dC > -0.15 && dC <= 0 && Math.abs(dL) <= 0.10) return 'muted';
    if (dL > 0.10) return 'light_neutral';
    if (dL < -0.10) return 'dark_neutral';
    return 'medium_neutral';
  }

  if (archetype === 'wood') {
    // Wood direction is determined by per-direction scoring in rankClusteredCandidates, not here.
    return null;
  }

  if (archetype === 'stone') {
    const dP = (candidate.pattern - ref.pattern) / 100;
    if (dP >= 0.20) return 'bold_movement';
    if (dP <= 0.05) return 'quiet_stone';
    return 'natural_stone';
  }

  return null;
}

// ─── Clustering for diversity ────────────────────────────────────────────────
// Bucket key = `${L-band}|${hue-family}|${texture}`. Picker uses this to cap
// the visible cluster representatives so the row stays scannable.
function lBand(L: number): string {
  if (L < 30) return 'L_vd';   // very dark
  if (L < 50) return 'L_d';    // dark
  if (L < 70) return 'L_l';    // light
  return 'L_vl';                // very light
}

function hueFamily(c: GraphMaterial): string {
  if (c.chroma < 8 || c.hue_angle == null) return 'neutral';
  const h = c.hue_angle;
  if (h < 45 || h >= 315) return 'red';
  if (h < 90)  return 'orange';
  if (h < 150) return 'yellow_green';
  if (h < 210) return 'cyan';
  if (h < 270) return 'blue';
  return 'magenta';
}

export interface ClusterBucket {
  key: string;
  direction: DirectionId | null;
  members: GraphMaterial[];
}

/** Group candidates by (L-band, hue family, texture). One bucket per unique key.
 *  Used by the picker to pick a small set of cluster reps and surface variety. */
export function clusterHarmonious(
  candidates: GraphMaterial[],
  _state: PaletteState,
): ClusterBucket[] {
  const buckets = new Map<string, GraphMaterial[]>();
  for (const c of candidates) {
    const key = `${lBand(c.lightness)}|${hueFamily(c)}|${c.texture}`;
    const arr = buckets.get(key) ?? [];
    arr.push(c);
    buckets.set(key, arr);
  }
  return [...buckets.entries()].map(([key, members]) => ({
    key, members, direction: null,
  }));
}

// ─── V2 debug export (replaces v1 computeAxisErrors / computeIdealTargets) ───
export function computeV2Debug(
  candidate: GraphMaterial,
  otherCodes: string[],
  byCode: Map<string, GraphMaterial>,
  role: string,
  chipArchetypeId?: string | null,
  targetDirection?: string | null,
): {
  harmonyScore: number;
  directionId: DirectionId | null;
  directionScore: number;
  tension: number;
  axisErrors: Record<string, number>;
  refAvg: { L: number; W: number; C: number; hue: number | null; pattern: number } | null;
  // Read-only wood-curve target for the dev overlay (not used in ranking).
  woodTarget: { dL: number; W: number; H: number | null; C: number } | null;
} | null {
  const placed = otherCodes.map(c => byCode.get(c)).filter((m): m is GraphMaterial => !!m);
  if (placed.length === 0) return null;
  const state = computePaletteState(placed);
  const hScore = harmonyScore(candidate, placed, state, role, chipArchetypeId);

  const archetype     = archetypeForDirections(candidate, chipArchetypeId);
  const archetypeCfgs = archetype ? DIRECTION_CONFIGS[archetype] : null;
  const directions    = archetype ? DIRECTIONS_BY_ARCHETYPE[archetype] : null;
  const ref           = archetype ? directionReference(archetype, state) : null;

  let dirId: DirectionId | null = null;
  let dirScore = 0;
  let axisErrors: Record<string, number> = {};
  const isWood = archetype === 'wood';
  // Score one direction (wood → curve, others → hand-tuned config). Returns null if
  // the direction has no spec/config. Populates `errs` with per-axis errors.
  const scoreDir = ref
    ? (dir: DirectionId, errs: Record<string, number>): number | null => {
        if (isWood) {
          const spec = WOOD_CURVE_SPECS[dir];
          if (!spec) return null;
          // Lightness assigns exactly one tab; only score the candidate's own region.
          if (woodLightnessRegion(candidate.lightness, ref.L) !== dir) return null;
          return scoreWoodCurve(candidate, ref, errs);
        }
        const config = archetypeCfgs?.[dir];
        return config ? computeDirectionScore(candidate, ref, config, errs) : null;
      }
    : null;
  if (scoreDir && directions && (isWood || archetypeCfgs)) {
    if (targetDirection && directions.includes(targetDirection as DirectionId)) {
      // Score specifically for the user's chosen direction
      const errs: Record<string, number> = {};
      const s = scoreDir(targetDirection as DirectionId, errs);
      if (s != null) { dirScore = s; dirId = targetDirection as DirectionId; axisErrors = errs; }
    } else {
      let bestDirScore = -1;
      for (const dir of directions) {
        const errs: Record<string, number> = {};
        const s = scoreDir(dir, errs);
        if (s != null && s > bestDirScore) { bestDirScore = s; dirId = dir; dirScore = s; axisErrors = errs; }
      }
    }
  }

  const refAvg = ref ? { L: ref.L, W: ref.W, C: ref.C, hue: ref.hue, pattern: ref.pattern } : null;

  // Read-only wood-curve comparison for the dev overlay: treat the wood reference
  // as the anchor and ask the curve what an ideal partner's W/H/C would be at the
  // candidate's actual lightness. Purely informational — no effect on scoring.
  let woodTarget: { dL: number; W: number; H: number | null; C: number } | null = null;
  if (archetype === 'wood' && ref && ref.L > 0 && ref.C > 0) {
    const dL = (ref.L - candidate.lightness) / 100;  // ΔL_rel = absolute gap /100
    const t = woodCurve({ L: ref.L, W: ref.W, H: ref.hue ?? 0, C: ref.C }, dL);
    woodTarget = { dL, W: t.W, H: ref.hue != null ? t.H : null, C: t.C };
  }

  return { harmonyScore: hScore, directionId: dirId, directionScore: dirScore, tension: state.tension, axisErrors, refAvg, woodTarget };
}

// ─── New API for the picker: harmony-filtered + clustered + tagged ──────────
export interface RankedClusteredEntry {
  code: string;
  score: number;
  harmonyScore: number;
  pairScore: number;        // 0–1 normalised pair compatibility; populated by getClusteredRankedCodes, default 0
  directionScore: number;   // raw direction-fit score before blending with harmony (0–1)
  direction: DirectionId | null;
  clusterKey: string;
  archetype: string | null;
}

// ─── Direction scoring config ─────────────────────────────────────────────────
interface AxisConfig {
  weight:              number;
  idealDelta:          number;   // signed target deviation from ref, normalised (L/100, W/2, C/100, P/100)
                                 // ignored when mode='balance'
  mode?:               'balance'; // contextual: ideal = (neutral − ref) / normaliser, so the candidate
                                  //   is nudged toward the complement of wherever the palette sits.
                                  //   L neutral=50, W neutral=0, C neutral=0.
  maxDelta?:           number;    // when mode='balance': clamps the computed ideal to [−maxDelta, +maxDelta]
  wrongDirMultiplier?: number;   // penalty when candidate is on the wrong side of idealDelta
  absDeviation?:       boolean;  // score |actualDelta| vs idealDelta — both directions treated equally
  oneSided?:           'above' | 'below'; // no penalty past the ideal in the given direction:
                                          //   'above' — being above idealDelta is free (lighter-is-better)
                                          //   'below' — being below idealDelta is free (more-neutral-is-better)
  rangeBonus?:         number;   // added to idealDelta proportional to palette range on this axis:
                                 //   effective_idealDelta = idealDelta + rangeBonus × clamp01(range / scale)
  trajectoryK?:        number;   // trajectory coupling: idealDelta shifts by k × primaryAxisDelta
                                 // encodes natural material co-variation (e.g. lighter wood → slightly cooler)
                                 // ignored when mode='balance'. primaryAxis set on DirectionConfig.
  trajectoryAbs?:      boolean;  // when true, uses |primaryAxisDelta| so both lighter AND darker
                                 // candidates shift in the same direction (V-shape on W/C)
  refK?:               number;   // dynamic idealDelta from reference lightness (L axis only):
                                 //   positive k → (1 - ref.L/100) × k  (light climb: larger Δ from dark refs)
                                 //   negative k → (ref.L/100) × k      (dark drop:   larger Δ from light refs)
                                 // overrides idealDelta when set; wrongDirMultiplier still applies
}

interface DirectionConfig {
  L?:    AxisConfig;
  W?:    AxisConfig;
  C?:    AxisConfig;
  P?:    AxisConfig;
  H?:    { weight: number; idealDeg: number; trajectoryK?: number; mode?: 'balance'; maxDeg?: number };  // trajectoryK: idealDeg grows by k×|primaryDelta| — further in L → larger expected hue arc
  minAbsC?: number;       // hard gate: material must have chroma ≥ this to be eligible for the direction
  minL?: number;          // hard gate: material must have lightness ≥ this (e.g. light_neutral only accepts L≥65)
  maxL?: number;          // hard gate: material must have lightness ≤ this (e.g. dark_neutral only accepts L≤50)
  primaryAxis?: 'L' | 'W' | 'C';  // axis that drives trajectoryK coupling on secondary axes (default 'L')
  minScore?: number;      // soft gate: direction tab is hidden when no candidate reaches this directionScore.
                          //   Precise directions (tonal_match, bold_movement) need higher thresholds;
                          //   exploratory directions (soft_contrast, lighter_echo) tolerate lower scores.
  harmonyWeight?: number; // 0–1: fraction of final directed score from harmonyScore (0 = dir only). Tune per archetype/direction.
}

const METAL_DIRECTION_CONFIG: DirectionConfig = {
  L: { weight: 0.2, idealDelta: 0 },
  W: { weight: 0.4, idealDelta: 0 },
  H: { weight: 1,   idealDeg:   0 },
  // No soft gate: accents pair broadly, so always present them as a ranked line
  // (best match first) rather than letting a modest palette drop them to the grid.
  minScore: 0,
};

const DIRECTION_CONFIGS: Record<string, Partial<Record<DirectionId, DirectionConfig>>> = {

  metallic: { metallic: METAL_DIRECTION_CONFIG },
  gold:     { metallic: METAL_DIRECTION_CONFIG },
  silver:   { metallic: METAL_DIRECTION_CONFIG },
  bronze:   { metallic: METAL_DIRECTION_CONFIG },

  plain: {
    light_neutral: {
      L: { weight: 1.5, idealDelta: 0, refK: +0.6, wrongDirMultiplier: 2.5 },
      W: { weight: 0.8, idealDelta: -0.1, trajectoryK: -0.15 },
      C: { weight: 0.8, idealDelta: -0.2, trajectoryK: -0.20 },
      H: { weight: 1.2, idealDeg: 0, trajectoryK: 20  },
      minAbsC: 1,
      minScore: 0.22,
    },
    medium_neutral: {
      L: { weight: 1.2, idealDelta: -0.2, refK: +0.5 },
      W: { weight: 0.8, idealDelta: -0.10, trajectoryK: -0.15 },
      C: { weight: 0.6, idealDelta: -0.15, trajectoryK: -0.2 },
      H: { weight: 1.5, idealDeg: 0, trajectoryK: 20  },
      minAbsC: 1,
      minScore: 0.22,
    },
    dark_neutral: {
      L: { weight: 1.5, idealDelta: 0, refK: -0.6, wrongDirMultiplier: 2.5 },
      W: { weight: 0.8, idealDelta: -0.05, trajectoryK: -0.15, trajectoryAbs: true },
      C: { weight: 0.2, idealDelta: -0.10, trajectoryK: -0.20, trajectoryAbs: true },
      H: { weight: 1, idealDeg: 0, trajectoryK: 20  },
      minAbsC: 5,
      minScore: 0.22,
    },
    pastel: {
      L: { weight: 1, idealDelta: +0.20 },
      C: { weight: 1, idealDelta: -0.10 },
      H: { weight: 1.5, idealDeg: +30 },
      minAbsC: 10,
      minScore: 0.999,  // direction only makes sense with visibly coloured candidates
    },
    rich_colour: {
      C: { weight: 0.6, idealDelta: +0.10, wrongDirMultiplier: 2.0 },
      H: { weight: 1.5, idealDeg: +30 },
      L: { weight: 0, idealDelta: 0 },
      minAbsC: 20,
      minScore: 0.28,  // same — only meaningful if saturated materials exist
    },
    muted: {
      C: { weight: 1.4, idealDelta: -0.10, rangeBonus: -0.05, wrongDirMultiplier: 1.5 },
      W: { weight: 0.5, idealDelta: -0.05, trajectoryK: -0.15 },
      H: { weight: 1.5, idealDeg: 10, trajectoryK: 0.15  },
      minAbsC: 15,
      minScore: 0.22,
    },
  },

  stone: {
    // Pattern is the primary axis; harmony score handles the tonal/lightness fit.
    quiet_stone: {
      P: { weight: 1.0, idealDelta: 0, oneSided: 'below', wrongDirMultiplier: 2.0 },
      L: { weight: 0.1, idealDelta: 0, },
      W: { weight: 0.8, idealDelta: 0, trajectoryK: -0.3, trajectoryAbs: true },
      C: { weight: 0.8, idealDelta: 0, trajectoryK: -0.30, trajectoryAbs: true },
      H: { weight: 1, idealDeg: 0, trajectoryK: 15  },
      minScore: 0.22,
    },
    natural_stone: {
      P: { weight: 1, idealDelta: +0.2 },
      L: { weight: 0.3, idealDelta: 0, },
      W: { weight: 0.8, idealDelta: 0, trajectoryK: -0.3, trajectoryAbs: true },
      C: { weight: 0.8, idealDelta: 0, trajectoryK: -0.30, trajectoryAbs: true },
      H: { weight: 1, idealDeg: 0, trajectoryK: 15  },
      minScore: 0.20,
    },
    bold_movement: {
      P: { weight: 1.0, idealDelta: +0.40, oneSided: 'above', wrongDirMultiplier: 2.0 },
      L: { weight: 0.1, idealDelta: 0},
      W: { weight: 0.8, idealDelta: 0, trajectoryK: -0.3, trajectoryAbs: true },
      C: { weight: 0.8, idealDelta: 0, trajectoryK: -0.30, trajectoryAbs: true   },
      H: { weight: 1, idealDeg: 0, trajectoryK: 15  },
      minScore: 0.30,  // requires high-pattern stone — if none in pool, tab is meaningless
    },
  },

  // wood: removed — wood is scored by the generative curve below (scoreWoodCurve),
  // not by hand-tuned idealDelta/trajectory configs.
};

// ─── Wood matching — generative curve ────────────────────────────────────────
// Wood partners are scored by DISTANCE TO A GENERATED TARGET, not hand-tuned deltas.
// For a direction, woodCurve(anchor, ΔL_rel) produces the ideal partner vector and
// the candidate is scored by weighted distance to it. "light / tonal / dark" are just
// different ΔL_rel points on one curve.
//
// ══ WOOD CALIBRATION KNOBS — all wood tuning lives here (+ curve shape constants
//    α/β/γ/θ in src/lib/wood-curve.ts DEFAULT_CONSTANTS) ══
//   WOOD_AXIS_WEIGHTS — how much each UNDERTONE axis (W/C/H) counts in the harmony score
//   WOOD_CURVE_SPECS  — recommended lightness centre + visibility gate per direction

// Only W/C/H rank a wood candidate (lightness assigns the tab via woodLightnessRegion,
// it is not scored). L is retained in the type for the shared axis shape but is unused
// in scoreWoodCurve.
export interface WoodAxisWeights { L: number; W: number; C: number; H: number }
export const WOOD_AXIS_WEIGHTS: WoodAxisWeights = { L: 0, W: 0.8, C: 0.8, H: 2.0 };

// Per-axis normalization spans: each raw axis error is divided by the realistic
// spread of wood values on that axis, so a full-range disagreement reads as ~1.0
// (not a fraction of a theoretical maximum the data never reaches). These are
// smooth linear scales, NOT thresholds. Derived from the p5–p95 catalogue span
// (chroma 43, warmth 0.46), rounded slightly wider so an incomplete catalogue is
// not overtrusted. Re-derive after any bulk rescore. Hue span (~74°) already
// matches its /90 scale, and L is the separate 'which-tab' axis — both kept at
// their prior scale on purpose.
export const WOOD_AXIS_SPANS = { W: 0.5, C: 45 } as const;

// Lightness assigns the TAB; harmony (W/H/C) ranks within it. A wood candidate belongs
// to exactly one direction by how far its lightness sits from the anchor — it is NOT a
// scored term, so being off the recommended centre never costs harmony. Cut points are
// the midpoints between the direction targets (0 / ±17 / ±40):
//   |ΔL| ≤ 8            → tonal_match
//   8 < |ΔL| ≤ 25       → lighter_echo (lighter) / darker_echo (darker)
//   |ΔL| > 25           → soft_contrast (either side)
// These are bucket edges (tabs are inherently discrete), not the if/else "stairs" we
// avoid on continuous axes like chroma.
const WOOD_TONAL_MAX_PTS = 8;   // midpoint of 0 and 17
const WOOD_ECHO_MAX_PTS  = 25;  // midpoint of 17 and 40

function woodLightnessRegion(candidateL: number, anchorL: number): DirectionId {
  const d  = candidateL - anchorL;   // + = candidate lighter than anchor
  const ad = Math.abs(d);
  if (ad <= WOOD_TONAL_MAX_PTS) return 'tonal_match';
  if (ad <= WOOD_ECHO_MAX_PTS)  return d > 0 ? 'lighter_echo' : 'darker_echo';
  return 'soft_contrast';
}

interface WoodDirectionSpec {
  // Recommended lightness offset from the anchor (the tab's centre), ABSOLUTE points,
  // positive = lighter. Display/reference only — lightness membership is decided by
  // woodLightnessRegion, and the undertone curve is evaluated at the candidate's OWN
  // lightness. deltaL is no longer a scored target.
  deltaL: number;
  minScore: number;         // soft gate: hide the direction tab if no candidate reaches this
}

// minScore gates for the linear-weight quadratic-mean form (scores run lower / more
// spread than the old squared-weight form). Reference points at equivalent error levels:
// perfect on-curve ≈1.0, decent ≈0.90, wrong-hue ≈0.80, clash ≈0.74. Tuned by hand in the
// UI — revisit if the score form or WOOD_AXIS_WEIGHTS change.
const WOOD_CURVE_SPECS: Partial<Record<DirectionId, WoodDirectionSpec>> = {
  tonal_match:   { deltaL:   0, minScore: 0.93 },
  lighter_echo:  { deltaL: +17, minScore: 0.8 },
  darker_echo:   { deltaL: -17, minScore: 0.8 },
  soft_contrast: { deltaL:  40, minScore: 0.8 },
};

// Score a wood candidate purely by UNDERTONE FIT (warmth / hue / chroma) — "is it ON
// the curve?". The curve is evaluated at the candidate's OWN lightness (its own ΔL_rel),
// so a lighter candidate is judged against what a lighter partner *should* look like.
// Lightness is NOT scored here: it decides the tab (woodLightnessRegion) and nothing
// else, so hitting the recommended ±15/0 centre never competes with harmony. This is
// exactly the tW/tH/tC the dev overlay shows.
//
// Aggregation is a weighted quadratic mean with LINEAR weights: √(Σ wᵢ·eᵢ² / Σwᵢ),
// then the 1/(1+d) shape. (computeDirectionScore still uses the older squared-weight
// form √(Σ(eᵢ·wᵢ)²)/Σwᵢ — wood diverges here on purpose; the wood minScore gates are
// tuned for THIS form, so they are not comparable to the other archetypes' gates.)
function scoreWoodCurve(
  candidate: GraphMaterial,
  ref: DirectionRef,
  axisErrs?: Record<string, number>,
): number {
  // Anchor = the wood reference (mass-weighted mean of placed woods).
  if (ref.L <= 0 || ref.C <= 0) return 0.5;
  const anchorHue = ref.hue ?? candidate.hue_angle ?? 0;
  const anchor = { L: ref.L, W: ref.W, H: anchorHue, C: ref.C };
  const w = WOOD_AXIS_WEIGHTS;
  const wsum = w.W + w.C + w.H;   // lightness is tab membership, not a ranking axis

  // Undertone target: curve at the candidate's own lightness.
  // ΔL_rel = ABSOLUTE lightness gap on the 0–100 scale: (L_anchor − L_cand)/100.
  const dLcand = (ref.L - candidate.lightness) / 100;
  const t = woodCurve(anchor, dLcand, WOOD_CURVE_CONSTANTS);
  const eW = Math.abs(candidate.warmth - t.W) / WOOD_AXIS_SPANS.W;
  const eC = Math.abs(candidate.chroma - t.C) / WOOD_AXIS_SPANS.C;
  let eH: number;
  if (candidate.hue_angle != null && ref.hue != null) {
    const raw = Math.abs(candidate.hue_angle - t.H);
    eH = Math.min(raw, 360 - raw) / 90;
  } else if (candidate.hue_angle == null && ref.hue != null) {
    // Achromatic candidate beside a coloured ref — small penalty (matches elsewhere).
    eH = ACHROMATIC_HUE_PENALTY * clamp01((ref.C / 100) * colourSalience(ref.L) * 2);
  } else {
    eH = 0;
  }

  // Informational only (dev overlay): how far the candidate sits from anchor lightness.
  // Not part of the score — lightness is handled by woodLightnessRegion.
  if (axisErrs) { axisErrs.L = Math.abs(candidate.lightness - ref.L) / 100; axisErrs.W = eW; axisErrs.C = eC; axisErrs.H = eH; }
  // Weighted quadratic mean (weights LINEAR, not squared): √(Σ wᵢ·eᵢ² / Σwᵢ). A uniform
  // error e on every axis maps to exactly e, and a weight of 1.5 counts 1.5× (not 2.25×).
  const sq = w.W * eW ** 2 + w.C * eC ** 2 + w.H * eH ** 2;
  return 1 / (1 + Math.sqrt(sq / wsum));
}

function computeDirectionScore(
  candidate: GraphMaterial,
  ref: DirectionRef,
  config: DirectionConfig,
  axisErrs?: Record<string, number>,
): number {
  // RMS aggregation: score = 1 / (1 + sqrt(Σ(err_i × weight_i)²) / weightSum)
  // A single large weighted error dominates — axes with higher weight are decisive,
  // and many small errors on low-weight axes can't gang up to outweigh one large one.
  let squaredSum = 0, weightSum = 0;

  // Resolve balance idealDelta: push toward complement when palette has low range on that axis,
  // nudge toward average when palette is already diverse (range is high).
  const lContrast = clamp01(ref.L_range / L_RANGE_SCALE);
  const wContrast = clamp01(ref.W_range / W_RANGE_SCALE);
  const cContrast = clamp01(ref.C_range / C_RANGE_SCALE);
  const balanceIdealDelta = {
    L: (50 - ref.L)      / 100 * (1 - lContrast),
    W: (0  - ref.W)      / 2   * (1 - wContrast),
    C: (0  - ref.C)      / 100 * (1 - cContrast),
    P: (0  - ref.pattern)/ 100,
  };

  function scoreLinearAxis(cfg: AxisConfig | undefined, signedDelta: number, rangeNorm: number, axis: 'L'|'W'|'C'|'P'): void {
    if (!cfg) return;
    const { weight, wrongDirMultiplier, absDeviation, oneSided, rangeBonus } = cfg;
    let err: number;
    if (cfg.mode === 'balance' && cfg.maxDelta != null) {
      const balanceDir = Math.sign(balanceIdealDelta[axis]);
      const zoneMin = Math.min(cfg.idealDelta, cfg.idealDelta + balanceDir * cfg.maxDelta);
      const zoneMax = Math.max(cfg.idealDelta, cfg.idealDelta + balanceDir * cfg.maxDelta);
      err = Math.max(0, zoneMin - signedDelta, signedDelta - zoneMax);
    } else {
      const baseIdeal  = cfg.mode === 'balance' ? balanceIdealDelta[axis] : cfg.idealDelta;
      const idealDelta = baseIdeal + (rangeBonus ?? 0) * rangeNorm;
      if (absDeviation) {
        err = Math.abs(Math.abs(signedDelta) - idealDelta);
      } else if (oneSided === 'above') {
        err = signedDelta >= idealDelta ? 0 : (idealDelta - signedDelta) * (wrongDirMultiplier ?? 1);
      } else if (oneSided === 'below') {
        err = signedDelta <= idealDelta ? 0 : (signedDelta - idealDelta) * (wrongDirMultiplier ?? 1);
      } else {
        const wrongDir = idealDelta !== 0 && (idealDelta > 0 ? signedDelta < 0 : signedDelta > 0);
        err = Math.abs(signedDelta - idealDelta) * (wrongDir && wrongDirMultiplier ? wrongDirMultiplier : 1);
      }
    }
    if (axisErrs) axisErrs[axis] = err;
    squaredSum += (err * weight) ** 2;
    weightSum  += weight;
  }

  const lRangeNorm = clamp01(ref.L_range / L_RANGE_SCALE);
  const cRangeNorm = clamp01(ref.C_range / C_RANGE_SCALE);

  const signedDeltaL = (candidate.lightness - ref.L) / 100;
  const signedDeltaW = (candidate.warmth    - ref.W) / 2;
  const signedDeltaC = (candidate.chroma    - ref.C) / 100;

  // Trajectory coupling: shift the ideal target for secondary axes based on how far the primary
  // axis moved, encoding natural material co-variation (e.g. lighter wood → slightly cooler).
  // Only applies to axes with trajectoryK set and no balance mode.
  const primaryAxis = config.primaryAxis ?? 'L';
  const primaryDelta = primaryAxis === 'W' ? signedDeltaW :
                       primaryAxis === 'C' ? signedDeltaC : signedDeltaL;
  function withTrajectory(cfg: AxisConfig | undefined): AxisConfig | undefined {
    if (cfg?.trajectoryK == null || cfg.mode) return cfg;
    const delta = cfg.trajectoryAbs ? Math.abs(primaryDelta) : primaryDelta;
    return { ...cfg, idealDelta: cfg.idealDelta + cfg.trajectoryK * delta };
  }

  // Dynamic L idealDelta: when refK is set, scale the ideal target by how far the reference
  // is from the target extreme so the direction stays reachable regardless of ref lightness.
  let lConfig = config.L;
  if (lConfig?.refK != null && !lConfig.mode) {
    const k = lConfig.refK;
    const dynamicIdeal = lConfig.idealDelta + (k >= 0 ? k * (1 - ref.L / 100) : k * (ref.L / 100));
    lConfig = { ...lConfig, idealDelta: dynamicIdeal };
  }
  scoreLinearAxis(lConfig,                     signedDeltaL, lRangeNorm, 'L');
  scoreLinearAxis(withTrajectory(config.W),    signedDeltaW, 0,          'W');
  scoreLinearAxis(withTrajectory(config.C),    signedDeltaC, cRangeNorm, 'C');
  scoreLinearAxis(config.P, (candidate.pattern - ref.pattern) / 100, 0, 'P');

  if (config.H) {
    const { weight, idealDeg, trajectoryK: hTrajectoryK, mode: hMode } = config.H;
    // balance: low raw hue range → add up to 30° variety; wide range (≥60°) → match dominant hue
    let effectiveIdealDeg = hMode === 'balance' ? 30 * (1 - clamp01(ref.H_range / 60)) : idealDeg;
    if (hMode === 'balance' && config.H!.maxDeg != null) {
      effectiveIdealDeg = Math.min(config.H!.maxDeg, effectiveIdealDeg);
    }
    // Trajectory: further from reference in L → larger expected hue arc (symmetric, hence |primaryDelta|)
    if (hTrajectoryK && !hMode) {
      effectiveIdealDeg += hTrajectoryK * Math.abs(primaryDelta);
    }
    if (ref.hue != null && candidate.hue_angle == null) {
      const refVisualC = clamp01((ref.C / 100) * colourSalience(ref.L) * 2);
      const achroErr = ACHROMATIC_HUE_PENALTY * refVisualC;
      if (axisErrs) axisErrs['H'] = achroErr;
      squaredSum += (achroErr * weight) ** 2;
      weightSum  += weight;
    } else {
      let hArc = 0;
      if (ref.hue != null && candidate.hue_angle != null) {
        const raw = Math.abs(candidate.hue_angle - ref.hue);
        hArc = Math.min(raw, 360 - raw) / 90;
      }
      const hErr = Math.abs(hArc - effectiveIdealDeg / 90);
      if (axisErrs) axisErrs['H'] = hErr;
      squaredSum += (hErr * weight) ** 2;
      weightSum  += weight;
    }
  }

  if (weightSum === 0) return 0.5;
  return 1 / (1 + Math.sqrt(squaredSum) / weightSum);
}


/** Minimum directionScore for a direction tab to be visible.
 *  Returns 0 if the direction has no configured threshold (always visible).
 *
 *  hasSameArchetypeRef: false when no placed material shares this archetype (e.g. picking the
 *  first wood when only stone/plain are placed). In that case the direction ref is the palette
 *  average — a weaker signal — so tonal_match is relaxed to avoid hiding valid options. */
export function directionMinScore(
  archetypeId: string,
  dir: DirectionId,
  hasSameArchetypeRef = true,
): number {
  const base = archetypeId === 'wood'
    ? (WOOD_CURVE_SPECS[dir]?.minScore ?? 0)
    : (DIRECTION_CONFIGS[archetypeId]?.[dir]?.minScore ?? 0);
  if (!hasSameArchetypeRef && dir === 'tonal_match') {
    // Scoring wood-against-stone-average naturally yields lower scores than wood-against-wood.
    // Cap at 0.75 so medium-quality options aren't hidden when no same-archetype ref exists.
    return Math.min(base, 0.75);
  }
  return base;
}

/** Score every candidate per direction, blend with harmony, and return sorted desc by score.
 *  Each candidate with a known archetype appears once per direction in that archetype's family.
 *  Non-directional materials (metallics, accents) appear once with direction = null.
 *
 *  pairScores / pairWeight: when provided, pair compatibility is blended into each entry's
 *  score BEFORE the claiming/non-claiming sort. Paired materials float to the top of their
 *  correct direction without crossing the claiming boundary into the wrong direction. */
export function rankClusteredCandidates(
  candidates: GraphMaterial[],
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  chipArchetypeId?: string | null,
  pairScores?: Map<string, number>,  // code → 0–1 direct pair score (pre-computed by caller)
  pairWeight?: number,               // fraction of final score from pairing (e.g. 0.02)
): RankedClusteredEntry[] {
  const placed = placedCodes
    .map((c) => byCode.get(c))
    .filter((m): m is GraphMaterial => !!m);
  const state = computePaletteState(placed);

  const entries: RankedClusteredEntry[] = [];
  const pw = pairWeight ?? 0;

  for (const material of candidates) {
    // harmonyScore: used as final score for undirected materials (no archetype config), and
    // kept on the entry for picker tiebreaker sorting. Not blended into directed scores.
    const harmScore  = harmonyScore(material, placed, state, candidateRole, chipArchetypeId);
    const clusterKey = `${lBand(material.lightness)}|${hueFamily(material)}|${material.texture}`;
    const pairScore  = pairScores?.get(material.technicalCode) ?? 0;

    const archetype        = archetypeForDirections(material, chipArchetypeId);
    const directions       = archetype ? DIRECTIONS_BY_ARCHETYPE[archetype] : null;
    const archetypeConfigs = archetype ? DIRECTION_CONFIGS[archetype] : null;
    const ref              = archetype ? directionReference(archetype, state) : null;

    const isWood = archetype === 'wood';
    if (directions && ref && (isWood || archetypeConfigs)) {
      for (const dir of directions) {
        let rawDirScore: number;   // pure direction/curve fit (0–1); stored on the entry
        let blended: number;       // after optional harmony blend (non-wood only)
        if (isWood) {
          const spec = WOOD_CURVE_SPECS[dir];
          if (!spec) continue;
          // Lightness picks the tab; a candidate is only offered in its own region.
          if (woodLightnessRegion(material.lightness, ref.L) !== dir) continue;
          rawDirScore = scoreWoodCurve(material, ref);
          blended = rawDirScore;   // wood has no harmonyWeight blend
        } else {
          const config = archetypeConfigs![dir];
          if (!config) continue;
          if (config.minAbsC !== undefined && material.chroma < config.minAbsC) continue;
          if (config.minL    !== undefined && material.lightness < config.minL) continue;
          if (config.maxL    !== undefined && material.lightness > config.maxL) continue;
          rawDirScore = computeDirectionScore(material, ref, config);
          const hw = config.harmonyWeight ?? 0;
          blended  = hw > 0 ? rawDirScore * (1 - hw) + harmScore * hw : rawDirScore;
        }
        const finalScore = pw > 0 ? blended * (1 - pw) + pairScore * pw : blended;
        entries.push({ code: material.technicalCode, score: finalScore, harmonyScore: harmScore, pairScore, directionScore: rawDirScore, direction: dir, clusterKey, archetype });
      }
    } else {
      const finalScore = pw > 0 ? harmScore * (1 - pw) + pairScore * pw : harmScore;
      entries.push({ code: material.technicalCode, score: finalScore, harmonyScore: harmScore, pairScore, directionScore: 0, direction: null, clusterKey, archetype });
    }
  }

  // Cross-direction deduplication: each material is claimed by its highest-priority direction
  // (earlier in DIRECTIONS_BY_ARCHETYPE = higher priority). Claiming entries are returned first,
  // non-claiming entries last — so directionGroups always picks a unique material per slot,
  // falling back to non-claiming entries only when a direction has no other candidate.
  const byMaterial = new Map<string, RankedClusteredEntry[]>();
  for (const e of entries) {
    const bucket = byMaterial.get(e.code);
    if (bucket) bucket.push(e); else byMaterial.set(e.code, [e]);
  }
  const claimingDirByCode = new Map<string, DirectionId | null>();
  for (const [code, materialEntries] of byMaterial) {
    if (materialEntries.length <= 1) { claimingDirByCode.set(code, materialEntries[0]?.direction ?? null); continue; }
    let claimingDir: DirectionId | null = null;
    let claimingIdx = Infinity;
    for (const e of materialEntries) {
      if (e.direction === null) continue;
      for (const priority of Object.values(CLAIMING_PRIORITY)) {
        const idx = priority.indexOf(e.direction);
        if (idx !== -1 && idx < claimingIdx) {
          claimingIdx = idx;
          claimingDir = e.direction;
        }
      }
    }
    claimingDirByCode.set(code, claimingDir);
  }

  const claiming: RankedClusteredEntry[]    = [];
  const nonClaiming: RankedClusteredEntry[] = [];
  for (const e of entries) {
    if (e.direction === null || e.direction === claimingDirByCode.get(e.code)) {
      claiming.push(e);
    } else {
      nonClaiming.push(e);
    }
  }
  claiming.sort((a, b) => b.score - a.score);
  nonClaiming.sort((a, b) => b.score - a.score);
  return [...claiming, ...nonClaiming];
}
