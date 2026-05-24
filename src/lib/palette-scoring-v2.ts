import type { GraphMaterial } from '@/lib/graph-compatibility';

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
  plain: 0, wood: 0.65, stone: 0.35, metal: 0.15,
};

function computeActivity(m: GraphMaterial): number {
  const tc = TEXTURE_COMPLEXITY[m.texture] ?? 0;
  return Math.min(100, m.pattern * 0.55 + (m.chroma * colourSalience(m.lightness)) * 0.30 + tc * 15);
}

const ROLE_VISUAL_MASS: Record<string, number> = {
  floor: 0.35, front: 0.30, worktop: 0.10, backsplash: 0.05,
};

const ROLE_ANCHOR_WEIGHT: Record<string, number> = {
  floor: 4, front: 3, worktop: 2, backsplash: 1,
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
  'front::worktop':       { axisWeights: { L: 0.7, W: 0.5, H: 0.5, C: 0.6 }, bridge: true },
  // Floor↔worktop is a looser pair — both horizontal surfaces, hue continuity nice but not vital.
  'floor::worktop':       { axisWeights: { L: 0.6, W: 0.4, H: 0.5, C: 0.4 } },
  // Backsplash sits on the wall behind worktop — tight L+hue match reads as one surface.
  'backsplash::worktop':  { axisWeights: { L: 0.8, W: 0.6, H: 0.6, C: 0.5 } },
  // Fronts ↔ backsplash: visually adjacent but on different planes.
  'backsplash::front':    { axisWeights: { L: 0.6, W: 0.5, H: 0.5, C: 0.5 } },
  // Floor ↔ backsplash: distant pair; only soft continuity matters.
  'backsplash::floor':    { axisWeights: { L: 0.4, W: 0.3, H: 0.3, C: 0.2 } },
  // Accents are small visual elements — chroma/hue can pop, but base axes are gentler.
  'accent::floor':        { axisWeights: { L: 0.3, W: 0.2, H: 0.3, C: 0.2 } },
  'accent::front':        { axisWeights: { L: 0.4, W: 0.3, H: 0.4, C: 0.3 } },
  'accent::worktop':      { axisWeights: { L: 0.4, W: 0.3, H: 0.4, C: 0.3 } },
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
  L: 0.08, W: 0.08, H: 0.10, C: 0.08,
};
const TENSION_FACTOR = 1.0;
const RANGE_FACTOR   = 0.7;
const SCORE_ERROR_POWER = 1.5;

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

// Palette range on each axis, normalised to the tolerance scale (0–1).
function rangeNorm(state: PaletteState, axis: 'L' | 'W' | 'H' | 'C'): number {
  switch (axis) {
    case 'L': return clamp01(state.L_range / L_RANGE_SCALE);
    case 'W': return clamp01(state.W_range / W_RANGE_SCALE);
    case 'C': return clamp01(state.C_range / C_RANGE_SCALE);
    case 'H': return state.H_spread; // already 0–1
  }
}

function tolFor(axis: 'L' | 'W' | 'H' | 'C', state: PaletteState): number {
  return BASE_TOL[axis]
       * (1 + TENSION_FACTOR * state.tension)
       * (1 + RANGE_FACTOR   * rangeNorm(state, axis));
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
    }
    // If either side is achromatic (hue_angle null), hue contributes nothing.
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
  | 'pastel' | 'rich_colour';

export const DIRECTIONS_BY_ARCHETYPE: Record<string, DirectionId[]> = {
  wood:  ['tonal_match', 'lighter_echo', 'darker_echo', 'soft_contrast', 'temperature_shift'],
  stone: ['tonal_match', 'lighter_echo', 'darker_echo', 'soft_contrast'],
  plain: ['light_neutral', 'medium_neutral', 'dark_neutral', 'pastel', 'rich_colour'],
  // metallic / gold / silver / bronze / black / accents → no directions; flat list
};

// Resolve which direction family applies. Prefer the explicit chip routing
// from the picker; fall back to the material's own archetype, then texture.
function archetypeForDirections(c: GraphMaterial, chipArchetypeId?: string | null): string | null {
  if (chipArchetypeId && DIRECTIONS_BY_ARCHETYPE[chipArchetypeId]) return chipArchetypeId;
  if (c.archetypeId && DIRECTIONS_BY_ARCHETYPE[c.archetypeId]) return c.archetypeId;
  if (c.texture === 'plain') return 'plain';
  if (c.texture === 'wood') return 'wood';
  if (c.texture === 'stone' || c.texture === 'concrete') return 'stone';
  return null;
}

/** Reference point for relative direction tagging.
 *  Precedence: same-archetype mass-weighted mean → palette mean → null. */
interface DirectionRef {
  L: number;
  W: number;
  C: number;
  hue: number | null;
  pattern: number;
}

function directionReference(
  archetype: string,
  state: PaletteState,
): DirectionRef | null {
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
      };
    }
  }
  if (state.placedCount > 0) {
    return {
      L: state.L_avg,
      W: state.W_avg,
      C: state.C_avg,
      hue: state.H_mean,
      pattern: 0, // not tracked at palette level — fine for direction tagging
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
  const dW = candidate.warmth - ref.W;
  const dC = (candidate.chroma - ref.C) / 100;
  const dP = (candidate.pattern - ref.pattern);

  if (archetype === 'plain') {
    // Chroma shift dominates — moves out of neutral lane.
    if (dC > 0.25) return 'rich_colour';
    if (dC > 0.10 && candidate.chroma < 30) return 'pastel';
    // Low-chroma lane: split by L.
    if (dL > 0.10) return 'light_neutral';
    if (dL < -0.10) return 'dark_neutral';
    return 'medium_neutral';
  }

  if (archetype === 'wood') {
    if (Math.abs(dW) > 0.15 && Math.abs(dL) < 0.08) return 'temperature_shift';
    // soft_contrast: always exists — extreme push opposite to where the reference sits.
    // ref.L ≥ 50 → show darkest candidates; ref.L < 50 → show lightest candidates.
    if (ref.L >= 50 && dL < -0.25) return 'soft_contrast';
    if (ref.L < 50 && dL > 0.25) return 'soft_contrast';
    if (dL > 0.1) return 'lighter_echo';
    if (dL < -0.1) return 'darker_echo';
    return 'tonal_match'; // nearest match — harmony score picks the closest candidate
  }

  if (archetype === 'stone') {
    if (dL > 0.08) return 'lighter_echo';
    if (dL < -0.08) return 'darker_echo';
    if (Math.abs(dL) > 0.04) return 'soft_contrast';
    return 'tonal_match';
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

// ─── New API for the picker: harmony-filtered + clustered + tagged ──────────
export interface RankedClusteredEntry {
  code: string;
  score: number;
  direction: DirectionId | null;
  clusterKey: string;
}

/** Direction-aware wood-on-wood score. Only called when the candidate is wood and a wood
 *  reference exists in the palette. Scores hue (and L for tonal_match) relative to the
 *  reference wood's position.
 *  - tonal_match:           ideal hue arc = 0°  (same undertone family), tight L match
 *  - lighter_echo/darker_echo: ideal hue arc = 10° (slight undertone shift), no L penalty */
function woodOnWoodScore(
  candidate: GraphMaterial,
  woodRef: DirectionRef,
  direction: DirectionId,
): number {
  let hArc = 0;
  if (woodRef.hue != null && candidate.hue_angle != null) {
    const raw = Math.abs(candidate.hue_angle - woodRef.hue);
    hArc = Math.min(raw, 360 - raw) / 90;
  }

  let err = 0;
  if (direction === 'tonal_match') {
    const dL = Math.abs(candidate.lightness - woodRef.L) / 100;
    err += toleratedError(dL, 0, 0.06);
    err += toleratedError(hArc, 0, 5 / 90) * 1.5;
  } else {
    // lighter_echo or darker_echo: slight hue shift is ideal, identical undertone is not
    err += toleratedError(hArc, 10 / 90, 8 / 90) * 2.0;
  }

  return 1 / (1 + Math.pow(err, SCORE_ERROR_POWER));
}

/** Score every candidate, gate by harmony threshold (with relaxation), tag with
 *  direction + cluster key, and return sorted desc by score. The picker is free
 *  to group by `direction` (sub-cluster headings) and/or `clusterKey` (variety). */
export function rankClusteredCandidates(
  candidates: GraphMaterial[],
  placedCodes: string[],
  byCode: Map<string, GraphMaterial>,
  candidateRole: string,
  chipArchetypeId?: string | null,
): RankedClusteredEntry[] {
  const placed = placedCodes
    .map((c) => byCode.get(c))
    .filter((m): m is GraphMaterial => !!m);
  const state = computePaletteState(placed);

  // Score everything once.
  const scored = candidates.map((c) => ({
    material: c,
    score: harmonyScore(c, placed, state, candidateRole, chipArchetypeId),
  }));

  // Harmony envelope: drop low scorers, relax threshold if too few pass.
  let threshold = harmonyThreshold(state.tension);
  let passed = scored.filter((s) => s.score >= threshold);
  while (passed.length < 3 && threshold > HARMONY_THRESHOLD_FLOOR) {
    threshold = Math.max(HARMONY_THRESHOLD_FLOOR, threshold - 0.05);
    passed = scored.filter((s) => s.score >= threshold);
  }

  const placedWood = state.byArchetype.get('wood') ?? [];
  const woodRef = placedWood.length > 0 ? directionReference('wood', state) : null;

  const entries = passed.map(({ material, score: harmScore }) => {
    const direction = directionForCandidate(material, state, chipArchetypeId);

    let finalScore = harmScore;
    if (woodRef && material.texture === 'wood' && direction) {
      const woodScore = woodOnWoodScore(material, woodRef, direction);
      finalScore = 0.6 * harmScore + 0.4 * woodScore;
    }

    return {
      code: material.technicalCode,
      score: finalScore,
      direction,
      clusterKey: `${lBand(material.lightness)}|${hueFamily(material)}|${material.texture}`,
    };
  });

  return entries.sort((a, b) => b.score - a.score);
}
