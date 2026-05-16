export const LIGHTNESS_THRESHOLD = 20;
export const BUSY_PATTERN_THRESHOLD = 29;
export const WOOD_WARMTH_MISMATCH_THRESHOLD = 0.09;

function visualChroma(chroma: number, lightness: number): number {
  return chroma * Math.sin(Math.PI * Math.max(0, Math.min(100, lightness)) / 100);
}

// Neutral = virtually achromatic (vc < 1, any hue)
//        OR warm-neutral zone (hue 20–60°) with low visual chroma (vc < 20).
// Everything outside these conditions routes to muted/bold.
function isNeutralPlain(vc: number, hue_angle: number | null): boolean {
  if (vc < 1) return true;
  return hue_angle !== null && hue_angle >= 20 && hue_angle <= 60 && vc < 20;
}

export function deriveArchetypeId(
  role: string,
  texture: string,
  lightness: number,
  warmth: number,
  pattern: number,
  chroma: number = 0,
  hue_angle: number | null = null,
): string | null {
  // Accent role: map to moodboard archetype IDs (gold / silver / bronze / black / colour)
  if (role === 'accent') {
    if (texture === 'metal') {
      if (visualChroma(chroma, lightness) >= 15) return 'gold';  // visually warm/rich → gold
      if (warmth >= 0.1) return 'bronze';                         // warm but lower visual chroma → aged bronze
      return 'silver';                                             // neutral/cool → chrome/silver
    }
    // plain accent (e.g. black matte, wine red)
    if (lightness < 20) return 'black';
    return 'colour';
  }
  // Metal: any other role
  if (texture === 'metal') return 'metallic';

  // Wood: any role except worktop
  if (texture === 'wood' && role !== 'worktop') {
    if (lightness >= 60) return 'light-wood';
    if (lightness >= 35) return 'medium-wood';
    return 'dark-wood';
  }

  // Stone-like: stone + concrete (same archetype behaviour)
  const isStoneLike = texture === 'stone' || texture === 'concrete';

  // Stone-like floor
  if (isStoneLike && role === 'floor') {
    if (pattern > BUSY_PATTERN_THRESHOLD) return 'bold-stone';
    return lightness >= 55 ? 'light-stone' : 'dark-stone';
  }

  // Cabinet front — any non-wood/stone-like/metal texture (plain, textile, …)
  const isPlainLike = texture !== 'wood' && !isStoneLike && texture !== 'metal';
  if (role === 'front' && isPlainLike) {
    const vc = visualChroma(chroma, lightness);
    if (isNeutralPlain(vc, hue_angle)) {
      if (lightness >= 45) return 'light-neutral';
      return 'dark-neutral';
    }
    if (vc < 20) return 'muted';
    return 'bold';
  }

  // Worktop
  if (role === 'worktop') {
    if (texture === 'wood') return 'wood';
    if (isStoneLike) {
      if (lightness >= 50) return pattern <= 40 ? 'soft-texture-light' : 'bold-texture-light';
      return pattern <= 40 ? 'soft-texture-dark' : 'bold-texture-dark';
    }
    if (isPlainLike) {
      const vc = visualChroma(chroma, lightness);
      if (isNeutralPlain(vc, hue_angle)) {
        if (lightness >= 60) return 'white';
        return 'dark-neutral';
      }
      if (vc < 20) return 'muted';
      return 'bold';
    }
  }

  return null;
}
