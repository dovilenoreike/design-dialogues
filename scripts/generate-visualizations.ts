#!/usr/bin/env npx tsx

/**
 * Batch Image Generation Script for Visualizations
 *
 * Generates visualization images for all palette × room × style combinations
 * using OpenAI's image edits API.
 *
 * Usage:
 *   npm run generate:visuals -- --palette=fog-in-the-forest --quality=medium
 *   npm run generate:visuals -- --palette=all --quality=medium
 *   npm run generate:visuals -- --palette=fog-in-the-forest --style=japandi --room=kitchen
 *   npm run generate:visuals -- --dry-run --palette=all
 */

import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ============================================================================
// Configuration
// ============================================================================

const PALETTES = [
  "fog-in-the-forest",
  "behind-the-lights",
  "chocolate-wabi-sabi",
  "morning-mist",
  "day-by-the-sea",
];

const ROOMS = [
  { id: "kitchen", name: "Kitchen", file: "kitchen.jpg" },
  { id: "living-room", name: "Living Room", file: "living-room.jpg" },
  { id: "bathroom", name: "Bathroom", file: "bathroom.png" },
  { id: "bedroom", name: "Bedroom", file: "bedroom.jpg" },
];

// Style IDs for validation (actual data loaded from src/data/styles)
const STYLE_IDS = [
  "japandi",
  "art-inspired-modernism",
  "modern-brutalism",
  "quiet-luxury",
  "classic-modern",
  "scandinavian-minimalism",
];

interface StyleData {
  id: string;
  name: string;
  promptSnippet: string;
}

// Load styles from shared data source
async function loadStyles(): Promise<StyleData[]> {
  const stylesPath = path.join(PROJECT_ROOT, "src/data/styles/index.ts");
  const content = await fs.readFile(stylesPath, "utf-8");

  // Parse the styles array from the TypeScript file
  const styles: StyleData[] = [];
  const styleRegex = /{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*desc:\s*"[^"]*",\s*promptSnippet:\s*"([^"]+)"/g;

  let match;
  while ((match = styleRegex.exec(content)) !== null) {
    styles.push({
      id: match[1],
      name: match[2],
      promptSnippet: match[3],
    });
  }

  if (styles.length === 0) {
    throw new Error("Failed to load styles from src/data/styles/index.ts");
  }

  return styles;
}

// API config loaded dynamically from src/config/api.ts
interface ApiConfig {
  model: string;
  size: string;
  quality: string;
  endpoint: string;
}

async function loadApiConfig(): Promise<ApiConfig> {
  const configPath = path.join(PROJECT_ROOT, "src/config/api.ts");
  const content = await fs.readFile(configPath, "utf-8");

  // Parse values from the TypeScript config file
  // Match model in imageGeneration section
  const modelMatch = content.match(/imageGeneration:\s*{[^}]*model:\s*"([^"]+)"/s);
  const sizeMatch = content.match(/imageGeneration:\s*{[^}]*size:\s*"([^"]+)"/s);
  const qualityMatch = content.match(/imageGeneration:\s*{[^}]*quality:\s*"([^"]+)"/s);
  const endpointMatch = content.match(/imageEdits:\s*"([^"]+)"/);

  return {
    model: modelMatch?.[1] || "gpt-image-1",
    size: sizeMatch?.[1] || "1024x1024",
    quality: qualityMatch?.[1] || "low",
    endpoint: endpointMatch?.[1] || "https://api.openai.com/v1/images/edits",
  };
}

// ============================================================================
// Types
// ============================================================================

interface Palette {
  id: string;
  name: string;
  promptSnippet: string;
  materials: Record<
    string,
    {
      description: string;
      rooms: string[];
      purpose: Record<string, string>;
      materialType: string;
    }
  >;
}

interface CLIOptions {
  palette: string;
  room: string;
  style: string;
  quality: "low" | "medium" | "high" | null; // null = use config default
  force: boolean;
  dryRun: boolean;
  verbose: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    palette: "all",
    room: "all",
    style: "all",
    quality: null, // null = use config default
    force: false,
    dryRun: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--palette=")) {
      options.palette = arg.split("=")[1];
    } else if (arg.startsWith("--room=")) {
      options.room = arg.split("=")[1];
    } else if (arg.startsWith("--style=")) {
      options.style = arg.split("=")[1];
    } else if (arg.startsWith("--quality=")) {
      const q = arg.split("=")[1];
      if (q === "low" || q === "medium" || q === "high") {
        options.quality = q;
      }
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Visualization Generation Script

Usage:
  npm run generate:visuals -- [options]

Options:
  --palette=<id>     Palette ID or "all" (default: all)
                     Available: ${PALETTES.join(", ")}

  --room=<id>        Room ID or "all" (default: all)
                     Available: ${ROOMS.map((r) => r.id).join(", ")}

  --style=<id>       Style ID or "all" (default: all)
                     Available: ${STYLE_IDS.join(", ")}

  --quality=<level>  Image quality: low, medium, high (default: from api.ts config)

  --force            Regenerate even if image exists

  --dry-run          Show what would be generated without calling API

  --verbose, -v      Print the full prompt being sent to the API

Examples:
  # Generate all images for one palette
  npm run generate:visuals -- --palette=fog-in-the-forest --quality=medium

  # Generate specific combination
  npm run generate:visuals -- --palette=fog-in-the-forest --style=japandi --room=kitchen

  # Preview what would be generated
  npm run generate:visuals -- --palette=all --dry-run
`);
}

async function loadEnv(): Promise<string> {
  const envPath = path.join(PROJECT_ROOT, ".env.local");
  try {
    const content = await fs.readFile(envPath, "utf-8");
    const match = content.match(/VITE_OPENAI_API_KEY=(.+)/);
    if (match) {
      return match[1].trim();
    }
  } catch {
    // Try .env as fallback
    try {
      const content = await fs.readFile(
        path.join(PROJECT_ROOT, ".env"),
        "utf-8"
      );
      const match = content.match(/VITE_OPENAI_API_KEY=(.+)/);
      if (match) {
        return match[1].trim();
      }
    } catch {
      // Ignore
    }
  }

  // Check environment variable
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  throw new Error(
    "OpenAI API key not found. Set VITE_OPENAI_API_KEY in .env.local or OPENAI_API_KEY environment variable."
  );
}

async function loadPalette(paletteId: string): Promise<Palette> {
  const palettePath = path.join(
    PROJECT_ROOT,
    "src/data/palettes",
    `${paletteId}.json`
  );
  const content = await fs.readFile(palettePath, "utf-8");
  return JSON.parse(content);
}

function mapRoomNameToCategory(
  roomId: string
): "kitchen" | "bathroom" | "bedroom" | "livingRoom" | "other" {
  const mapping: Record<
    string,
    "kitchen" | "bathroom" | "bedroom" | "livingRoom" | "other"
  > = {
    kitchen: "kitchen",
    "living-room": "livingRoom",
    bathroom: "bathroom",
    bedroom: "bedroom",
  };
  return mapping[roomId] || "other";
}

function buildMaterialPrompt(palette: Palette, roomId: string): string {
  const roomCategory = mapRoomNameToCategory(roomId);

  // Filter materials for this room
  const filteredMaterials = Object.entries(palette.materials).filter(
    ([, material]) => material.rooms.includes(roomCategory)
  );

  if (filteredMaterials.length === 0) {
    return palette.promptSnippet;
  }

  // Build material descriptions
  const materialDescriptions = filteredMaterials.map(([, material]) => {
    const purpose =
      material.purpose[roomCategory] || material.purpose.default || "Material";
    return `- ${purpose}: ${material.description}`;
  });

  return `${palette.promptSnippet}\n\nMaterials specification:\n${materialDescriptions.join("\n")}`;
}

function buildFullPrompt(
  roomName: string,
  materialPrompt: string,
  stylePrompt: string
): string {
  return `Create an interior design visualisation for this ${roomName}.

THE ARCHITECTURE: ${stylePrompt}

THE MATERIALITY: ${materialPrompt}

THE SYNTHESIS: Create a fusion where the architecture and materiality harmoniously blend together. The design should reflect the chosen style while showcasing the specified materials in a cohesive and visually appealing manner. Focus on balance, contrast, and how the materials enhance the overall architectural concept.`;
}

async function loadImageAsBuffer(imagePath: string): Promise<Buffer> {
  return await fs.readFile(imagePath);
}

async function generateImage(
  imageBuffer: Buffer,
  prompt: string,
  apiKey: string,
  apiConfig: ApiConfig,
  qualityOverride?: string
): Promise<Buffer> {
  // Use native FormData (Node 18+)
  const formData = new FormData();

  // Create a File from the buffer (matching UI implementation exactly)
  // Always use image/png - same as UI code in src/lib/openai-api.ts
  const imageBlob = new Blob([imageBuffer], { type: "image/png" });
  const imageFile = new File([imageBlob], "room.png", { type: "image/png" });

  // Use CLI quality override if provided, otherwise use config default
  const quality = qualityOverride || apiConfig.quality;

  formData.append("image", imageFile);
  formData.append("prompt", prompt);
  formData.append("model", apiConfig.model);
  formData.append("size", apiConfig.size);
  formData.append("quality", quality);
  formData.append("n", "1");

  const response = await fetch(apiConfig.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: { message?: string } }).error?.message ||
        `API request failed: ${response.statusText}`
    );
  }

  const data = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
    error?: { message: string };
  };

  if (data.error) {
    throw new Error(data.error.message);
  }

  if (!data.data || data.data.length === 0) {
    throw new Error("No image data returned from API");
  }

  const imageData = data.data[0];

  if (imageData.b64_json) {
    return Buffer.from(imageData.b64_json, "base64");
  }

  if (imageData.url) {
    const imgResponse = await fetch(imageData.url);
    const arrayBuffer = await imgResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("No image data (b64_json or url) in API response");
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const options = parseArgs();

  console.log("\n🎨 Visualization Generation Script\n");
  console.log(`  Palette: ${options.palette}`);
  console.log(`  Room:    ${options.room}`);
  console.log(`  Style:   ${options.style}`);
  console.log(`  Quality: ${options.quality || "(use config default)"}`);
  console.log(`  Force:   ${options.force}`);
  console.log(`  Dry Run: ${options.dryRun}\n`);

  // Load API key (unless dry run)
  let apiKey = "";
  if (!options.dryRun) {
    apiKey = await loadEnv();
    console.log("✓ API key loaded\n");
  }

  // Load styles from shared data source
  const STYLES = await loadStyles();
  console.log(`✓ Loaded ${STYLES.length} styles from src/data/styles`);

  // Load API config from shared source
  const apiConfig = await loadApiConfig();
  console.log(`✓ Loaded API config: model=${apiConfig.model}, size=${apiConfig.size}, quality=${apiConfig.quality}\n`);

  // Determine what to generate
  const palettesToGenerate =
    options.palette === "all"
      ? PALETTES
      : PALETTES.filter((p) => p === options.palette);

  const roomsToGenerate =
    options.room === "all"
      ? ROOMS
      : ROOMS.filter((r) => r.id === options.room);

  const stylesToGenerate =
    options.style === "all"
      ? STYLES
      : STYLES.filter((s) => s.id === options.style);

  if (palettesToGenerate.length === 0) {
    console.error(`❌ Unknown palette: ${options.palette}`);
    process.exit(1);
  }

  if (roomsToGenerate.length === 0) {
    console.error(`❌ Unknown room: ${options.room}`);
    process.exit(1);
  }

  if (stylesToGenerate.length === 0) {
    console.error(`❌ Unknown style: ${options.style}`);
    process.exit(1);
  }

  const totalImages =
    palettesToGenerate.length *
    roomsToGenerate.length *
    stylesToGenerate.length;
  console.log(`📊 Will generate ${totalImages} image(s)\n`);

  // Generate images
  let current = 0;
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const paletteId of palettesToGenerate) {
    const palette = await loadPalette(paletteId);

    for (const style of stylesToGenerate) {
      for (const room of roomsToGenerate) {
        current++;
        const outputPath = path.join(
          PROJECT_ROOT,
          "public/visualisations",
          paletteId,
          style.id,
          `${room.id}.png`
        );

        const progress = `[${current}/${totalImages}]`;

        // Check if file exists
        if (!options.force && (await fileExists(outputPath))) {
          console.log(
            `${progress} ⏭️  Skipping ${paletteId}/${style.id}/${room.id} (exists)`
          );
          skipped++;
          continue;
        }

        // Build prompts (needed for both dry-run verbose and actual generation)
        const materialPrompt = buildMaterialPrompt(palette, room.id);
        const fullPrompt = buildFullPrompt(
          room.name,
          materialPrompt,
          style.promptSnippet
        );

        if (options.dryRun) {
          console.log(
            `${progress} 🔍 Would generate: ${paletteId}/${style.id}/${room.id}`
          );
          // Verbose: show prompt even in dry-run mode
          if (options.verbose) {
            console.log("\n" + "─".repeat(60));
            console.log("📝 PROMPT THAT WOULD BE SENT:");
            console.log("─".repeat(60));
            console.log(fullPrompt);
            console.log("─".repeat(60) + "\n");
          }
          continue;
        }

        console.log(
          `${progress} 🖼️  Generating ${paletteId}/${style.id}/${room.id}...`
        );

        // Verbose: show what's being sent to the API
        if (options.verbose) {
          console.log("\n" + "─".repeat(60));
          console.log("📝 PROMPT BEING SENT TO API:");
          console.log("─".repeat(60));
          console.log(fullPrompt);
          console.log("─".repeat(60) + "\n");
        }

        try {
          // Load base room image
          const baseImagePath = path.join(
            PROJECT_ROOT,
            "src/assets/rooms",
            room.file
          );
          const imageBuffer = await loadImageAsBuffer(baseImagePath);

          // Generate image (pass CLI quality as override, or undefined to use config default)
          const resultBuffer = await generateImage(
            imageBuffer,
            fullPrompt,
            apiKey,
            apiConfig,
            options.quality || undefined
          );

          // Ensure output directory exists
          await ensureDir(path.dirname(outputPath));

          // Save image
          await fs.writeFile(outputPath, resultBuffer);

          console.log(`         ✅ Saved to ${outputPath}`);
          generated++;
        } catch (error) {
          console.error(
            `         ❌ Failed: ${error instanceof Error ? error.message : error}`
          );
          failed++;
        }
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`   Failed:    ${failed}`);
  console.log("=".repeat(50) + "\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
