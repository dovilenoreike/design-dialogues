#!/usr/bin/env npx tsx

/**
 * preview-wood-curve.ts
 *
 * Prints the wood-matching curve output for a few representative anchor woods,
 * so the co-variation of chroma / warmth / hue with lightness can be eyeballed.
 * Reads nothing from Supabase — anchors are hardcoded, so it runs with zero
 * DB/env dependency.
 *
 * Usage:
 *   npx tsx scripts/preview-wood-curve.ts
 */

import { woodCurve, WOOD_DIRECTIONS, type WoodVector } from '../src/lib/wood-curve';

const ANCHORS: { name: string; vec: WoodVector }[] = [
  { name: 'light oak',  vec: { L: 72, W: 0.45, H: 60, C: 22 } },
  { name: 'mid walnut', vec: { L: 45, W: 0.55, H: 45, C: 34 } },
  { name: 'dark wenge', vec: { L: 25, W: 0.40, H: 30, C: 28 } },
];

const f = (n: number) => n.toFixed(2).padStart(7);
const row = (label: string, v: WoodVector) =>
  `  ${label.padEnd(16)} L${f(v.L)}   W${f(v.W)}   H${f(v.H)}   C${f(v.C)}`;

for (const { name, vec } of ANCHORS) {
  console.log(`\n${name}`);
  console.log(row('anchor', vec));
  for (const [dir, deltaLRel] of Object.entries(WOOD_DIRECTIONS)) {
    const label = `${dir} (${deltaLRel >= 0 ? '+' : ''}${deltaLRel})`;
    console.log(row(label, woodCurve(vec, deltaLRel)));
  }
}
console.log('');
