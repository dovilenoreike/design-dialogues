#!/usr/bin/env npx tsx

/**
 * process-material.ts
 *
 * Modes:
 *   (no flags)              Scan src/assets/new-materials/{role}/ — process all images.
 *                           Existing code → UPDATE (image + colour scores).
 *                           New code      → INSERT (texture via Claude Vision, scores via BCGSC).
 *   --image <path>          Process a single image file. Role = parent directory name.
 *   --rescore --code <c>    Re-score one material from its stored image_url (no image change).
 *   --rescore-all           Re-score every material in DB from its stored image_url.
 *
 *   Add --apply to write to DB (default = dry-run, prints SQL only).
 *
 * Env vars required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY  — only needed when inserting new materials (texture classification)
 */

import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// ─── Config ───────────────────────────────────────────────────────────────────

const NEW_MATERIALS_DIR = path.resolve("src/assets/new-materials");
const IMAGE_EXTENSIONS  = [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".bmp"];
const WEBP_QUALITY      = 90;
const NUM_CLUSTERS      = 5;
const ACHROMATIC_CHROMA = 6;
const PATTERN_SCALE     = 2.5; // multiply raw spread before clamping to [0,100]

const SUPABASE_STORAGE_BASE =
  "https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images";
const BUCKET = "material-images";

const VALID_ROLES = ["front", "worktop", "floor", "tile", "wall", "accent"] as const;
type Role = typeof VALID_ROLES[number];

const ROLE_DEFAULT_TYPE: Record<Role, string> = {
  front:   "LMDP",
  worktop: "Compact HPL",
  floor:   "Vinyl",
  tile:    "Tiles",
  wall:    "Laminate",
  accent:  "Metal",
};

const TEXTURE_TYPES = ["wood", "stone", "metal", "plain", "textile", "concrete"] as const;
type Texture = typeof TEXTURE_TYPES[number];

interface BrandConfig {
  displayName: string;
  showroomIds: string[];
  materialTypeOverride?: string;
}

const BRAND_CONFIG: Record<string, BrandConfig> = {
  "kronospan":  { displayName: "Kronospan", showroomIds: ["trukme"] },
  "sm-art":     { displayName: "SM-art",    showroomIds: ["trukme"] },
  "skin":       { displayName: "Skin",      showroomIds: ["trukme"] },
  "egger":      { displayName: "Egger",     showroomIds: ["trukme"] },
  "fab":        { displayName: "Fab",       showroomIds: ["trukme"] },
  "gizir":      { displayName: "Gizir",     showroomIds: ["trukme"] },
  "gentas":     { displayName: "Gentas",    showroomIds: ["trukme"] },
  "icono":      { displayName: "Icono",     showroomIds: ["trukme"] },
  "luxdezine":  { displayName: "Luxdezine", showroomIds: ["trukme"] },
  "aspecta":    { displayName: "Aspecta",   showroomIds: ["solido-grindys"], materialTypeOverride: "Vinyl" },
  "floorest":   { displayName: "Floorest",  showroomIds: ["solido-grindys"], materialTypeOverride: "Vinyl" },
  "coretec":    { displayName: "Coretec",   showroomIds: ["magnus-grindys"], materialTypeOverride: "Vinyl" },
  "coretec-naturals":             { displayName: "Coretec", showroomIds: ["magnus-grindys"], materialTypeOverride: "Vinyl" },
  "coretec-stone-ceratouch-pico": { displayName: "Coretec", showroomIds: ["magnus-grindys"], materialTypeOverride: "Vinyl" },
  "invictus":                     { displayName: "Invictus", showroomIds: ["magnus-grindys"], materialTypeOverride: "Vinyl" },
  "invictus-maximus-highland-oak":{ displayName: "Invictus", showroomIds: ["magnus-grindys"], materialTypeOverride: "Vinyl" },
  "1000grindu": { displayName: "1000Grindu", showroomIds: ["magnus-grindys"], materialTypeOverride: "Vinyl" },
  "parador":    { displayName: "Parador",   showroomIds: ["magnus-grindys"], materialTypeOverride: "Laminate" },
  "w-core":     { displayName: "W-Core",    showroomIds: ["trukme"] },
  "bari":       { displayName: "Bari",      showroomIds: ["trukme"] },
  "borneo":     { displayName: "Borneo",    showroomIds: ["trukme"] },
  "bottega":    { displayName: "Bottega",   showroomIds: ["trukme"] },
  "dune":       { displayName: "Dune",      showroomIds: ["trukme"] },
  "florim":     { displayName: "Florim",    showroomIds: ["trukme"] },
  "fondovalle": { displayName: "Fondovalle",showroomIds: ["trukme"] },
  "midtown":    { displayName: "Midtown",   showroomIds: ["trukme"] },
  "peronda":    { displayName: "Peronda",   showroomIds: ["trukme"] },
  "rondine":    { displayName: "Rondine",   showroomIds: ["trukme"] },
  "vitacer":    { displayName: "Vitacer",   showroomIds: ["trukme"] },
};

// ─── Filename helpers ─────────────────────────────────────────────────────────

function toTechnicalCode(filename: string): string {
  return path.basename(filename, path.extname(filename))
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

function extractBrand(code: string): string {
  const segments = code.split("-");
  const idIdx = segments.findIndex((s) => /\d/.test(s));
  if (idIdx <= 0) return segments[0];
  return segments.slice(0, idIdx).join("-");
}

function extractHumanName(code: string): string {
  const segments = code.split("-");
  const idIdx = segments.findIndex((s) => /\d/.test(s));
  const nameSegs = idIdx >= 0 ? segments.slice(idIdx + 1) : segments.slice(1);
  return nameSegs.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

function canonicalStoragePath(code: string, role: string): string {
  if (role === "accent") return `accent/${code}.webp`;
  const brand = extractBrand(code);
  const cfg = BRAND_CONFIG[brand];
  const display = cfg?.displayName ?? brand.charAt(0).toUpperCase() + brand.slice(1);
  return `${role}/${display}/${code}.webp`;
}

function canonicalUrl(storagePath: string): string {
  return `${SUPABASE_STORAGE_BASE}/${storagePath}`;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRad(d: number): number { return d * Math.PI / 180; }

async function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadBuffer(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
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

// ─── BCGSC colour scoring ─────────────────────────────────────────────────────

interface ColourScores {
  lightness: number;
  warmth:    number;
  chroma:    number;
  hue_angle: number | null;
  pattern:   number;
}

async function scoreUrl(imageUrl: string): Promise<ColourScores> {
  const params = new URLSearchParams({
    url:          imageUrl,
    json:         "1",
    num_clusters: String(NUM_CLUSTERS),
    precision:    "medium",
  });
  const buf  = await downloadBuffer(`https://mk.bcgsc.ca/color-summarizer/?${params}`);
  const text = buf.toString("utf8");
  let data: { clusters: Record<string, { hsv: [string,string,string]; lch: [string,string,string]; f: number }> };
  try { data = JSON.parse(text); }
  catch { throw new Error(`BCGSC returned non-JSON: ${text.slice(0, 200)}`); }
  if (!data.clusters) throw new Error("No clusters in BCGSC response");

  const clusters = Object.values(data.clusters).map((raw) => {
    const H = parseFloat(raw.hsv[0]);
    const C = parseFloat(raw.hsv[1]);
    const L = parseFloat(raw.lch[0]);
    return { L, C, H, bStar: Math.cos(toRad(H - 30)) * (C / 100), f: raw.f };
  }).sort((a, b) => b.f - a.f);

  const total    = clusters.reduce((s, c) => s + c.f, 0) || 1;
  const lightness = clusters.reduce((s, c) => s + c.L * c.f, 0) / total;
  const chroma    = clamp(clusters.reduce((s, c) => s + c.C * c.f, 0) / total, 0, 100);
  const warmth    = clamp(clusters.reduce((s, c) => s + c.bStar * c.f, 0) / total, -1, 1);
  const dominant  = clusters.reduce((best, c) => c.f > best.f ? c : best, clusters[0]);
  const hue_angle = dominant.C >= ACHROMATIC_CHROMA ? Math.round(dominant.H * 10) / 10 : null;

  const Ls = clusters.map(c => c.L);
  const Ss = clusters.map(c => c.C);
  const spreadL = Math.max(...Ls) - Math.min(...Ls);
  const avgS    = Ss.reduce((s, v) => s + v, 0) / Ss.length;
  const spreadS = (Math.max(...Ss) - Math.min(...Ss)) * Math.min(1, avgS / 25);
  const pattern = clamp(Math.max(spreadL, spreadS) * PATTERN_SCALE, 0, 100);

  return {
    lightness: Math.round(lightness),
    warmth:    Math.round(warmth * 100) / 100,
    chroma:    Math.round(chroma),
    hue_angle: hue_angle !== null ? Math.round(hue_angle) : null,
    pattern:   Math.round(pattern),
  };
}

// ─── Claude Vision — texture + texture_prompt (INSERT only) ───────────────────

interface TextureResult { texture: Texture; texture_prompt: string; }

async function classifyTexture(imagePath: string, anthropic: Anthropic): Promise<TextureResult> {
  const imageData = fs.readFileSync(imagePath);
  const base64    = imageData.toString("base64");
  const ext       = path.extname(imagePath).slice(1).toLowerCase();
  const mediaType = ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";

  const res = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 60,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType as "image/webp" | "image/jpeg" | "image/png", data: base64 } },
        { type: "text", text:
          'What is the primary surface texture of this material sample? Reply with JSON only:\n' +
          '{ "texture": "<one of: wood stone metal textile concrete plain>", "texture_prompt": "<max 8 words: colour + surface character>" }\n' +
          'Use "textile" for fabric/woven, "concrete" for cement-look, "plain" for painted/lacquered smooth surfaces.'
        },
      ],
    }],
  });

  const raw   = (res.content[0] as { text: string }).text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Could not parse texture JSON: ${raw}`);
  const parsed = JSON.parse(match[0]);
  const texture = TEXTURE_TYPES.includes(parsed.texture) ? parsed.texture as Texture : "plain";
  return { texture, texture_prompt: String(parsed.texture_prompt ?? texture).slice(0, 80) };
}

// ─── Upload helper ────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
async function uploadWebp(supabase: any, webpBuffer: Buffer, storagePath: string): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, webpBuffer, { contentType: "image/webp", upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return canonicalUrl(storagePath);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── SQL builders ─────────────────────────────────────────────────────────────

function sqlUpdate(code: string, scores: ColourScores, newImageUrl?: string): string {
  const sets = [
    newImageUrl ? `  image_url = '${newImageUrl}'` : null,
    `  lightness = ${scores.lightness}`,
    `  warmth = ${scores.warmth}`,
    `  chroma = ${scores.chroma}`,
    `  hue_angle = ${scores.hue_angle ?? "NULL"}`,
    `  pattern = ${scores.pattern}`,
    `  cluster_id = NULL`,
    `  synonym_id = NULL`,
  ].filter(Boolean);
  return `UPDATE materials SET\n${sets.join(",\n")}\nWHERE technical_code = '${code}';`;
}

function sqlInsert(
  code: string,
  role: Role,
  scores: ColourScores,
  texture: Texture,
  texture_prompt: string,
  imageUrl: string,
  showroomIds: string[],
  materialType: string,
): string {
  const nameEn    = extractHumanName(code) || code;
  const showrooms = showroomIds.length
    ? `'{${showroomIds.join(",")}}'`
    : `'{}'`;
  const hue       = scores.hue_angle ?? "NULL";
  return [
    `INSERT INTO materials (`,
    `  id, technical_code, name, role, texture,`,
    `  lightness, warmth, chroma, hue_angle, pattern,`,
    `  texture_prompt, image_url, showroom_ids, material_type, tier`,
    `) VALUES (`,
    `  '${randomUUID()}',`,
    `  '${code}',`,
    `  '{"en": "${nameEn}", "lt": "${nameEn}"}',   -- ⚠ review lt translation`,
    `  '{${role}}',`,
    `  '${texture}',`,
    `  ${scores.lightness}, ${scores.warmth}, ${scores.chroma}, ${hue}, ${scores.pattern},`,
    `  '${texture_prompt}',`,
    `  '${imageUrl}',`,
    `  ${showrooms},`,
    `  '${materialType}',`,
    `  'optimal'`,
    `);`,
  ].join("\n");
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const apply      = args.includes("--apply");
const rescoreAll = args.includes("--rescore-all");
const rescore    = args.includes("--rescore") && !rescoreAll;

const imageIdx   = args.indexOf("--image");
const imageArg   = imageIdx >= 0 ? args[imageIdx + 1] : undefined;
const codeIdx    = args.indexOf("--code");
const codeArg    = codeIdx >= 0 ? args[codeIdx + 1] : undefined;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const supabase = createClient(supabaseUrl, supabaseKey);
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function fetchExistingCodes(): Promise<Map<string, string>> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data, error } = await (supabase as any)
    .from("materials").select("technical_code, role");
  /* eslint-enable @typescript-eslint/no-explicit-any */
  if (error) throw new Error(`DB fetch failed: ${error.message}`);
  // Map technical_code → role[0]
  return new Map((data as { technical_code: string; role: string[] }[]).map(r => [r.technical_code, r.role[0]]));
}

async function fetchAllWithUrl(): Promise<{ technical_code: string; image_url: string }[]> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data, error } = await (supabase as any)
    .from("materials")
    .select("technical_code, image_url")
    .not("image_url", "is", null)
    .order("technical_code");
  /* eslint-enable @typescript-eslint/no-explicit-any */
  if (error) throw new Error(`DB fetch failed: ${error.message}`);
  return data;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function applyUpdate(code: string, scores: ColourScores, newImageUrl?: string): Promise<void> {
  const patch: Record<string, unknown> = {
    lightness: scores.lightness, warmth: scores.warmth, chroma: scores.chroma,
    hue_angle: scores.hue_angle, pattern: scores.pattern,
    cluster_id: null, synonym_id: null,
  };
  if (newImageUrl) patch.image_url = newImageUrl;
  const { error } = await (supabase as any).from("materials").update(patch).eq("technical_code", code);
  if (error) throw new Error(error.message);
}

async function applyInsert(sql: string): Promise<void> {
  const { error } = await (supabase as any).rpc("exec_sql", { sql });
  if (error) throw new Error(error.message);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Core: process one image file ────────────────────────────────────────────

interface ProcessResult {
  code: string;
  action: "update" | "insert";
  sql: string;
}

async function processImageFile(
  imagePath: string,
  role: Role,
  existingCodes: Map<string, string>,
  anthropic: Anthropic | null,
): Promise<ProcessResult> {
  const code    = toTechnicalCode(path.basename(imagePath));
  const isNew   = !existingCodes.has(code);
  const action  = isNew ? "insert" : "update";

  const storagePath = canonicalStoragePath(code, role);
  const publicUrl   = canonicalUrl(storagePath);

  // Upload original bytes first (JPEG/PNG) so BCGSC can score from the public URL
  const ext      = path.extname(imagePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
  const origBytes = fs.readFileSync(imagePath);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { error: upOrig } = await (supabase as any).storage
    .from(BUCKET).upload(storagePath, origBytes, { contentType: mimeType, upsert: true });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  if (upOrig) throw new Error(`Upload (original) failed: ${upOrig.message}`);

  // Colour scores via BCGSC (sees JPEG/PNG — WebP is not accepted by BCGSC)
  const scores = await scoreUrl(publicUrl);

  // Overwrite with WebP for storage efficiency
  const webpBuffer = await sharp(imagePath).webp({ quality: WEBP_QUALITY }).toBuffer();
  await uploadWebp(supabase, webpBuffer, storagePath);

  if (action === "update") {
    return { code, action, sql: sqlUpdate(code, scores, publicUrl) };
  }

  // New material: classify texture via Claude Vision
  if (!anthropic) throw new Error(`ANTHROPIC_API_KEY required for new material: ${code}`);
  const { texture, texture_prompt } = await classifyTexture(imagePath, anthropic);

  const brand        = extractBrand(code);
  const brandCfg     = BRAND_CONFIG[brand];
  if (!brandCfg) console.warn(`    ⚠  Unknown brand "${brand}" — add to BRAND_CONFIG. showroom_ids will be empty.`);
  const showroomIds  = brandCfg?.showroomIds ?? [];
  const materialType = brandCfg?.materialTypeOverride ?? ROLE_DEFAULT_TYPE[role];

  const sql = sqlInsert(code, role, scores, texture, texture_prompt, publicUrl, showroomIds, materialType);
  return { code, action, sql };
}

// ─── Score a stored image (handles WebP by converting to JPEG for BCGSC) ─────

/* eslint-disable @typescript-eslint/no-explicit-any */
async function scoreStoredImage(code: string, imageUrl: string): Promise<ColourScores> {
  const bytes     = await downloadBuffer(imageUrl);
  const jpegBytes = await sharp(bytes).jpeg({ quality: 95 }).toBuffer();
  const tempPath  = `temp/${code}.jpg`;
  const { error } = await (supabase as any).storage
    .from(BUCKET).upload(tempPath, jpegBytes, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`Temp upload failed: ${error.message}`);
  return scoreUrl(canonicalUrl(tempPath));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Mode: rescore ────────────────────────────────────────────────────────────

if (rescore || rescoreAll) {
  if (rescore && !codeArg) {
    console.error("❌  --rescore requires --code <technical_code>");
    process.exit(1);
  }

  const rows = await fetchAllWithUrl();
  const targets = rescore ? rows.filter(r => r.technical_code === codeArg) : rows;

  if (targets.length === 0) {
    console.error(`❌  No material found${codeArg ? ` for code: ${codeArg}` : " with image_url"}`);
    process.exit(1);
  }

  const label = rescoreAll ? `${targets.length} materials` : codeArg!;
  console.log(`\n── Rescore: ${label} ───────────────────────────────`);
  if (!apply) console.log("(Dry-run — add --apply to write to DB)\n");

  const sqls: string[] = [];
  let ok = 0, failed = 0;

  for (const row of targets) {
    process.stdout.write(`  ${row.technical_code.padEnd(45)}`);
    try {
      const scores = await scoreStoredImage(row.technical_code, row.image_url);
      const sql = sqlUpdate(row.technical_code, scores);
      sqls.push(`-- ${row.technical_code}\n${sql}`);
      process.stdout.write(`L${scores.lightness} W${scores.warmth} C${scores.chroma} H${scores.hue_angle ?? "—"} P${scores.pattern}\n`);
      if (apply) await applyUpdate(row.technical_code, scores);
      ok++;
    } catch (err) {
      console.log(`❌  ${(err as Error).message}`);
      failed++;
    }
  }

  if (!apply && sqls.length > 0) {
    console.log(`\n── SQL ─────────────────────────────────────────────\n`);
    console.log(sqls.join("\n\n"));
  }

  console.log(`\n── Done: ${ok} scored${failed ? `, ${failed} failed` : ""}${apply ? " — DB updated." : " (dry-run)."} ──`);
  if (apply && ok > 0) console.log("  Next: run cluster-materials.ts --clusters --apply\n");
  process.exit(failed > 0 ? 1 : 0);
}

// ─── Mode: process images (directory scan or single file) ────────────────────

// Fetch existing codes once (needed to resolve role for update/ dir + classify inserts vs updates)
const existingCodes = await fetchExistingCodes();

// Collect image files to process
const imageFiles: { imagePath: string; role: Role }[] = [];

if (imageArg) {
  // Single file — role from parent dir OR fetched from DB if parent is "update"
  const absPath = path.resolve(imageArg);
  if (!fs.existsSync(absPath)) { console.error(`❌  File not found: ${absPath}`); process.exit(1); }
  const dirName = path.basename(path.dirname(absPath));
  let roleFromDir: Role;
  if (dirName === "update") {
    const code = toTechnicalCode(path.basename(absPath));
    const dbRole = existingCodes.get(code);
    if (!dbRole) { console.error(`❌  ${code} not found in DB — cannot infer role from update/ dir.`); process.exit(1); }
    roleFromDir = dbRole as Role;
  } else if (VALID_ROLES.includes(dirName as Role)) {
    roleFromDir = dirName as Role;
  } else {
    console.error(`❌  Parent directory must be a role (${VALID_ROLES.join(", ")}) or "update". Got: ${dirName}`);
    process.exit(1);
  }
  imageFiles.push({ imagePath: absPath, role: roleFromDir });
} else {
  // Scan new-materials directory
  if (!fs.existsSync(NEW_MATERIALS_DIR)) {
    console.error(`❌  Directory not found: ${NEW_MATERIALS_DIR}`);
    process.exit(1);
  }

  // update/ dir — role inferred from DB, all treated as UPDATEs
  const updateDir = path.join(NEW_MATERIALS_DIR, "update");
  if (fs.existsSync(updateDir)) {
    for (const f of fs.readdirSync(updateDir)) {
      if (!IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase())) continue;
      const code   = toTechnicalCode(f);
      const dbRole = existingCodes.get(code);
      if (!dbRole) { console.warn(`  ⚠  ${code} not in DB — skipping (move to {role}/ dir for INSERT)`); continue; }
      imageFiles.push({ imagePath: path.join(updateDir, f), role: dbRole as Role });
    }
  }

  // {role}/ dirs — new inserts (or updates if code already exists)
  for (const role of VALID_ROLES) {
    const roleDir = path.join(NEW_MATERIALS_DIR, role);
    if (!fs.existsSync(roleDir)) continue;
    const files = fs.readdirSync(roleDir)
      .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map(f => ({ imagePath: path.join(roleDir, f), role }));
    imageFiles.push(...files);
  }
}

if (imageFiles.length === 0) {
  console.log("No image files found.");
  console.log("  • For updates:  src/assets/new-materials/update/{technical_code}.jpg");
  console.log(`  • For inserts:  src/assets/new-materials/{role}/{technical_code}.jpg  (role: ${VALID_ROLES.join(", ")})`);
  process.exit(0);
}

// Initialise Anthropic if needed (for inserts)
const hasNew     = imageFiles.some(f => !existingCodes.has(toTechnicalCode(path.basename(f.imagePath))));
const anthropic  = hasNew && process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : hasNew
  ? (console.warn("⚠  ANTHROPIC_API_KEY not set — new materials will be skipped"), null)
  : null;

const updates = imageFiles.filter(f =>  existingCodes.has(toTechnicalCode(path.basename(f.imagePath))));
const inserts = imageFiles.filter(f => !existingCodes.has(toTechnicalCode(path.basename(f.imagePath))));

console.log(`\n── Process materials ───────────────────────────────────`);
console.log(`  Updates (existing): ${updates.length}`);
console.log(`  Inserts (new):      ${inserts.length}`);
if (!apply) console.log("  (Dry-run — add --apply to write to DB)\n");

const allSql: string[] = [];
let ok = 0, failed = 0;

for (const { imagePath, role } of imageFiles) {
  const code   = toTechnicalCode(path.basename(imagePath));
  const isNew  = !existingCodes.has(code);
  const prefix = isNew ? "[INSERT]" : "[UPDATE]";
  process.stdout.write(`  ${prefix} ${code}… `);

  try {
    const result = await processImageFile(imagePath, role, existingCodes, anthropic);
    allSql.push(`-- ${result.action.toUpperCase()}: ${result.code}\n${result.sql}`);

    const scores = result.sql.match(/lightness = ([\d.]+)/)?.[1] ?? "?";
    process.stdout.write(`done (L${scores})\n`);

    if (apply) {
      if (result.action === "update") {
        // Re-run to get scores object for applyUpdate (sql already contains them)
        // Extract from SQL for now — simpler than threading the object through
        const m = result.sql.match(
          /lightness = ([\d.]+).*?warmth = ([\d.-]+).*?chroma = ([\d.]+).*?hue_angle = ([\d.]+|NULL).*?pattern = (\d+)/s
        );
        if (m) {
          await applyUpdate(result.code, {
            lightness: parseFloat(m[1]),
            warmth:    parseFloat(m[2]),
            chroma:    parseFloat(m[3]),
            hue_angle: m[4] === "NULL" ? null : parseFloat(m[4]),
            pattern:   parseInt(m[5]),
          }, result.sql.match(/image_url = '([^']+)'/)?.[1]);
        }
      }
      // INSERTs: output SQL only — user reviews lt name, tier, layout_pattern before running
    }
    ok++;
  } catch (err) {
    console.log(`❌  ${(err as Error).message}`);
    failed++;
  }
}

console.log(`\n── SQL ─────────────────────────────────────────────────\n`);
console.log(allSql.join("\n\n"));

if (inserts.length > 0) {
  console.log(`\n⚠  ${inserts.length} INSERT(s) above — review before running:`);
  console.log(`   • Confirm 'lt' translation for each material name`);
  console.log(`   • Set layout_pattern if needed (plank, chevron, herringbone, etc.)`);
  console.log(`   • Adjust tier if not 'optimal'`);
}

console.log(`\n── Done: ${ok} processed${failed ? `, ${failed} failed` : ""}. ──`);
if (apply && ok > 0) {
  console.log("  UPDATE rows written to DB.");
  console.log("  Run INSERT SQL manually after review.");
  console.log("  Then: cluster-materials.ts --clusters --apply\n");
} else {
  console.log("  Add --apply to upload images + write UPDATEs to DB.\n");
}
process.exit(failed > 0 ? 1 : 0);
