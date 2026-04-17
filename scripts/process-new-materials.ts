#!/usr/bin/env npx tsx

/**
 * process-new-materials.ts
 *
 * Processes new material images in src/assets/new-materials/{role}/ subfolders:
 *   1. Converts images to webp in-place (using sharp)
 *   2. Classifies texture and scores visual attributes via Claude Vision
 *   3. Generates SQL INSERT statements → supabase/seed/new_materials_draft.sql
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/process-new-materials.ts
 *
 * Folder structure:
 *   src/assets/new-materials/
 *     front/    brand-id-name.jpg   ← role = front
 *     worktop/  brand-id-name.jpg   ← role = worktop
 *     floor/    ...
 *
 * Filename = technical code basis. Underscores/spaces are normalised to hyphens,
 * everything is lowercased. Example:
 *   SM_art_RE02_Meriggio_Reverso.jpg → technical_code: sm-art-re02-meriggio-reverso
 *                                      name: Meriggio Reverso
 *
 * Add new brands to BRAND_CONFIG below. materialTypeOverride is only needed for
 * exceptions (e.g. a brand that makes MDF fronts instead of LMDP).
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ============================================================================
// Configuration — edit these as your brand list grows
// ============================================================================

const SUPABASE_STORAGE_BASE =
  "https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images";

const VALID_ROLES = ["front", "worktop", "floor", "tile", "wall", "accent"] as const;
type Role = (typeof VALID_ROLES)[number];

/** Default material_type per role. Overridden per-brand when needed. */
const ROLE_DEFAULT_TYPE: Record<Role, string> = {
  front: "LMDP",
  worktop: "Compact HPL",
  floor: "Vinyl",
  tile: "Tiles",
  wall: "Laminate",
  accent: "Metal",
};

interface BrandConfig {
  /** Supabase Storage folder name (case-sensitive, matches existing uploads). */
  displayName: string;
  showroomIds: string[];
  /** Set only if this brand uses a non-default material_type for all roles. */
  materialTypeOverride?: string;
}

const BRAND_CONFIG: Record<string, BrandConfig> = {
  "kronospan": { displayName: "Kronospan", showroomIds: ["trukme"] },
  "gentas":    { displayName: "Gentas",    showroomIds: ["trukme"] },
  "sm-art":    { displayName: "SM-art",    showroomIds: ["trukme"] },
  "skin":      { displayName: "Skin",      showroomIds: ["trukme"] },
  "egger":     { displayName: "Egger",     showroomIds: ["trukme"] },
  "fab":       { displayName: "Fab",       showroomIds: ["trukme"] },
  "gizir":     { displayName: "Gizir",     showroomIds: ["trukme"] },
  "aspecta":     { displayName: "Aspecta",     showroomIds: ["solido-grindys"] },
  "floorest":     { displayName: "Floorest",     showroomIds: ["solido-grindys"] },
  "coretec":     { displayName: "Coretec",     showroomIds: ["magnus-grindys"] },
  "1000grindu":     { displayName: "1000Grindu",     showroomIds: ["magnus-grindys"] },
};

const TEXTURE_TYPES = ["wood", "stone", "metal", "plain", "textile", "concrete"] as const;
type Texture = (typeof TEXTURE_TYPES)[number];

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".bmp"];

// ============================================================================
// Filename → technical_code + name
// ============================================================================

/**
 * Normalise a filename to a technical_code:
 *   underscores/spaces → hyphens, lowercase, strip extension.
 *   "SM_art_RE02_Meriggio_Reverso.jpg" → "sm-art-re02-meriggio-reverso"
 */
function toTechnicalCode(filename: string): string {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Extract brand prefix: all segments before the first one containing a digit.
 *   "kronospan-k352-iron-flow"      → "kronospan"
 *   "sm-art-re02-meriggio-reverso"  → "sm-art"
 *   "gentas-5700-italian-stone"     → "gentas"
 */
function extractBrand(code: string): string {
  const segments = code.split("-");
  const idIdx = segments.findIndex((s) => /\d/.test(s));
  if (idIdx <= 0) return segments[0];
  return segments.slice(0, idIdx).join("-");
}

/**
 * Extract human name: segments after the brand+id, title-cased.
 *   "kronospan-k352-iron-flow"      → "Iron Flow"
 *   "sm-art-re02-meriggio-reverso"  → "Meriggio Reverso"
 */
function extractName(code: string): string {
  const segments = code.split("-");
  const idIdx = segments.findIndex((s) => /\d/.test(s));
  const nameSegs = idIdx >= 0 ? segments.slice(idIdx + 1) : segments.slice(1);
  return nameSegs.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

// ============================================================================
// Image conversion
// ============================================================================

async function ensureWebp(inputPath: string): Promise<string> {
  if (path.extname(inputPath).toLowerCase() === ".webp") return inputPath;
  const outputPath = inputPath.replace(/\.[^.]+$/, ".webp");
  await sharp(inputPath).webp({ quality: 90 }).toFile(outputPath);
  console.log(`    → converted to ${path.basename(outputPath)}`);
  return outputPath;
}

// ============================================================================
// Claude Vision analysis
// ============================================================================

interface Scores {
  texture: Texture;
  lightness: number;
  warmth: number;
  pattern: number;
  chroma: number;
  hue_angle: number | null;
  texture_prompt: string;
}

function mediaTypeFor(ext: string): "image/webp" | "image/jpeg" | "image/png" {
  if (ext === "webp") return "image/webp";
  if (ext === "png") return "image/png";
  return "image/jpeg";
}

async function analyzeImage(client: Anthropic, imagePath: string): Promise<Scores> {
  const imageData = await fs.readFile(imagePath);
  const base64 = imageData.toString("base64");
  const mediaType = mediaTypeFor(path.extname(imagePath).slice(1).toLowerCase());

  // ── Call 1: texture classification ──────────────────────────────────────────
  const textureRes = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 10,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          {
            type: "text",
            text: 'What is the primary surface texture of this material sample? Reply with exactly one word from: wood, stone, metal, textile, concrete, plain. Use "textile" for fabric/woven/upholstery surfaces. Use "concrete" for concrete-look or cement surfaces. Use "plain" for painted, lacquered, or any other smooth solid surface.',
          },
        ],
      },
    ],
  });

  const textureRaw = (textureRes.content[0] as { text: string }).text.trim().toLowerCase();
  const texture: Texture = TEXTURE_TYPES.includes(textureRaw as Texture)
    ? (textureRaw as Texture)
    : "plain";

  // ── Call 2: visual scoring ───────────────────────────────────────────────────
  const scoringRes = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          {
            type: "text",
            text: `This is a ${texture} surface material. Score it on a consistent absolute scale — scores must be directly comparable across all texture types for AI material matching.

lightness: 0 (black) → 100 (white)

warmth: -1 (cool/blue-grey) → 1 (warm/amber-orange). Same meaning regardless of texture.
  Reference points: pure white ≈ 0.0, cream/off-white ≈ 0.1, honey oak ≈ 0.4,
  grey-washed oak ≈ -0.1, warm beige stone ≈ 0.15, cool grey stone ≈ -0.2,
  brushed steel ≈ -0.05, warm bronze ≈ 0.3, warm beige textile ≈ 0.2, cool concrete ≈ -0.15

pattern: 0 (perfectly solid, no grain or markings) → 100 (dominant pattern fills the surface).
  Reference: solid plain = 0, subtle wood grain = 10–20, clear oak grain = 25–35,
  fine woven textile = 10–20, visible weave pattern = 30–50,
  marble veining = 50–80, bold graphic stone = 80+

chroma: 0 (achromatic — pure grey/white/black) → 100 (vivid saturated colour).
  Reference: natural wood = 5–15, stone = 2–8, textile = 2–30, concrete = 1–5,
  most fronts = 2–20, bold colour = 50+

hue_angle: dominant hue in degrees (0–360), or null if achromatic (chroma ≤ 5).
  0=red, 30=orange, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta.
  Reference: most woods 25–40°, warm beige stone ~35°, cool grey stone null,
  metals null, coloured fronts wherever the dominant hue sits.

texture_prompt: max 8 words — colour + surface character + finish.
  Example: "Dark charcoal brushed metal, matte finish."
  Keep it short so image-generation AI focuses on the uploaded photo, not the text.

Return JSON only, no explanation:
{ "lightness": number, "warmth": number, "pattern": number, "chroma": number, "hue_angle": number | null, "texture_prompt": string }`,
          },
        ],
      },
    ],
  });

  const raw = (scoringRes.content[0] as { text: string }).text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Could not parse scoring JSON:\n${raw}`);
  const parsed = JSON.parse(match[0]);

  return {
    texture,
    lightness: Math.round(clamp(parsed.lightness, 0, 100)),
    warmth: round2(clamp(parsed.warmth, -1, 1)),
    pattern: Math.round(clamp(parsed.pattern, 0, 100)),
    chroma: Math.round(clamp(parsed.chroma, 0, 100)),
    hue_angle: parsed.hue_angle != null ? round2(clamp(parsed.hue_angle, 0, 359.9)) : null,
    texture_prompt: String(parsed.texture_prompt ?? "").slice(0, 80),
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(v) || 0));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ============================================================================
// SQL generation
// ============================================================================

interface MaterialEntry {
  technicalCode: string;
  nameEn: string;
  nameLt: string;
  role: Role;
  brandDisplayName: string;
  materialType: string;
  showroomIds: string[];
  imageUrl: string;
  scores: Scores;
}

interface UpdateEntry {
  technicalCode: string;
  imageUrl: string;
  scores: Scores;
}

function buildInsertSQL(entries: MaterialEntry[]): string {
  const lines: string[] = [
    `-- ════════════════════════════════════════════════════════════════════════════`,
    `-- NEW MATERIALS`,
    `-- Review scores, adjust name.lt translations if needed.`,
    `-- Column order: id, technical_code, name, role, texture,`,
    `--   lightness, warmth, pattern, texture_prompt, image_url, showroom_ids,`,
    `--   material_type, tier, chroma, hue_angle`,
    `-- ════════════════════════════════════════════════════════════════════════════`,
    ``,
    `INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma, hue_angle) VALUES`,
    ``,
  ];

  entries.forEach((e, i) => {
    const isLast = i === entries.length - 1;
    const nameJson = JSON.stringify({ en: e.nameEn, lt: e.nameLt });
    const showroomArr = `ARRAY[${e.showroomIds.map((s) => `'${s}'`).join(", ")}]`;

    lines.push(`-- ── ${e.brandDisplayName} / ${e.role} ──────────────────────────────────────────────`);
    lines.push(`(gen_random_uuid(), '${e.technicalCode}',`);
    lines.push(` '${nameJson}',`);
    lines.push(` ARRAY['${e.role}'], '${e.scores.texture}', ${e.scores.lightness}, ${e.scores.warmth}, ${e.scores.pattern},`);
    lines.push(` '${e.scores.texture_prompt}',`);
    lines.push(` '${e.imageUrl}',`);
    lines.push(` ${showroomArr}, '${e.materialType}', 'optimal',`);
    lines.push(` ${e.scores.chroma}, ${e.scores.hue_angle ?? "NULL"})${isLast ? ";" : ","}`);
    lines.push(``);
  });

  return lines.join("\n");
}

function buildUpdateSQL(updates: UpdateEntry[]): string {
  const lines: string[] = [
    `-- ════════════════════════════════════════════════════════════════════════════`,
    `-- RESCORED MATERIALS (update/)`,
    `-- Only scores and image_url are changed. name/role/tier/material_type untouched.`,
    `-- ════════════════════════════════════════════════════════════════════════════`,
    ``,
  ];

  for (const u of updates) {
    lines.push(`-- ── ${u.technicalCode} ──────────────────────────────────────────────`);
    lines.push(`UPDATE materials SET`);
    lines.push(`  texture        = '${u.scores.texture}',`);
    lines.push(`  lightness      = ${u.scores.lightness},`);
    lines.push(`  warmth         = ${u.scores.warmth},`);
    lines.push(`  pattern        = ${u.scores.pattern},`);
    lines.push(`  chroma         = ${u.scores.chroma},`);
    lines.push(`  hue_angle      = ${u.scores.hue_angle ?? "NULL"},`);
    lines.push(`  texture_prompt = '${u.scores.texture_prompt}',`);
    lines.push(`  image_url      = '${u.imageUrl}'`);
    lines.push(`WHERE technical_code = '${u.technicalCode}';`);
    lines.push(``);
  }

  return lines.join("\n");
}

function buildSQL(entries: MaterialEntry[], updates: UpdateEntry[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const parts: string[] = [
    `-- Draft generated ${today} by scripts/process-new-materials.ts`,
    ``,
  ];
  if (entries.length > 0) parts.push(buildInsertSQL(entries));
  if (updates.length > 0) parts.push(buildUpdateSQL(updates));
  return parts.join("\n");
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const inputDir = path.resolve(PROJECT_ROOT, "src", "assets", "new-materials");
  const outputPath = path.resolve(PROJECT_ROOT, "supabase", "seed", "new_materials_draft.sql");

  // Discover role subfolders
  let dirEntries: { name: string; isDirectory(): boolean }[];
  try {
    dirEntries = await fs.readdir(inputDir, { withFileTypes: true }) as unknown as { name: string; isDirectory(): boolean }[];
  } catch {
    console.error(`Directory not found: ${inputDir}`);
    console.error(`Create it and add subfolders: front/, worktop/, floor/, etc.`);
    process.exit(1);
  }

  const roleDirs = dirEntries
    .filter((e) => e.isDirectory() && (VALID_ROLES as readonly string[]).includes(e.name))
    .map((e) => e.name as Role);

  const hasUpdateDir = dirEntries.some((e) => e.isDirectory() && e.name === "update");

  if (roleDirs.length === 0 && !hasUpdateDir) {
    console.log("No valid subfolders found inside src/assets/new-materials/");
    console.log(`Role folders: ${VALID_ROLES.join(", ")}`);
    console.log(`Update folder: update/`);
    return;
  }

  const entries: MaterialEntry[] = [];
  const updates: UpdateEntry[] = [];
  const skipped: string[] = [];

  for (const role of roleDirs) {
    const rolePath = path.join(inputDir, role);
    const files = (await fs.readdir(rolePath)).filter((f) =>
      IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase())
    );

    if (files.length === 0) continue;

    console.log(`\n── ${role}/ (${files.length} image${files.length > 1 ? "s" : ""}) ──`);

    for (const filename of files) {
      const filePath = path.join(rolePath, filename);
      console.log(`\n  ${filename}`);

      const technicalCode = toTechnicalCode(filename);
      const brand = extractBrand(technicalCode);
      const nameEn = extractName(technicalCode);

      console.log(`    code: ${technicalCode}`);
      console.log(`    brand: ${brand}  name: ${nameEn}`);

      const brandCfg = BRAND_CONFIG[brand];
      if (!brandCfg) {
        console.warn(`    ⚠  Unknown brand "${brand}". Add it to BRAND_CONFIG in the script.`);
        skipped.push(filename);
        continue;
      }

      // Convert to webp
      const webpPath = await ensureWebp(filePath);
      const webpFilename = path.basename(webpPath);

      const materialType = brandCfg.materialTypeOverride ?? ROLE_DEFAULT_TYPE[role];
      const imageUrl = `${SUPABASE_STORAGE_BASE}/${brandCfg.displayName}/${webpFilename}`;

      // Analyse with Claude
      console.log(`    Scoring with Claude Vision…`);
      let scores: Scores;
      try {
        scores = await analyzeImage(client, webpPath);
      } catch (err) {
        console.error(`    ✗ Failed to analyse ${filename}:`, err);
        skipped.push(filename);
        continue;
      }

      console.log(
        `    texture=${scores.texture}  lightness=${scores.lightness}  warmth=${scores.warmth}  pattern=${scores.pattern}  chroma=${scores.chroma}`
      );
      console.log(`    prompt: "${scores.texture_prompt}"`);

      entries.push({
        technicalCode,
        nameEn,
        nameLt: nameEn,
        role,
        brandDisplayName: brandCfg.displayName,
        materialType,
        showroomIds: brandCfg.showroomIds,
        imageUrl,
        scores,
      });
    }
  }

  // ── Process update/ folder ────────────────────────────────────────────────
  if (hasUpdateDir) {
    const updatePath = path.join(inputDir, "update");
    const files = (await fs.readdir(updatePath)).filter((f) =>
      IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase())
    );

    if (files.length > 0) {
      console.log(`\n── update/ (${files.length} image${files.length > 1 ? "s" : ""}) ──`);

      for (const filename of files) {
        const filePath = path.join(updatePath, filename);
        console.log(`\n  ${filename}`);

        const technicalCode = toTechnicalCode(filename);
        const brand = extractBrand(technicalCode);
        console.log(`    code: ${technicalCode}`);

        const brandCfg = BRAND_CONFIG[brand];
        if (!brandCfg) {
          console.warn(`    ⚠  Unknown brand "${brand}". Add it to BRAND_CONFIG in the script.`);
          skipped.push(filename);
          continue;
        }

        const webpPath = await ensureWebp(filePath);
        const webpFilename = path.basename(webpPath);
        const imageUrl = `${SUPABASE_STORAGE_BASE}/${brandCfg.displayName}/${webpFilename}`;

        console.log(`    Scoring with Claude Vision…`);
        let scores: Scores;
        try {
          scores = await analyzeImage(client, webpPath);
        } catch (err) {
          console.error(`    ✗ Failed to analyse ${filename}:`, err);
          skipped.push(filename);
          continue;
        }

        console.log(
          `    texture=${scores.texture}  lightness=${scores.lightness}  warmth=${scores.warmth}  pattern=${scores.pattern}  chroma=${scores.chroma}`
        );
        console.log(`    prompt: "${scores.texture_prompt}"`);

        updates.push({ technicalCode, imageUrl, scores });
      }
    }
  }

  if (entries.length === 0 && updates.length === 0) {
    console.log("\nNo images were processed.");
    if (skipped.length > 0) console.log(`Skipped: ${skipped.join(", ")}`);
    return;
  }

  await fs.writeFile(outputPath, buildSQL(entries, updates), "utf-8");

  const summary: string[] = [];
  if (entries.length > 0) summary.push(`${entries.length} new`);
  if (updates.length > 0) summary.push(`${updates.length} updated`);
  console.log(`\n✓ ${summary.join(", ")} material${entries.length + updates.length > 1 ? "s" : ""} written to:`);
  console.log(`  ${outputPath}`);
  if (skipped.length > 0) {
    console.log(`\n⚠  Skipped (${skipped.length}): ${skipped.join(", ")}`);
  }
  console.log(`\nNext steps:`);
  console.log(`  1. Review scores in the draft SQL`);
  if (entries.length > 0) console.log(`  2. Adjust name.lt if Lithuanian differs from English`);
  console.log(`  3. Upload webp images to Supabase Storage`);
  console.log(`  4. Run the SQL against your database`);
  if (entries.length > 0) console.log(`  5. Rename new_materials_draft.sql to new_materials_2026_d.sql (or next letter)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
