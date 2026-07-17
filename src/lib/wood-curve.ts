/**
 * wood-curve.ts — generative wood-matching curve.
 *
 * Given an anchor wood, this returns the *ideal harmonious partner* as a single
 * function of one knob: a relative lightness shift `ΔL_rel`. Chroma, warmth, and
 * hue are dependent outputs that co-vary with the lightness shift — so "light /
 * tonal / dark" are not separate rules, just different sample points on one curve.
 *
 * Based on `material-matching/gemini-wood-matching.md` §2, with two agreed changes:
 *  · ΔL_rel is an ABSOLUTE lightness gap (L_anchor − L_cand)/100, not the doc's
 *    relative (L_a−L_c)/L_a — relative blows up for dark anchors.
 *  · the chroma output is re-projected through salience (treating our DB chroma as
 *    perceptual); warmth couples to that re-projected chroma. L and H follow the
 *    spec. `alpha` is 1.2 (top of the doc's 0.8–1.2 range).
 *
 * WIRED INTO LIVE RANKING: `scoreWoodCurve()` in `palette-scoring-v2.ts` calls
 * `woodCurve(...)` to score/rank wood candidates in the picker, so changing
 * DEFAULT_CONSTANTS here changes live wood ranking. The `chromaTolerance()`
 * helper below is the exception — not yet consumed by the scorer.
 *
 * Axes match the `GraphMaterial` scales (see src/lib/graph-compatibility.ts):
 *   L lightness 0–100 · W warmth −1..1 · H hue_angle 0–360° · C chroma 0–100
 */


export interface WoodVector {
  L: number;
  W: number;
  H: number;
  C: number;
}

export interface WoodCurveConstants {
  alpha: number; // chroma scaling — darker wood keeps richness (Gemini range 0.8–1.2)
  beta:  number; // chroma→warmth exponent (default 0.5)
  gamma: number; // lightness→warmth exponent (default 0.3)
  theta: number; // hue shift factor, CIELAB degrees (default 12)
}

// alpha = 1.2 — the top of the Gemini doc's 0.8–1.2 range. Tuned up so lighter
// candidates come out appropriately muted: a lighter partner has ΔL_rel < 0, so a
// higher alpha shrinks Cdoc more, offsetting the salience re-projection's chroma
// boost (see woodCurve). beta/gamma/theta stay at the doc defaults.
export const DEFAULT_CONSTANTS: WoodCurveConstants = {
  alpha: 1.2,
  beta:  0.5,
  gamma: 0.3,
  theta: 12,
};

// ── Chroma-match tolerance (confidence, not calibration) ──────────────────────
// Not yet wired into scoring — the curve prototype stays isolated. Captures the
// design decision: widen the chroma tolerance where chroma is least trustworthy.
export const WOOD_CHROMA_BASE_TOL = 6;   // chroma units of slack at mid-lightness
export const WOOD_CHROMA_TOL_GAIN = 1.0; // extra slack toward the extremes: up to (1+gain)×

/**
 * salience(L) — perceptual weight sin(πL/100); matches colourSalience in
 * palette-scoring-v2. Peaks at L=50, → 0 at black/white. Used to re-project the
 * chroma value in woodCurve (un-/re-discount, treating DB chroma as perceptual)
 * and to shape the chroma tolerance below.
 */
export function salience(L: number): number {
  return Math.sin(Math.PI * Math.max(0, Math.min(100, L)) / 100);
}

/**
 * Chroma-match tolerance at lightness L. Widens smoothly toward black/white in
 * proportion to how far salience has fallen — no fixed L thresholds:
 *
 *   tol(L) = baseTol · (1 + gain·(1 − salience(L)))
 *
 * At L=50 → baseTol (tightest, salience=1). At the extremes → baseTol·(1+gain).
 * This is a *confidence* widening: HSV-saturation chroma is least reliable where
 * salience is low (near-black divides by a tiny max channel; near-white washes
 * out) and the catalogue is sparse there, so we forgive more chroma error.
 */
export function chromaTolerance(
  L: number,
  baseTol = WOOD_CHROMA_BASE_TOL,
  gain = WOOD_CHROMA_TOL_GAIN,
): number {
  return baseTol * (1 + gain * (1 - salience(L)));
}

/**
 * Ideal harmonious partner for `anchor`, shifted by a relative lightness
 * reduction `deltaLRel` (positive = darker, negative = lighter). The four
 * dependent equations run sequentially (each feeds the next), per Gemini §2.
 *
 * Note: the warmth step is *multiplicative* (from the doc as written). It scales
 * warmth magnitude, so for the rare cool wood (W < 0) it pushes cooler, and it is
 * undefined at W = 0. Left faithful to the spec on purpose — tune later.
 */
export function woodCurve(
  anchor: WoodVector,
  deltaLRel: number,
  k: WoodCurveConstants = DEFAULT_CONSTANTS,
): WoodVector {
  // ΔL_rel is the ABSOLUTE lightness gap (L_anchor − L_cand)/100, bounded to
  // [−1, 1]. Recover the candidate's own lightness (the inverse) for the salience
  // re-projection below.
  const L = anchor.L - deltaLRel * 100;
  // Document Step 2 chroma. Guard the multiplier at ≥0 so an extreme lightening
  // (large negative ΔL_rel) at high alpha can't produce negative chroma / NaN warmth.
  const Cdoc = anchor.C * Math.max(0, 1 + k.alpha * deltaLRel);
  // Re-project to perceptual chroma (treats DB chroma as perceptual): un-discount
  // the anchor to intrinsic → apply the document shift → re-discount at the target's
  // own lightness.  C = salience( unsalience(anchor.C) · (1 + α·ΔL) ).
  const C = Cdoc * salience(L) / (salience(anchor.L) || 1e-6);
  // Warmth couples to the re-projected chroma too, so it carries the same salience effect.
  const W = anchor.W
    * Math.pow(C / anchor.C, k.beta)
    * Math.pow(1 / (1 - deltaLRel), k.gamma);
  const H = anchor.H - k.theta * deltaLRel;
  return { L, W, H, C };
}

/**
 * Named sample points on the curve. "Light / tonal / dark" are just ΔL_rel
 * values — add or move a point by editing this map, no new tuning table needed.
 */
export const WOOD_DIRECTIONS: Record<string, number> = {
  lighter: -0.15,
  tonal:    0.00,
  darker:  +0.15,
  // soft_contrast (±0.35) intentionally omitted for now — add later if wanted.
};
