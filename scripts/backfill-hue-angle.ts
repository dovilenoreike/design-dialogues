#!/usr/bin/env npx tsx
/**
 * backfill-hue-angle.ts
 *
 * Fetches all materials with null hue_angle from Supabase,
 * converts each WebP to JPEG (via sharp), uploads a temp JPEG to Supabase storage,
 * scores via BCGSC, then deletes the temp file.
 * Outputs UPDATE SQL to supabase/seed/hue-angle-backfill-YYYY-MM-DD.sql
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/backfill-hue-angle.ts
 */

import * as https from "https";
import * as http from "http";
import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";

const NUM_CLUSTERS = 5;
const TEMP_BUCKET  = "material-images";
const TEMP_PREFIX  = "temp-hue-backfill";

async function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, (res) => {
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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function uploadTempJpeg(
  jpegBuffer: Buffer,
  filename: string,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string> {
  const objPath = `${TEMP_PREFIX}/${filename}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${TEMP_BUCKET}/${objPath}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "image/jpeg",
    },
    body: jpegBuffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed ${res.status}: ${text}`);
  }
  return `${supabaseUrl}/storage/v1/object/public/${TEMP_BUCKET}/${objPath}`;
}

async function deleteTempJpeg(
  filename: string,
  supabaseUrl: string,
  serviceKey: string,
): Promise<void> {
  const objPath = `${TEMP_PREFIX}/${filename}`;
  await fetch(`${supabaseUrl}/storage/v1/object/${TEMP_BUCKET}/${objPath}`, {
    method: "DELETE",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
}

async function fetchHueAngle(jpegUrl: string): Promise<number> {
  const params = new URLSearchParams({
    url: jpegUrl,
    json: "1",
    num_clusters: String(NUM_CLUSTERS),
    precision: "medium",
  });
  const apiUrl = `https://mk.bcgsc.ca/color-summarizer/?${params}`;
  const buf  = await downloadBuffer(apiUrl);
  const text = buf.toString("utf8");
  const data = JSON.parse(text);
  if (!data.clusters) throw new Error("No clusters in BCGSC response");

  const clusters = Object.values(data.clusters)
    .map((raw: any) => ({ H: parseFloat(raw.hsv[0]), C: parseFloat(raw.hsv[1]), f: raw.f }))
    .sort((a, b) => b.f - a.f);

  const dominant = clusters[0];
  return Math.round(dominant.H * 10) / 10;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Fetch materials with null hue_angle
  const res = await fetch(
    `${supabaseUrl}/rest/v1/materials?select=technical_code,image_url&hue_angle=is.null`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  const materials: { technical_code: string; image_url: string }[] = await res.json();
  console.log(`Found ${materials.length} materials with null hue_angle\n`);

  const lines: string[] = [
    `-- hue_angle backfill — generated ${new Date().toISOString().slice(0, 10)} by scripts/backfill-hue-angle.ts`,
    `-- Scored via BCGSC Color Summarizer (dominant cluster HSV hue)`,
    ``,
  ];

  const failed: string[] = [];

  for (const mat of materials) {
    process.stdout.write(`  ${mat.technical_code} … `);
    const tempFilename = `${mat.technical_code}.jpg`;
    try {
      // Download WebP
      const webpBuf = await downloadBuffer(mat.image_url);
      // Convert to JPEG
      const jpegBuf = await sharp(webpBuf).jpeg({ quality: 90 }).toBuffer();
      // Upload temp JPEG
      const tempUrl = await uploadTempJpeg(jpegBuf, tempFilename, supabaseUrl, serviceKey);
      // Score with BCGSC
      const hue = await fetchHueAngle(tempUrl);
      // Clean up
      await deleteTempJpeg(tempFilename, supabaseUrl, serviceKey);
      console.log(`${hue}°`);
      lines.push(`UPDATE materials SET hue_angle = ${hue} WHERE technical_code = '${mat.technical_code}';`);
    } catch (err) {
      // Try to clean up even on failure
      try { await deleteTempJpeg(tempFilename, supabaseUrl, serviceKey); } catch {}
      console.log(`FAILED — ${(err as Error).message}`);
      failed.push(mat.technical_code);
      lines.push(`-- FAILED: ${mat.technical_code}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const today = new Date().toISOString().slice(0, 10);
  const outPath = path.resolve("supabase/seed", `hue-angle-backfill-${today}.sql`);
  await fs.writeFile(outPath, lines.join("\n") + "\n");
  console.log(`\nSQL written to ${outPath}`);

  if (failed.length > 0) {
    console.log(`Failed (${failed.length}): ${failed.join(", ")}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
