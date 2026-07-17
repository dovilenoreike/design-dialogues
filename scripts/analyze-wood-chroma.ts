#!/usr/bin/env npx tsx

/**
 * analyze-wood-chroma.ts
 *
 * Tests the wood-curve's chroma assumption against real data. Answers two
 * questions we can't settle by reasoning:
 *
 *   1. CALIBRATION — does DB chroma actually rise as woods get darker, the way
 *      the curve's `C = anchor.C · (1 + alpha·ΔL_rel)` predicts? Or is it flat /
 *      the other way? (The UI symptom: curve expects more chroma for dark woods
 *      than the image score shows.)
 *
 *   2. CONFIDENCE — is chroma noisier (wider spread) at the dark and light
 *      extremes? DB chroma is HSV saturation (score-material-colors.ts), and
 *      S = (max−min)/max is numerically unstable as max→0 (dark) or as channels
 *      converge (light). If spread balloons at the extremes, a lightness-keyed
 *      tolerance is justified.
 *
 * Read-only. No scoring, no writes. Same Supabase/env pattern as
 * analyze-material-trajectories.ts.
 *
 * Usage:
 *   npx tsx scripts/analyze-wood-chroma.ts               (uses DEFAULT_CONSTANTS.alpha)
 *   npx tsx scripts/analyze-wood-chroma.ts --alpha=-0.22 (test a candidate alpha)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { woodCurve, DEFAULT_CONSTANTS, salience } from '../src/lib/wood-curve';

// ─── Load env (mirrors analyze-material-trajectories.ts) ────────────────────────
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  // .env holds the VITE_ vars; .env.local holds the service key. Local wins.
  for (const file of ['.env', '.env.local']) {
    const envPath = path.join(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env['VITE_SUPABASE_URL'] ?? env['SUPABASE_URL'] ?? '';
const SUPABASE_KEY = env['VITE_SUPABASE_PUBLISHABLE_KEY'] ?? env['SUPABASE_SERVICE_ROLE_KEY'] ?? env['SUPABASE_KEY'] ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Optional alpha override so candidate values can be tested against the data.
const alphaArg = process.argv.find(a => a.startsWith('--alpha='));
const ALPHA = alphaArg ? parseFloat(alphaArg.split('=')[1]) : DEFAULT_CONSTANTS.alpha;
const K = { ...DEFAULT_CONSTANTS, alpha: ALPHA };

// ─── Stats helpers ──────────────────────────────────────────────────────────────
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const sd = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
};
function linreg(xs: number[], ys: number[]): { slope: number; intercept: number; r: number } {
  const mx = mean(xs), my = mean(ys);
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const sxy = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
  const syy = ys.reduce((a, y) => a + (y - my) ** 2, 0);
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const r = sxx === 0 || syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
  return { slope, intercept: my - slope * mx, r };
}
const bar = (v: number, scale = 1) => '█'.repeat(Math.max(0, Math.round(v * scale)));

// ─── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching wood materials from Supabase…\n');
  const { data, error } = await supabase
    .from('materials' as any)
    .select('name, texture, lightness, chroma, role')
    .eq('texture', 'wood');

  if (error || !data) {
    console.error('Failed to fetch:', error);
    process.exit(1);
  }

  const woods = (data as any[])
    .filter(m => m.lightness != null && m.chroma != null)
    .map(m => ({ L: Number(m.lightness), C: Number(m.chroma) }));

  if (woods.length < 8) {
    console.error(`Only ${woods.length} scored woods found — not enough to analyze.`);
    process.exit(1);
  }

  const Ls = woods.map(w => w.L);
  const Cs = woods.map(w => w.C);
  console.log(`n=${woods.length} woods · L∈[${Math.min(...Ls).toFixed(0)}, ${Math.max(...Ls).toFixed(0)}] · C∈[${Math.min(...Cs).toFixed(0)}, ${Math.max(...Cs).toFixed(0)}]\n`);

  // ── 1. Chroma vs lightness, binned ────────────────────────────────────────────
  // meanC column → the calibration shape; sdC column → the confidence signal.
  console.log('━━━ Chroma by lightness band ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  L band      n   meanC   sdC    C range      meanC bar');
  const lo = Math.floor(Math.min(...Ls) / 10) * 10;
  const hi = Math.ceil(Math.max(...Ls) / 10) * 10;
  for (let b = lo; b < hi; b += 10) {
    const inBin = woods.filter(w => w.L >= b && w.L < b + 10);
    if (inBin.length === 0) continue;
    const c = inBin.map(w => w.C);
    console.log(
      `  ${String(b).padStart(2)}–${String(b + 10).padStart(3)}  ${String(inBin.length).padStart(4)}  ` +
      `${mean(c).toFixed(1).padStart(5)}  ${sd(c).toFixed(1).padStart(5)}  ` +
      `[${Math.min(...c).toFixed(0).padStart(2)},${Math.max(...c).toFixed(0).padStart(3)}]   ${bar(mean(c), 0.8)}`,
    );
  }

  // ── 2. Empirical slope vs what the curve implies ──────────────────────────────
  const { slope, intercept, r } = linreg(Ls, Cs);
  console.log('\n━━━ Calibration: does chroma rise as woods darken? ━━━━━━━━━━━━━━━━━');
  console.log(`  Empirical   C = ${intercept.toFixed(1)} + (${slope.toFixed(3)})·L   (Pearson r=${r.toFixed(3)})`);
  console.log(`    → per −1 L (darker), chroma changes by ${(-slope).toFixed(3)}`);

  // Curve-implied slope near a typical anchor (mean wood): dC/dL = −alpha·C̄/L̄.
  const Lbar = mean(Ls), Cbar = mean(Cs);
  const curveSlope = -ALPHA * Cbar / Lbar;
  console.log(`  Curve       alpha=${ALPHA}, anchor≈(L${Lbar.toFixed(0)}, C${Cbar.toFixed(0)}) ⇒ implied dC/dL = ${curveSlope.toFixed(3)}`);
  console.log(`    → per −1 L (darker), curve expects chroma to change by ${(-curveSlope).toFixed(3)}`);

  // Suggested alpha that matches the data: alpha = −slope·L̄/C̄.
  const alphaSuggested = (-slope * Lbar) / Cbar;
  console.log(`  ⇒ alpha that fits the data ≈ ${alphaSuggested.toFixed(2)}  (current ${DEFAULT_CONSTANTS.alpha})`);

  // ── 3. Curve prediction vs actual, per band (from the mean-wood anchor) ────────
  console.log(`\n━━━ Curve target vs actual mean, per band (anchor = mean wood, alpha=${ALPHA}) ━━━`);
  // "doc"    = document target = anchor.C·(1+alpha·ΔL) — operates on visual chroma directly.
  // "reproj" = doc target re-projected through the salience ceiling:
  //            doc · salience(L_cand)/salience(L_anchor) — the un-/re-discount fix.
  console.log('  L band    actual   docC  (resid)    reprojC  (resid)');
  const anchor = { L: Lbar, W: 0.4, H: 45, C: Cbar };
  const sAnchor = salience(anchor.L) || 1e-6;
  let docAbs = 0, reprojAbs = 0, nBands = 0;
  for (let b = lo; b < hi; b += 10) {
    const inBin = woods.filter(w => w.L >= b && w.L < b + 10);
    if (inBin.length === 0) continue;
    const actual = mean(inBin.map(w => w.C));
    const center = b + 5;
    const dLrel = (anchor.L - center) / 100;         // ΔL_rel = absolute gap /100
    const doc = woodCurve(anchor, dLrel, K).C;
    const reproj = doc * salience(center) / sAnchor;
    const rDoc = doc - actual, rRe = reproj - actual;
    docAbs += Math.abs(rDoc); reprojAbs += Math.abs(rRe); nBands++;
    const s = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}`;
    console.log(
      `  ${String(b).padStart(2)}–${String(b + 10).padStart(3)}    ${actual.toFixed(1).padStart(5)}  ` +
      `${doc.toFixed(1).padStart(5)}  (${s(rDoc).padStart(5)})    ${reproj.toFixed(1).padStart(5)}  (${s(rRe).padStart(5)})`,
    );
  }
  console.log(`  ── mean |residual| across bands:  doc=${(docAbs / nBands).toFixed(1)}   reproj=${(reprojAbs / nBands).toFixed(1)}`);

  // ── 4. Confidence: is spread bigger at the extremes? ──────────────────────────
  console.log('\n━━━ Confidence: chroma spread (sd) at extremes vs middle ━━━━━━━━━━━');
  const darkC = woods.filter(w => w.L < lo + 15).map(w => w.C);
  const midC = woods.filter(w => w.L >= 40 && w.L < 65).map(w => w.C);
  const lightC = woods.filter(w => w.L >= hi - 15).map(w => w.C);
  console.log(`  dark   (L<${lo + 15})   n=${String(darkC.length).padStart(3)}  sdC=${sd(darkC).toFixed(1)}`);
  console.log(`  middle (40–65)   n=${String(midC.length).padStart(3)}  sdC=${sd(midC).toFixed(1)}`);
  console.log(`  light  (L≥${hi - 15})   n=${String(lightC.length).padStart(3)}  sdC=${sd(lightC).toFixed(1)}`);
  const midSd = sd(midC) || 1;
  console.log(`    → dark/mid spread ratio = ${(sd(darkC) / midSd).toFixed(2)}×, light/mid = ${(sd(lightC) / midSd).toFixed(2)}×`);
  console.log('    (ratios >1 support a wider chroma tolerance at that extreme)\n');
}

main().catch(e => { console.error(e); process.exit(1); });
