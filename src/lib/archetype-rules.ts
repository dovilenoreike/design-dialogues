export const LIGHTNESS_THRESHOLD = 20;

export function deriveArchetypeId(
  role: string,
  texture: string,
  lightness: number,
  _warmth: number,
  pattern: number,
  chroma: number = 0,
): string | null {
  // Metal: any role
  if (texture === 'metal') return 'metallic';

  // Wood: any role except worktop
  if (texture === 'wood' && role !== 'worktop') {
    if (lightness >= 60) return 'light-wood';
    if (lightness >= 35) return 'medium-wood';
    return 'dark-wood';
  }

  // Cabinet front plain — chroma distinguishes achromatic from chromatic
  if (role === 'front' && texture === 'plain') {
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
    if (texture === 'stone' ) {
      if (lightness >= 60) return pattern <= 40 ? 'soft-texture-light' : 'bold-texture-light';
      return pattern <= 40 ? 'soft-texture-dark' : 'bold-texture-dark';
    }
    if (texture === 'plain') {
      if (lightness >= 88) return 'white';
      if (lightness < 15) return 'dark'; }
  }

  return null;
}
