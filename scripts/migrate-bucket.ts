#!/usr/bin/env npx tsx

/**
 * migrate-bucket.ts
 *
 * One-time migration: moves every material image to the canonical bucket path
 *   material-images/{role}/{Brand}/{technical_code}.webp
 * and updates image_url in the DB.
 *
 * Usage:
 *   npx tsx scripts/migrate-bucket.ts           # dry-run — prints what would move
 *   npx tsx scripts/migrate-bucket.ts --apply   # executes moves + DB updates
 *
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import * as https from "https";
import * as http from "http";
import { createClient } from "@supabase/supabase-js";

// ─── Brand display names ──────────────────────────────────────────────────────
// Must match process-new-materials.ts BRAND_CONFIG.displayName

const BRAND_DISPLAY: Record<string, string> = {
  // Floor
  "aspecta":                       "Aspecta",
  "floorest":                      "Floorest",
  "coretec":                       "Coretec",
  "coretec-naturals":              "Coretec",
  "coretec-stone-ceratouch-pico":  "Coretec",
  "invictus":                      "Invictus",
  "invictus-maximus-highland-oak": "Invictus",
  "parador":                       "Parador",
  "1000grindu":                    "1000Grindu",
  // Front
  "kronospan":  "Kronospan",
  "sm-art":     "SM-art",
  "egger":      "Egger",
  "gizir":      "Gizir",
  "skin":       "Skin",
  "fab":        "Fab",
  "icono":      "Icono",
  "luxdezine":  "Luxdezine",
  // Worktop
  "gentas":     "Gentas",
  "w-core":     "W-Core",
  // Tile / floor / worktop brands
  "bari":       "Bari",
  "borneo":     "Borneo",
  "bottega":    "Bottega",
  "dune":       "Dune",
  "florim":     "Florim",
  "fondovalle": "Fondovalle",
  "midtown":    "Midtown",
  "peronda":    "Peronda",
  "rondine":    "Rondine",
  "vitacer":    "Vitacer",
};

const SUPABASE_STORAGE_BASE =
  "https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images";

const BUCKET = "material-images";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractBrand(code: string): string {
  const segments = code.split("-");
  const idIdx = segments.findIndex((s) => /\d/.test(s));
  if (idIdx <= 0) return segments[0];
  return segments.slice(0, idIdx).join("-");
}

function canonicalPath(technicalCode: string, role: string): string {
  if (role === "accent") return `accent/${technicalCode}.webp`;
  const brand = extractBrand(technicalCode);
  const displayName = BRAND_DISPLAY[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
  return `${role}/${displayName}/${technicalCode}.webp`;
}

function canonicalUrl(path: string): string {
  return `${SUPABASE_STORAGE_BASE}/${path}`;
}

function currentPath(imageUrl: string): string {
  const prefix = `${SUPABASE_STORAGE_BASE}/`;
  return imageUrl.startsWith(prefix) ? imageUrl.slice(prefix.length) : imageUrl;
}

async function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
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

// ─── Setup ────────────────────────────────────────────────────────────────────

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
  .select("technical_code, role, image_url")
  .not("image_url", "is", null)
  .order("technical_code", { ascending: true });
/* eslint-enable @typescript-eslint/no-explicit-any */

if (error || !rows) {
  console.error("❌  Failed to fetch materials:", error?.message);
  process.exit(1);
}

// ─── Plan ─────────────────────────────────────────────────────────────────────

interface MoveJob {
  code: string;
  role: string;
  oldUrl: string;
  oldPath: string;
  newPath: string;
  newUrl: string;
}

const toMove: MoveJob[] = [];
const alreadyCorrect: string[] = [];
const unknownBrand: string[] = [];

for (const row of rows) {
  const code: string = row.technical_code;
  const role: string = row.role[0];
  const imageUrl: string = row.image_url;

  const brand = extractBrand(code);
  if (role !== "accent" && !BRAND_DISPLAY[brand]) unknownBrand.push(`${code} (brand: ${brand})`);

  const newPath = canonicalPath(code, role);
  const newUrl  = canonicalUrl(newPath);
  const oldPath = currentPath(imageUrl);

  if (oldPath === newPath) {
    alreadyCorrect.push(code);
  } else {
    toMove.push({ code, role, oldUrl: imageUrl, oldPath, newPath, newUrl });
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

console.log(`\n── Bucket migration plan ───────────────────────────────`);
console.log(`  Already at canonical path: ${alreadyCorrect.length}`);
console.log(`  Need to move:              ${toMove.length}`);

if (unknownBrand.length > 0) {
  console.log(`\n⚠️  Unknown brands (add to BRAND_DISPLAY in this script):`);
  for (const b of unknownBrand) console.log(`    ${b}`);
}

if (toMove.length > 0) {
  console.log(`\n── Moves ───────────────────────────────────────────────`);
  for (const job of toMove) {
    console.log(`\n  ${job.code}`);
    console.log(`    from: ${job.oldPath}`);
    console.log(`      to: ${job.newPath}`);
  }
}

if (!apply) {
  console.log("\n(Dry-run — pass --apply to execute moves and update DB)\n");
  process.exit(0);
}

if (toMove.length === 0) {
  console.log("\n✅  All images already at canonical paths — nothing to do.\n");
  process.exit(0);
}

// ─── Execute ──────────────────────────────────────────────────────────────────

console.log("\nMigrating…");
let moved = 0, failed = 0;

for (const job of toMove) {
  process.stdout.write(`  ${job.code}… `);
  try {
    const bytes = await downloadBuffer(job.oldUrl);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { error: upErr } = await (supabase as any).storage
      .from(BUCKET)
      .upload(job.newPath, bytes, { contentType: "image/webp", upsert: true });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (upErr) throw new Error(upErr.message);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { error: dbErr } = await (supabase as any)
      .from("materials")
      .update({ image_url: job.newUrl })
      .eq("technical_code", job.code);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (dbErr) throw new Error(dbErr.message);

    console.log("✓");
    moved++;
  } catch (err) {
    console.log(`❌  ${(err as Error).message}`);
    failed++;
  }
}

console.log(`\n── Done ──────────────────────────────────────────────`);
console.log(`  Moved:  ${moved}`);
console.log(`  Failed: ${failed}`);
if (failed > 0) {
  console.log("  ⚠️  Old files left in place — re-run to retry failures.");
  process.exit(1);
}
console.log("  Old files left in place (delete manually after verifying).\n");
process.exit(0);
