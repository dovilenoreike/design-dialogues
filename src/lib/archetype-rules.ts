export const LIGHTNESS_THRESHOLD = 20;
export const BUSY_PATTERN_THRESHOLD = 29;
export const WOOD_WARMTH_MISMATCH_THRESHOLD = 0.20;

function visualChroma(chroma: number, lightness: number): number {
  return chroma * Math.sin(Math.PI * Math.max(0, Math.min(100, lightness)) / 100);
}

// Neutral = virtually achromatic (vc < 1, any hue)
//        OR warm-neutral zone (hue 20–60°) with low visual chroma (vc < 20).
// Everything outside these conditions routes to muted/bold.
export function isNeutralPlain(vc: number, hue_angle: number | null): boolean {
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
  _hue_angle: number | null = null,
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

  // Wood: single 'wood' archetype for both floor and front; worktop handled below
  if (texture === 'wood') {
    if (role !== 'worktop') return 'wood';
  }

  // Stone-like: stone + concrete (same archetype behaviour)
  const isStoneLike = texture === 'stone' || texture === 'concrete';

  // Stone-like floor
  if (isStoneLike && role === 'floor') return 'stone';

  // Cabinet front — plain/textile: no archetype classification; scoring derives the spec
  // from material properties at runtime (see palette-scoring.ts derivePlainArchetypeId).
  const isPlainLike = texture !== 'wood' && !isStoneLike && texture !== 'metal';
  if (role === 'front' && isPlainLike) return null;

  // Worktop
  if (role === 'worktop') {
    if (texture === 'wood') return 'wood';
    if (isStoneLike) return 'stone';
    if (isPlainLike) return lightness >= 45 ? 'light-neutral' : 'dark-neutral';
  }

  return null;
}
