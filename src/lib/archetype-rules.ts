export const LIGHTNESS_THRESHOLD = 20;

export function deriveArchetypeId(
  role: string,
  texture: string,
  lightness: number,
  warmth: number,
  pattern: number,
  chroma: number = 0,
): string | null {
  // Accent role: map to moodboard archetype IDs (gold / silver / bronze / black / colour)
  if (role === 'accent') {
    if (texture === 'metal') {
      if (chroma >= 18) return 'gold';       // high chroma warm → gold
      if (warmth >= 0.1) return 'bronze';    // warm but lower chroma → aged bronze
      return 'silver';                        // neutral/cool → chrome/silver
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
    return lightness >= 55 ? 'light-stone' : 'dark-stone';
  }

  // Cabinet front — any non-wood/stone-like/metal texture (plain, textile, …)
  const isPlainLike = texture !== 'wood' && !isStoneLike && texture !== 'metal';
  if (role === 'front' && isPlainLike) {
    if (chroma < 15) {
      // Achromatic: whites, greys, beiges, taupes
      if (lightness >= 80) return 'white';
      if (lightness >= 45) return 'neutral';
      return 'dark';
    } else {
      // Chromatic: pastels and bold colours
      return lightness >= 55 ? 'pastel' : 'bold';
    }
  }

  // Worktop
  if (role === 'worktop') {
    if (texture === 'wood') return 'wood';
    if (isStoneLike) {
      if (lightness >= 50) return pattern <= 40 ? 'soft-texture-light' : 'bold-texture-light';
      return pattern <= 40 ? 'soft-texture-dark' : 'bold-texture-dark';
    }
    if (isPlainLike) {
      if (chroma < 15) {
        if (lightness >= 80) return 'white';
        if (lightness >= 45) return 'neutral';
        return 'dark';
      }
      return lightness >= 55 ? 'pastel' : 'bold';
    }
  }

  return null;
}
