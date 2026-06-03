/**
 * Trajectory analysis — computes correlations between L, W, C per texture family.
 * Run with: npx tsx scripts/analyze-material-trajectories.ts
 *
 * Outputs:
 *  - Per-texture-family mean, stddev for L, W, C
 *  - Pearson correlation matrix (L vs W, L vs C, W vs C)
 *  - First principal component (the "natural direction")
 *  - Suggested k_LW and k_LC coefficients for trajectory scoring
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ─── Load env ──────────────────────────────────────────────────────────────────
function loadEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env['VITE_SUPABASE_URL'] ?? env['SUPABASE_URL'] ?? '';
const SUPABASE_KEY = env['VITE_SUPABASE_PUBLISHABLE_KEY'] ?? env['SUPABASE_KEY'] ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Math helpers ──────────────────────────────────────────────────────────────
function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
}

function pearson(xs: number[], ys: number[]): number {
  const mx = mean(xs), my = mean(ys);
  const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((a, x) => a + (x - mx) ** 2, 0) *
    ys.reduce((a, y) => a + (y - my) ** 2, 0)
  );
  return den === 0 ? 0 : num / den;
}

// Simple 3×3 PCA via power iteration on covariance matrix.
// Returns [PC1, PC2, explained_variance_ratio_PC1] where PC1/PC2 are [dL, dW, dC] unit vectors.
function pca3(data: [number, number, number][]): {
  pc1: [number, number, number];
  pc2: [number, number, number];
  var1: number; // fraction of variance explained by PC1
} {
  const n = data.length;
  const mL = mean(data.map(d => d[0]));
  const mW = mean(data.map(d => d[1]));
  const mC = mean(data.map(d => d[2]));

  // 3×3 covariance matrix
  let cLL = 0, cLW = 0, cLC = 0, cWW = 0, cWC = 0, cCC = 0;
  for (const [l, w, c] of data) {
    const dl = l - mL, dw = w - mW, dc = c - mC;
    cLL += dl * dl; cLW += dl * dw; cLC += dl * dc;
    cWW += dw * dw; cWC += dw * dc; cCC += dc * dc;
  }
  cLL /= n; cLW /= n; cLC /= n; cWW /= n; cWC /= n; cCC /= n;

  const cov = [
    [cLL, cLW, cLC],
    [cLW, cWW, cWC],
    [cLC, cWC, cCC],
  ];

  function matVec(m: number[][], v: number[]): number[] {
    return m.map(row => row.reduce((a, x, j) => a + x * v[j], 0));
  }
  function norm(v: number[]): number {
    return Math.sqrt(v.reduce((a, x) => a + x * x, 0));
  }
  function normalise(v: number[]): number[] {
    const n = norm(v);
    return n === 0 ? v : v.map(x => x / n);
  }
  function eigenByPower(mat: number[][], deflate?: number[]): { vec: number[]; val: number } {
    let v = deflate ? normalise([1, 1, 1].map((_, i) => (i === 0 ? 1 : 0.3) - (deflate[i] ?? 0))) : [1, 0.3, 0.1];
    v = normalise(v);
    for (let i = 0; i < 200; i++) {
      let nv = matVec(mat, v);
      if (deflate) {
        // Deflate: project out PC1 direction
        const dot = nv.reduce((a, x, j) => a + x * deflate[j], 0);
        nv = nv.map((x, j) => x - dot * deflate[j]);
      }
      v = normalise(nv);
    }
    const Av = matVec(mat, v);
    const eigenval = v.reduce((a, x, i) => a + x * Av[i], 0);
    return { vec: v, val: eigenval };
  }

  const { vec: pc1, val: val1 } = eigenByPower(cov);
  const { vec: pc2, val: val2 } = eigenByPower(cov, pc1);
  const totalVar = cLL + cWW + cCC;

  // Normalise PC1 so dL component is positive (easier to read)
  const sign = pc1[0] < 0 ? -1 : 1;

  return {
    pc1: [pc1[0] * sign, pc1[1] * sign, pc1[2] * sign] as [number, number, number],
    pc2: [pc2[0], pc2[1], pc2[2]] as [number, number, number],
    var1: totalVar > 0 ? val1 / totalVar : 0,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching materials from Supabase…\n');
  const { data, error } = await supabase
    .from('materials' as any)
    .select('texture, lightness, warmth, chroma, hue_angle, role');

  if (error || !data) {
    console.error('Failed to fetch:', error);
    process.exit(1);
  }

  // Group by texture family
  const families: Record<string, { L: number[]; W: number[]; C: number[] }> = {};
  for (const m of data as any[]) {
    const tex = (m.texture as string) ?? 'unknown';
    if (!families[tex]) families[tex] = { L: [], W: [], C: [] };
    if (m.lightness != null) families[tex].L.push(m.lightness);
    if (m.warmth   != null) families[tex].W.push(m.warmth);
    if (m.chroma   != null) families[tex].C.push(m.chroma);
  }

  for (const [tex, { L, W, C }] of Object.entries(families).sort()) {
    if (L.length < 5) continue;
    const n = Math.min(L.length, W.length, C.length);
    // Trim to matched-length arrays
    const ls = L.slice(0, n), ws = W.slice(0, n), cs = C.slice(0, n);

    console.log(`━━━ ${tex.toUpperCase()} (n=${n}) ━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  L: mean=${mean(ls).toFixed(1)}  sd=${stddev(ls).toFixed(1)}  range=[${Math.min(...ls).toFixed(0)}, ${Math.max(...ls).toFixed(0)}]`);
    console.log(`  W: mean=${mean(ws).toFixed(3)} sd=${stddev(ws).toFixed(3)}  range=[${Math.min(...ws).toFixed(2)}, ${Math.max(...ws).toFixed(2)}]`);
    console.log(`  C: mean=${mean(cs).toFixed(1)}  sd=${stddev(cs).toFixed(1)}  range=[${Math.min(...cs).toFixed(0)}, ${Math.max(...cs).toFixed(0)}]`);

    const rLW = pearson(ls, ws);
    const rLC = pearson(ls, cs);
    const rWC = pearson(ws, cs);
    console.log(`  Pearson r:  L↔W=${rLW.toFixed(3)}  L↔C=${rLC.toFixed(3)}  W↔C=${rWC.toFixed(3)}`);

    // PCA — normalise axes to 0–1 range first so they're comparable
    const lScale = 100, wScale = 2, cScale = 100;
    const points: [number, number, number][] = ls.map((l, i) => [l / lScale, ws[i] / wScale, cs[i] / cScale]);
    const { pc1, var1 } = pca3(points);

    // k_LW = how much W changes per unit L change along PC1
    const k_LW = pc1[0] !== 0 ? (pc1[1] / pc1[0]) * (lScale / wScale) : 0;
    const k_LC = pc1[0] !== 0 ? (pc1[2] / pc1[0]) * (lScale / cScale) : 0;

    console.log(`  PC1 (${(var1 * 100).toFixed(0)}% variance): dL=${pc1[0].toFixed(3)} dW=${pc1[1].toFixed(3)} dC=${pc1[2].toFixed(3)}`);
    console.log(`  → k_LW=${k_LW.toFixed(3)}  k_LC=${k_LC.toFixed(3)}`);
    console.log(`  Reading: per +10 L units, expect W to shift ${(k_LW * 10).toFixed(3)} and C to shift ${(k_LC * 10).toFixed(1)}`);
    console.log();
  }

  console.log('Done. Use k_LW and k_LC as trajectory coefficients in the scoring function.');
}

main().catch(console.error);
