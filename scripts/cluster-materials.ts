#!/usr/bin/env npx tsx

/**
 * cluster-materials.ts
 *
 * Usage:
 *   --clusters           Dry-run: show cluster groupings (default if no mode given)
 *   --clusters --apply   Write cluster_id to DB for unassigned materials
 *   --synonyms           Dry-run: show synonym candidates (tighter thresholds)
 *   --synonyms --apply   Write synonym_id to DB for unassigned materials
 *
 * Stability rule (both modes):
 *   - Materials that already have the column set keep their value.
 *   - Re-running is safe: only null materials are touched.
 *
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// ─── Thresholds ───────────────────────────────────────────────────────────────

/** Cluster groupings — visually similar but not necessarily interchangeable. */
const CLUSTER_THRESHOLDS = {
  lightness: 7,    // 0–100 scale
  warmth:    0.07, // -1–1 scale
  pattern:   7,    // 0–100 scale
  chroma:    7,    // 0–100 scale
  hue_angle: 15,   // degrees; achromatic (null) only matches achromatic
};

/** Synonym groupings — nearly identical, meant to share pairings. */
const SYNONYM_THRESHOLDS = {
  lightness: 3,
  warmth:    0.03,
  pattern:   3,
  chroma:    3,
  hue_angle: 5,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Material {
  technical_code: string;
  role:           string[];
  texture:        string;
  lightness:      number;
  warmth:         number;
  pattern:        number;
  chroma:         number;
  hue_angle:      number | null;
  cluster_id:     string | null;
  synonym_id:     string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Circular angular distance on 0–360° scale. */
function hueDist(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null || b === null) return 180;
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function sharesRole(a: Material, b: Material): boolean {
  return a.role.some(r => b.role.includes(r));
}

type Thresholds = typeof CLUSTER_THRESHOLDS;

function areSimilar(a: Material, b: Material, t: Thresholds): boolean {
  return (
    sharesRole(a, b) &&
    a.texture === b.texture &&
    Math.abs(a.lightness - b.lightness) <= t.lightness &&
    Math.abs(a.warmth   - b.warmth)    <= t.warmth    &&
    Math.abs(a.pattern  - b.pattern)   <= t.pattern   &&
    Math.abs(a.chroma   - b.chroma)    <= t.chroma    &&
    hueDist(a.hue_angle, b.hue_angle)  <= t.hue_angle
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const mode  = process.argv.includes("--synonyms") ? "synonyms" : "clusters";
const apply = process.argv.includes("--apply");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const supabase = createClient(supabaseUrl, supabaseKey);

const { data: rows, error } = await (supabase as any)
  .from("materials")
  .select("technical_code, role, texture, lightness, warmth, pattern, chroma, hue_angle, cluster_id, synonym_id")
  .order("created_at", { ascending: true })
  .order("technical_code", { ascending: true });
/* eslint-enable @typescript-eslint/no-explicit-any */

if (error || !rows) {
  console.error("❌  Failed to fetch materials:", error?.message);
  process.exit(1);
}

const materials: Material[] = rows;

// ─── Clusters mode ────────────────────────────────────────────────────────────

if (mode === "clusters") {
  const assigned   = materials.filter(m => m.cluster_id !== null);
  const unassigned = materials.filter(m => m.cluster_id === null);

  // Build existing cluster representatives
  const existingClusters = new Map<string, Material>();
  for (const m of assigned) {
    if (!existingClusters.has(m.cluster_id!)) existingClusters.set(m.cluster_id!, m);
  }

  // Assign unassigned materials
  const newAssignments = new Map<string, string>(); // technical_code → cluster_id
  for (const mat of unassigned) {
    let matched: string | null = null;
    for (const [clusterId, rep] of existingClusters) {
      if (areSimilar(mat, rep, CLUSTER_THRESHOLDS)) { matched = clusterId; break; }
    }
    if (!matched) {
      for (const [code, clId] of newAssignments) {
        const rep = unassigned.find(m => m.technical_code === code);
        if (rep && areSimilar(mat, rep, CLUSTER_THRESHOLDS)) { matched = clId; break; }
      }
    }
    if (!matched) {
      matched = randomUUID();
      existingClusters.set(matched, mat);
    }
    newAssignments.set(mat.technical_code, matched);
  }

  // Build full report
  const allClusters = new Map<string, string[]>();
  for (const m of assigned) {
    const arr = allClusters.get(m.cluster_id!) ?? [];
    arr.push(m.technical_code);
    allClusters.set(m.cluster_id!, arr);
  }
  for (const [code, clId] of newAssignments) {
    const arr = allClusters.get(clId) ?? [];
    arr.push(code + " [new]");
    allClusters.set(clId, arr);
  }

  let singletons = 0, clusters = 0;
  for (const members of allClusters.values()) {
    if (members.length === 1) singletons++; else clusters++;
  }

  console.log(`\n── Cluster report ──────────────────────────────────────`);
  console.log(`  Existing materials:    ${assigned.length}`);
  console.log(`  Unassigned materials:  ${unassigned.length}`);
  console.log(`  Clusters (≥2 members): ${clusters}`);
  console.log(`  Singletons:            ${singletons}`);
  console.log(`\n── Clusters with 2+ members ────────────────────────────`);
  for (const [clId, members] of allClusters) {
    if (members.length < 2) continue;
    console.log(`\n  ${clId}`);
    for (const code of members) console.log(`    ${code}`);
  }

  if (newAssignments.size === 0) {
    console.log("\n✅  All materials already have cluster_id — nothing to do.\n");
    process.exit(0);
  }

  console.log(`\n── New assignments (${newAssignments.size} materials) ──────────────`);
  for (const [code, clId] of newAssignments) {
    console.log(`  ${code.padEnd(40)} → ${clId}`);
  }

  if (!apply) {
    console.log("\n(Dry-run — pass --apply to write cluster_id to DB)\n");
    process.exit(0);
  }

  console.log("\nApplying cluster_id…");
  let failed = 0;
  for (const [code, clId] of newAssignments) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { error: upErr } = await (supabase as any)
      .from("materials").update({ cluster_id: clId }).eq("technical_code", code);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    if (upErr) { console.error(`  ❌  ${code}: ${upErr.message}`); failed++; }
  }
  if (failed === 0) console.log(`✅  Done — ${newAssignments.size} materials updated.\n`);
  else { console.log(`⚠️  Done with ${failed} errors.\n`); process.exit(1); }
  process.exit(0);
}

// ─── Synonyms mode ────────────────────────────────────────────────────────────

if (mode === "synonyms") {
  // Only consider materials without a synonym_id yet
  const unassigned = materials.filter(m => m.synonym_id === null);
  const assigned   = materials.filter(m => m.synonym_id !== null);

  const synonymGroups: string[][] = [];
  const seen = new Set<string>();

  for (const mat of unassigned) {
    if (seen.has(mat.technical_code)) continue;
    const group = unassigned.filter(
      other =>
        other !== mat &&
        !seen.has(other.technical_code) &&
        areSimilar(mat, other, SYNONYM_THRESHOLDS)
    );
    if (group.length > 0) {
      const all = [mat, ...group];
      synonymGroups.push(all.map(m => m.technical_code));
      all.forEach(m => seen.add(m.technical_code));
    }
  }

  console.log(`\n── Synonym report (tighter thresholds) ─────────────────`);
  console.log(`  Already assigned:  ${assigned.length}`);
  console.log(`  Unassigned:        ${unassigned.length}`);
  console.log(`  New groups found:  ${synonymGroups.length}`);

  if (synonymGroups.length === 0) {
    console.log("\n  No synonym candidates found at current thresholds.\n");
    process.exit(0);
  }

  // Assign one UUID per group
  const newAssignments = new Map<string, string>(); // technical_code → synonym_id
  for (const g of synonymGroups) {
    const id = randomUUID();
    for (const code of g) newAssignments.set(code, id);
  }

  console.log(`\n── Synonym groups ───────────────────────────────────────`);
  for (const g of synonymGroups) {
    const id = newAssignments.get(g[0])!;
    console.log(`\n  ${id}`);
    for (const code of g) console.log(`    ${code}`);
  }

  if (!apply) {
    console.log("\n(Dry-run — pass --apply to write synonym_id to DB)\n");
    process.exit(0);
  }

  console.log("\nApplying synonym_id…");
  let failed = 0;
  for (const [code, synId] of newAssignments) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { error: upErr } = await (supabase as any)
      .from("materials").update({ synonym_id: synId }).eq("technical_code", code);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    if (upErr) { console.error(`  ❌  ${code}: ${upErr.message}`); failed++; }
  }
  if (failed === 0) console.log(`✅  Done — ${newAssignments.size} materials updated.\n`);
  else { console.log(`⚠️  Done with ${failed} errors.\n`); process.exit(1); }
  process.exit(0);
}
