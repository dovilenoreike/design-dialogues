#!/usr/bin/env npx tsx
/**
 * score-material-colors.ts
 *
 * Scores material images for: lightness, warmth, chroma, hue_angle, pattern.
 * Uses BCGSC Color Summarizer API — URLs only (JPG/PNG).
 *
 * Usage:
 *   npx tsx scripts/score-material-colors.ts <url> [...]
 *   npx tsx scripts/score-material-colors.ts --raw <url>
 */

import * as https from "https";
import * as http from "http";
import * as path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const NUM_CLUSTERS  = 5;
const PATTERN_SCALE = 2; // multiply raw spread before clamping to [0,100]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cluster {
  L: number;     // LCH lightness  0-100
  C: number;     // HSV saturation 0-100
  H: number;     // HSV hue angle  0-360
  bStar: number; // warmth proxy: cos((H-30°)) × S/100
  f: number;     // fraction of pixels 0-1
  hex: string;
}

interface MaterialScores {
  lightness:  number;
  warmth:     number;
  chroma:     number;
  hue_angle:  number;
  pattern:    number;
}

interface ApiRawCluster {
  hsv: [string, string, string];
  lch: [string, string, string];
  f:   number;
  hex: string[];
  n:   number;
}

interface ApiStats {
  hsv: { h: { median: number[] }; s: { median: number[] }; v: { median: number[] } };
  lch: { l: { median: number[] }; c: { median: number[] }; h: { median: number[] } };
  lab: { b: { median: number[] }; a: { median: number[] }; l: { median: number[] } };
}

interface ApiResponse {
  clusters: Record<string, ApiRawCluster>;
  stats:    ApiStats;
}

// ─── BCGSC API ────────────────────────────────────────────────────────────────

async function fetchApiClusters(imageUrl: string): Promise<{ clusters: Cluster[]; stats: ApiStats }> {
  const params = new URLSearchParams({
    url:          imageUrl,
    json:         "1",
    num_clusters: String(NUM_CLUSTERS),
    precision:    "medium",
  });
  const apiUrl = `https://mk.bcgsc.ca/color-summarizer/?${params}`;

  const buf  = await downloadBuffer(apiUrl);
  const text = buf.toString("utf8");
  let data: ApiResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON:\n${text.slice(0, 400)}`);
  }
  if (!data.clusters) throw new Error(`No clusters in API response`);

  const clusters: Cluster[] = Object.values(data.clusters).map((raw) => {
    const hsvH = parseFloat(raw.hsv[0]);
    const hsvS = parseFloat(raw.hsv[1]);
    const lchL = parseFloat(raw.lch[0]);
    return {
      L:     lchL,
      C:     hsvS,
      H:     hsvH,
      bStar: Math.cos(toRad(hsvH - 30)) * (hsvS / 100),
      f:     raw.f,
      hex:   raw.hex[0],
    };
  }).sort((a, b) => b.f - a.f);

  return { clusters, stats: data.stats };
}

// ─── Score computation ────────────────────────────────────────────────────────

function computeScores(clusters: Cluster[]): MaterialScores {
  const total = clusters.reduce((s, c) => s + c.f, 0) || 1;

  const lightness = clusters.reduce((s, c) => s + c.L * c.f, 0) / total;
  const chroma    = clamp(clusters.reduce((s, c) => s + c.C * c.f, 0) / total, 0, 100);
  const bWeighted = clusters.reduce((s, c) => s + c.bStar * c.f, 0) / total;
  const warmth    = clamp(bWeighted, -1, 1);

  const dominant  = clusters.reduce((best, c) => c.f > best.f ? c : best, clusters[0]);
  const hue_angle = Math.round(dominant.H * 10) / 10;

  const Ls = clusters.map(c => c.L);
  const Ss = clusters.map(c => c.C);

  const spreadL = Math.max(...Ls) - Math.min(...Ls);
  const avgS    = Ss.reduce((s, v) => s + v, 0) / Ss.length;
  // Dampen S spread for achromatic materials: near-zero avgS means S values are noise.
  // Ramp from 0 contribution at avgS=0 to full contribution at avgS≥25.
  const spreadS = (Math.max(...Ss) - Math.min(...Ss)) * Math.min(1, avgS / 25);

  const pattern = clamp(Math.max(spreadL, spreadS) * PATTERN_SCALE, 0, 100);

  return {
    lightness: Math.round(lightness * 10) / 10,
    warmth:    Math.round(warmth * 100)   / 100,
    chroma:    Math.round(chroma * 10)    / 10,
    hue_angle,
    pattern:   Math.round(pattern),
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
function toRad(d: number): number { return d * Math.PI / 180; }

async function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
  });
}

// ─── Pretty print ─────────────────────────────────────────────────────────────

function printClusters(clusters: Cluster[]): void {
  console.log(`\n  Clusters (BCGSC API):`);
  console.log("  #    pct    hex      LCH-L  HSV-H°  HSV-S%  warmth");
  console.log("  ──────────────────────────────────────────────────────");
  clusters.forEach((c, i) => {
    console.log(
      `  ${i+1}  ${(c.f*100).toFixed(1).padStart(5)}%  ${c.hex}` +
      `  ${c.L.toFixed(1).padStart(6)}` +
      `  ${c.H.toFixed(1).padStart(7)}` +
      `  ${c.C.toFixed(1).padStart(7)}` +
      `  ${c.bStar.toFixed(3).padStart(7)}`
    );
  });
}

function printStats(stats: ApiStats): void {
  const hsv = stats.hsv, lch = stats.lch, lab = stats.lab;
  console.log(
    `\n  Image stats (median):` +
    `  HSV H=${hsv.h.median[0]}°  S=${hsv.s.median[0]}%  V=${hsv.v.median[0]}%` +
    `  |  LCH L=${lch.l.median[0]}  C=${lch.c.median[0]}  H=${lch.h.median[0]}°` +
    `  |  Lab b*=${lab.b.median[0]}`
  );
}

function printScores(scores: MaterialScores): void {
  console.log("\n  ┌─────────────────────────────────┐");
  console.log(`  │  lightness   ${String(scores.lightness).padEnd(20)}│`);
  console.log(`  │  warmth      ${String(scores.warmth).padEnd(20)}│`);
  console.log(`  │  chroma      ${String(scores.chroma).padEnd(20)}│`);
  console.log(`  │  hue_angle   ${String(scores.hue_angle).padEnd(20)}│`);
  console.log(`  │  pattern     ${String(scores.pattern).padEnd(20)}│`);
  console.log("  └─────────────────────────────────┘");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args    = process.argv.slice(2);
  const rawMode = args.includes("--raw");
  const sources = args.filter(a => !a.startsWith("--"));

  if (!sources.length) {
    console.error("Usage: npx tsx scripts/score-material-colors.ts [--raw] <url> ...");
    process.exit(1);
  }

  for (const src of sources) {
    if (!src.startsWith("http://") && !src.startsWith("https://")) {
      console.error(`  SKIP: ${src} — only URLs are supported (BCGSC requires a public JPG/PNG URL)`);
      continue;
    }

    const label = src.split("/").pop()!;
    console.log(`\n${"═".repeat(60)}`);
    console.log(`  ${label}`);
    console.log("═".repeat(60));

    try {
      const { clusters, stats } = await fetchApiClusters(src);

      if (rawMode) console.log("\n  Raw clusters:\n" + JSON.stringify(clusters, null, 2));

      printClusters(clusters);
      printStats(stats);

      const scores = computeScores(clusters);
      printScores(scores);
    } catch (err) {
      console.error(`  ERROR: ${(err as Error).message}`);
    }
  }
}

main();
