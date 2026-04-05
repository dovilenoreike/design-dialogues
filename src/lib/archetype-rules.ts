export const LIGHTNESS_THRESHOLD = 20;

export function deriveArchetypeId(
  role: string,
  texture: string,
  lightness: number,
  warmth: number,
  pattern: number,
): string | null {
  // Metal: any role
  if (texture === 'metal') return 'metallic';

  // Wood: any role except worktop
  if (texture === 'wood' && role !== 'worktop') {
    if (lightness >= 80) return 'bleached-wood';
    if (lightness >= 60) return 'light-wood';
    if (lightness >= 35) return 'medium-wood';
    return 'dark-wood';
  }

  // Floor stone/plain → concrete
  if (role === 'floor' && (texture === 'stone' || texture === 'plain')) return 'concrete';

  // Cabinet front plain
  if (role === 'front' && texture === 'plain') {
    if (lightness >= 88) return 'white';
    if (lightness >= 68) return 'pastel';
    if (lightness >= 55) return 'neutral';
    if (lightness >= 15) return pattern > 40 ? 'bold' : 'dark';
    return 'black';
  }

  // Worktop
  if (role === 'worktop') {
    if (texture === 'wood') return 'wood';
    if (texture === 'stone' || texture === 'plain') {
      if (lightness >= 88) return 'white';
      if (lightness < 15) return 'black';
      if (warmth < -0.05) return 'concrete';
      if (lightness >= 60) return pattern <= 40 ? 'soft-texture-light' : 'bold-texture-light';
      if (lightness >= 35) return pattern <= 40 ? 'soft-texture-medium' : 'bold-texture-medium';
      return pattern <= 40 ? 'soft-texture-dark' : 'bold-texture-dark';
    }
  }

  // Tile stone/plain
  if (role === 'tile' && (texture === 'stone' || texture === 'plain')) {
    if (lightness < 20) return 'black-marble';
    if (lightness < 60) return 'medium-warm-concrete';
    if (lightness < 80) return 'light-warm-concrete';
    return 'warm-white-concrete';
  }

  return null;
}
