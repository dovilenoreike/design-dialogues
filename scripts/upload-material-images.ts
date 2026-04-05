/**
 * upload-material-images.ts
 *
 * Uploads ALL material texture images to Supabase Storage and updates:
 *   - image_url (hosted Supabase Storage URL)
 *   - material_type
 *   - tier
 *   - description
 *
 * Run with:
 *   SUPABASE_URL=https://nimrggpqcvgpgdmcermb.supabase.co \
 *   SUPABASE_SERVICE_KEY=<service_role_key> \
 *   npx tsx scripts/upload-material-images.ts
 *
 * Prerequisites:
 *   git checkout HEAD -- src/assets/materials/
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://nimrggpqcvgpgdmcermb.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_KEY env var");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET = "material-images";
const ASSETS_DIR = path.resolve(__dirname, "..", "src", "assets", "materials");

// ─────────────────────────────────────────────────────────────────────────────
// CODE → image path (relative to src/assets/materials/)
// Derived from src/data/materials/*.ts image imports
// ─────────────────────────────────────────────────────────────────────────────
const CODE_TO_PATH: Record<string, string> = {
  // ── Flooring ──────────────────────────────────────────────────────────────
  "aspecta-baron":          "flooring/aspecta-baron.jpg",
  "constance-chevrone":     "fog-in-the-forest/material1.jpg",
  "solido-como":            "flooring/aspecta-como.jpg",
  "macadamia":              "sleeping-earth/material1.jpg",
  "525-calisson-oak":       "behind-the-lights/material1.jpg",
  "pure-scandi-flooring":   "pure-scandi/material1.jpg",
  "light-concrete":         "spicy-nord/material1.jpg",
  "solido-bolsena":         "flooring/aspecta-bolsena.jpg",
  "solido-pearl":           "flooring/solido_pearl.jpg",
  "nagoja-duron":           "flooring/nagoja_duron.jpg",
  "aspecta-almond":         "flooring/aspecta-almond.jpg",
  "aspecta-brienz":         "flooring/aspecta-brienz.jpg",
  "aspecta-maggiore":       "flooring/aspecta-maggiore.jpg",
  "aspecta-burned":         "flooring/aspecta-burned.jpg",

  // ── Cabinet Fronts ────────────────────────────────────────────────────────
  "off-white-matte":                  "spicy-nord/material3.jpg",
  "velvet-1648":                      "caramel-morning/material5.jpg",
  "alvis-elitis-02-dy":               "caramel-morning/material6.jpg",
  "alvis-velazques-05":               "chocolate-wabi-sabi/material2.jpg",
  "velvet-4246":                      "cabinet-fronts/velvet_4246.jpg",
  "egger-taupe-grey":                 "day-by-the-sea/material4.jpg",
  "valchromat-chocolate":             "day-by-the-sea/material5.jpg",
  "velvet-3301":                      "cabinet-fronts/velvet_3301.jpg",
  "egger-dark-grey-fineline":         "cabinet-fronts/egger_dark_grey_fineline.jpg",
  "egger-medium-grey-fineline":       "cabinet-fronts/egger_medium_grey_fineline.jpg",
  "velvet-3702":                      "cabinet-fronts/velvet_3702.jpg",
  "alvic-vulcano":                    "morning-mist/material3.jpg",
  "valchromat-black":                 "behind-the-lights/material2.jpg",
  "egger-h1385-st40":                 "behind-the-lights/material4.jpg",
  "velvet-5983":                      "behind-the-lights/material7.jpg",
  "light-oak-veneer":                 "pure-scandi/material4.jpg",
  "natural-oak-veneer-amber":         "spicy-nord/material4.jpg",
  "egger-brown-casella-oak":          "cabinet-fronts/egger_brown_casella_oak.jpg",
  "egger-light-natural-casella-oak":  "cabinet-fronts/egger_light_natural_casella_oak.jpg",
  "egger-dark-brown-eucalypthus":     "cabinet-fronts/egger-dark-brown-eucalypthus.jpg",
  "skin-carbon-fumo":                 "cabinet-fronts/skin_carbon_fumo.jpg",
  "alvi-goya-03-na":                  "cabinet-fronts/alvic-goya-03.jpg",
  "alvic-goya-02":                    "cabinet-fronts/alvic-goya-02.jpg",
  "alvic-goya-01":                    "cabinet-fronts/alvic-goya-01.jpg",
  "velvet-1302":                      "cabinet-fronts/velvet-1302.jpg",
  "alvic-valazquez-04":               "cabinet-fronts/alvic_valazquez-04.jpg",
  "alvic-valazquez-05":               "cabinet-fronts/alvic_valazquez-05.jpg",
  "velvet-3703":                      "cabinet-fronts/velvet-3703.jpg",
  "velvet-7361":                      "cabinet-fronts/velvet-7361.jpg",
  "egger-natural-casella-oak":        "cabinet-fronts/egger-natural-casella-oak.jpg",
  "velvet-7473":                      "cabinet-fronts/velvet_7473.jpg",
  "velvet-1551":                      "cabinet-fronts/velvet_1551.jpg",
  "pearl-7901":                       "cabinet-fronts/pearl_7901.jpg",
  "egger-premium-white-worktop":      "worktops/egger_premium_white_w1000_ST76.jpg",
  "velvet-7574":                      "sleeping-earth/material2.jpg",
  "velvet-7393":                      "sleeping-earth/material4.jpg",

  // ── Worktops ──────────────────────────────────────────────────────────────
  "egger-f244-st76":          "fog-in-the-forest/material3.jpg",
  "egger-f229-st75":          "chocolate-wabi-sabi/material3.jpg",
  "icono-c43-eleganza-bianco":"day-by-the-sea/material3.jpg",
  "egger-u702-st75":          "chocolate-wabi-sabi/material6.jpg",
  "fondi-23-vulcano-grigia":  "sleeping-earth/material3.jpg",
  "fondi-40-peperino-marmo":  "worktops/fondi-40-peperino-marmo.jpg",
  "calacatta-viola":          "spicy-nord/material2.jpg",
  "grey-beige-marble":        "pure-scandi/material2.jpg",
  "icono-marquina-cava":      "worktops/icono_C35_marquina_cava.jpg",
  "icono-sereno-noto":        "worktops/icono_C45_sereno_noto.jpg",
  "icono-arabesca-marmo":     "worktops/icono-c42-arabesca-marmo.jpg",
  "icono-picasso-marrone":    "worktops/icono-c59-picasso-marrone.jpg",
  "icono-laurent-carrata":    "worktops/icono-c31-laurent-carata.jpg",
  "fondi-32-vento-marmo":     "worktops/fondi-32-vento-marmo.jpg",
  "egger-cremona-marble":     "worktops/egger-cremona-marble.jpg",
  "egger-soft-black":         "worktops/egger-soft-black.jpg",

  // ── Tiles ─────────────────────────────────────────────────────────────────
  "florim-sensi-lithos-grey":              "tiles/florim_sensi_lithos_grey.jpg",
  "soft-white-stone-tiles":                "pure-scandi/material5.jpg",
  "marazzi-confetto-kaki":                 "caramel-morning/material2.jpg",
  "ragno-eterna-mix":                      "caramel-morning/material3.jpg",
  "vaniglia-lux-terramater":               "caramel-morning/material4.jpg",
  "living-ceramics-oda-ductile-classic":   "tiles/oda_ductile_classic.jpg",
  "living-ceramics-oda-classic-soft":      "chocolate-wabi-sabi/material5.jpg",
  "living-ceramics-oda-ductile-ice-coast": "day-by-the-sea/material6.jpg",
  "marazzi-grande-marble-look-blue-grey":  "fog-in-the-forest/material2.jpg",
  "anthology-dark-natural":                "morning-mist/material4.jpg",
  "florim-onyx-silver-porphyry":           "sleeping-earth/material6.jpg",
  "oda-classic-soft-textured":             "tiles/oda_soft_textured.jpg",
  "atlas-marvel-nero-marquina":            "tiles/atlas_nero.jpg",
  "florim-sensi-lithos-white":             "tiles/florim_sensi_lithos_white.jpg",

  // ── Accents ───────────────────────────────────────────────────────────────
  "brushed-bronze":   "day-by-the-sea/material8.jpg",
  "off-white-wall":   "paint/ral_9016.jpg",
  "signal-white-paint": "paint/ral_9003.jpg",
  "aged-bronze":      "accents/aged_bronze.jpg",
  "chrome":           "accents/chrome.jpg",
  "gold":             "accents/gold.jpg",
  "wine-red":         "accents/wine_red.jpg",
};

// ─────────────────────────────────────────────────────────────────────────────
// material_type and tier per technical_code
// ─────────────────────────────────────────────────────────────────────────────
const MATERIAL_META: Record<string, { materialType: string | null; tier: "optimal" }> = {
  // Flooring
  "aspecta-baron":          { materialType: "Vinyl",           tier: "optimal" },
  "constance-chevrone":     { materialType: "Vinyl",           tier: "optimal" },
  "solido-como":            { materialType: "Vinyl",           tier: "optimal" },
  "macadamia":              { materialType: "Vinyl",           tier: "optimal" },
  "525-calisson-oak":       { materialType: "Laminate",        tier: "optimal" },
  "pure-scandi-flooring":   { materialType: null,              tier: "optimal" },
  "light-concrete":         { materialType: null,              tier: "optimal" },
  "solido-bolsena":         { materialType: "Vinyl",           tier: "optimal" },
  "solido-pearl":           { materialType: "Vinyl",           tier: "optimal" },
  "nagoja-duron":           { materialType: "Engineered Wood", tier: "optimal" },
  "aspecta-almond":         { materialType: "Vinyl",           tier: "optimal" },
  "aspecta-brienz":         { materialType: "Vinyl",           tier: "optimal" },
  "aspecta-maggiore":       { materialType: "Vinyl",           tier: "optimal" },
  "aspecta-burned":         { materialType: "Vinyl",           tier: "optimal" },
  // Cabinet Fronts
  "off-white-matte":                  { materialType: null,          tier: "optimal" },
  "velvet-1648":                      { materialType: "MDF",         tier: "optimal" },
  "alvis-elitis-02-dy":               { materialType: "LMDP",        tier: "optimal" },
  "alvis-velazques-05":               { materialType: "LMDP",        tier: "optimal" },
  "velvet-4246":                      { materialType: "MDF",         tier: "optimal" },
  "egger-taupe-grey":                 { materialType: "LMDP",        tier: "optimal" },
  "valchromat-chocolate":             { materialType: "MDF",         tier: "optimal" },
  "velvet-3301":                      { materialType: "MDF",         tier: "optimal" },
  "egger-dark-grey-fineline":         { materialType: "LMDP",        tier: "optimal" },
  "egger-medium-grey-fineline":       { materialType: "LMDP",        tier: "optimal" },
  "velvet-3702":                      { materialType: "MDF",         tier: "optimal" },
  "alvic-vulcano":                    { materialType: "LMDP",        tier: "optimal" },
  "valchromat-black":                 { materialType: "MDF",         tier: "optimal" },
  "egger-h1385-st40":                 { materialType: "LMDP",        tier: "optimal" },
  "velvet-5983":                      { materialType: "MDF",         tier: "optimal" },
  "light-oak-veneer":                 { materialType: null,          tier: "optimal" },
  "natural-oak-veneer-amber":         { materialType: null,          tier: "optimal" },
  "egger-brown-casella-oak":          { materialType: "LMDP",        tier: "optimal" },
  "egger-light-natural-casella-oak":  { materialType: "LMDP",        tier: "optimal" },
  "egger-dark-brown-eucalypthus":     { materialType: "LMDP",        tier: "optimal" },
  "skin-carbon-fumo":                 { materialType: "LMDP",        tier: "optimal" },
  "alvi-goya-03-na":                  { materialType: "LMDP",        tier: "optimal" },
  "alvic-goya-02":                    { materialType: "LMDP",        tier: "optimal" },
  "alvic-goya-01":                    { materialType: "LMDP",        tier: "optimal" },
  "velvet-1302":                      { materialType: "LMDP",        tier: "optimal" },
  "alvic-valazquez-04":               { materialType: "LMDP",        tier: "optimal" },
  "alvic-valazquez-05":               { materialType: "LMDP",        tier: "optimal" },
  "velvet-3703":                      { materialType: "LMDP",        tier: "optimal" },
  "velvet-7361":                      { materialType: "LMDP",        tier: "optimal" },
  "egger-natural-casella-oak":        { materialType: "LMDP",        tier: "optimal" },
  "velvet-7473":                      { materialType: "LMDP",        tier: "optimal" },
  "velvet-1551":                      { materialType: "LMDP",        tier: "optimal" },
  "pearl-7901":                       { materialType: "LMDP",        tier: "optimal" },
  "egger-premium-white-worktop":      { materialType: "LMDP",        tier: "optimal" },
  "velvet-7574":                      { materialType: "MDF",         tier: "optimal" },
  "velvet-7393":                      { materialType: "MDF",         tier: "optimal" },
  // Worktops
  "egger-f244-st76":           { materialType: "Compact HPL", tier: "optimal" },
  "egger-f229-st75":           { materialType: "LMDP",        tier: "optimal" },
  "icono-c43-eleganza-bianco": { materialType: "LMDP",        tier: "optimal" },
  "egger-u702-st75":           { materialType: "LMDP",        tier: "optimal" },
  "fondi-23-vulcano-grigia":   { materialType: "Compact HPL", tier: "optimal" },
  "fondi-40-peperino-marmo":   { materialType: "Compact HPL", tier: "optimal" },
  "calacatta-viola":           { materialType: null,           tier: "optimal" },
  "grey-beige-marble":         { materialType: null,           tier: "optimal" },
  "icono-marquina-cava":       { materialType: "Compact HPL", tier: "optimal" },
  "icono-sereno-noto":         { materialType: "Compact HPL", tier: "optimal" },
  "icono-arabesca-marmo":      { materialType: "Compact HPL", tier: "optimal" },
  "icono-picasso-marrone":     { materialType: "Compact HPL", tier: "optimal" },
  "icono-laurent-carrata":     { materialType: "Compact HPL", tier: "optimal" },
  "fondi-32-vento-marmo":      { materialType: "Compact HPL", tier: "optimal" },
  "egger-cremona-marble":      { materialType: "Compact HPL", tier: "optimal" },
  "egger-soft-black":          { materialType: "Compact HPL", tier: "optimal" },
  // Tiles
  "florim-sensi-lithos-grey":              { materialType: "Tiles", tier: "optimal" },
  "soft-white-stone-tiles":                { materialType: null,    tier: "optimal" },
  "marazzi-confetto-kaki":                 { materialType: "Tiles", tier: "optimal" },
  "ragno-eterna-mix":                      { materialType: "Tiles", tier: "optimal" },
  "vaniglia-lux-terramater":               { materialType: "Tiles", tier: "optimal" },
  "living-ceramics-oda-ductile-classic":   { materialType: "Tiles", tier: "optimal" },
  "living-ceramics-oda-classic-soft":      { materialType: "Tiles", tier: "optimal" },
  "living-ceramics-oda-ductile-ice-coast": { materialType: "Tiles", tier: "optimal" },
  "marazzi-grande-marble-look-blue-grey":  { materialType: "Tiles", tier: "optimal" },
  "anthology-dark-natural":                { materialType: "Tiles", tier: "optimal" },
  "florim-onyx-silver-porphyry":           { materialType: "Tiles", tier: "optimal" },
  "oda-classic-soft-textured":             { materialType: "Tiles", tier: "optimal" },
  "atlas-marvel-nero-marquina":            { materialType: "Tiles", tier: "optimal" },
  "florim-sensi-lithos-white":             { materialType: "Tiles", tier: "optimal" },
  // Accents
  "brushed-bronze":     { materialType: "Metal", tier: "optimal" },
  "off-white-wall":     { materialType: null,    tier: "optimal" },
  "signal-white-paint": { materialType: null,    tier: "optimal" },
  "aged-bronze":        { materialType: null,    tier: "optimal" },
  "chrome":             { materialType: null,    tier: "optimal" },
  "gold":               { materialType: null,    tier: "optimal" },
  "wine-red":           { materialType: null,    tier: "optimal" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Description data (from supabase/migrations/20260406000000_material_description.sql)
// ─────────────────────────────────────────────────────────────────────────────
const DESCRIPTIONS: Record<string, { en: string; lt: string }> = {
  "aspecta-baron":          { en: "Natural oak texture.", lt: "Natūralaus ąžuolo tekstūra." },
  "constance-chevrone":     { en: "Medium dark grey chevron vinyl flooring with irregular tone, wood-effect finish. Soft matte finish, subtle grain, gentle variation in tone.", lt: "Pilkšva ąžuolo tekstūra." },
  "solido-como":            { en: "Light warm-oak chevron floor with a matte finish. Soft natural wood grain, gentle colour variation, classic V-shaped pattern.", lt: "Šviesios šilto ąžuolo eglutės rašto grindys." },
  "macadamia":              { en: "Honeyed oak in darker medium tone and herringbone pattern", lt: "Šiltas, vidutinio atspalvio natūralaus ąžuolo tekstūra" },
  "525-calisson-oak":       { en: "Warm smoked oak in a herringbone pattern.", lt: "Šiltas rūkytas ąžuolas eglutės raštu." },
  "pure-scandi-flooring":   { en: "Light natural oak parquet, matte finish, subtle grain, laid in a mosaic pattern, Scandinavian feel.", lt: "Šviesaus ąžuolo tekstūra." },
  "light-concrete":         { en: "Light concrete texture with subtle warm undertones, matte finish.", lt: "Šviesaus betono tekstūra." },
  "solido-bolsena":         { en: "Natural light smoked oak flooring", lt: "Natūralios šviesiai rūkyto ąžuolo tekstūra" },
  "solido-pearl":           { en: "Light concrete texture", lt: "Šviesi betono tekstūra" },
  "nagoja-duron":           { en: "Natural light smoked oak flooring", lt: "Natūralios šviesiai rūkyto ąžuolo tekstūra" },
  "aspecta-almond":         { en: "Warm almond-toned oak vinyl flooring, matte finish.", lt: "Šilto migdolo tono ąžuolo vinilinės grindys, matinis paviršius." },
  "aspecta-brienz":         { en: "Cool grey-toned oak vinyl flooring, matte finish.", lt: "Vėsaus pilko tono ąžuolo vinilinės grindys, matinis paviršius." },
  "aspecta-maggiore":       { en: "Warm brown-toned oak vinyl flooring, matte finish.", lt: "Rudo ąžuolo vinilinės grindys, matinis paviršius." },
  "aspecta-burned":         { en: "Warm brown-toned oak vinyl flooring, matte finish.", lt: "Tamsaus ąžuolo vinilinės grindys, matinis paviršius." },
  "off-white-matte":        { en: "Flat matte off-white.", lt: "Matinė šilta balta spalva." },
  "velvet-1648":            { en: "Flat matte off-white.", lt: "Šilta balta spalva." },
  "alvis-elitis-02-dy":     { en: "Dark khaki-brown fronts with a subtle linear texture.", lt: "Chaki-ruda su subtilia linijine tekstūra." },
  "alvis-velazques-05":     { en: "Rich walnut veneer with deep chocolate brown tones and matte finish", lt: "Sodrus riešutmedžio tekstūra" },
  "velvet-4246":            { en: "Fjord Green flat texture, a pastel grey-blue with green undertones", lt: "Jūros šviesiai mėlyna matinė tekstūra" },
  "egger-taupe-grey":       { en: "Light taupe matte flat finish", lt: "Šviesiai pilkšvai ruda matinis paviršius" },
  "valchromat-chocolate":   { en: "Rich, deep, earthy brown flat texture", lt: "Šokolado, žemiška ruda tekstūra" },
  "velvet-3301":            { en: "Garrison grey colour with blue undertone. Flat surfaces.", lt: "Rūką primenanti melsvai pilka." },
  "egger-dark-grey-fineline":   { en: "Matte dark brown cabinet fronts with fine horizontal wood grain texture", lt: "Matinė tamsiai ruda medienos tekstūra" },
  "egger-medium-grey-fineline": { en: "Matte medium grey cabinet fronts with fine horizontal wood grain texture", lt: "Matinė vidutiniškai pilka medienos tekstūra" },
  "velvet-3702":            { en: "Matte grey-green color.", lt: "Matinė pilkai žalia spalva." },
  "alvic-vulcano":          { en: "Light taupe texture with a subtle vertical ribbed texture", lt: "Šviesi pilkšvai ruda tekstūra su subtiliu vertikaliu rievėjimu" },
  "valchromat-black":       { en: "Graphite matte – deep dark grey surface with a smooth, velvety matte texture", lt: "Grafito matinis – gilus tamsiai pilkas paviršius" },
  "egger-h1385-st40":       { en: "Natural warm-toned wood with subtle vertical grain.", lt: "Natūralus šilto atspalvio medis." },
  "velvet-5983":            { en: "Rich brick-red colour matte finish.", lt: "Sodriai plytų raudonos spalvos matinis paviršius." },
  "light-oak-veneer":       { en: "Light oak veneer fronts, vertical grain, matte natural oil finish", lt: "Šviesaus ąžuolo tekstūra." },
  "natural-oak-veneer-amber": { en: "Natural oak veneer, vertical grain, amber undertones, matte natural oil finish", lt: "Natūralaus medžio tekstūra" },
  "egger-brown-casella-oak":        { en: "Dark wood vertical texture and matte finish", lt: "Rudo medžio tekstūra" },
  "egger-light-natural-casella-oak":{ en: "Light natural wood vertical texture and matte finish", lt: "Šviesas natūralaus medžio tekstūra" },
  "skin-carbon-fumo":               { en: "Black Carbon and Wood Texture", lt: "Juoda anglies ir medžio tekstūra" },
  "alvi-goya-03-na":                { en: "Dark wood vertical texture and matte finish", lt: "Tamsi medžio tektūra" },
  "alvic-goya-02":                  { en: "Warm greige wood grain with vertical texture", lt: "Šiltas greige medienos grūdėlių piešinys" },
  "alvic-goya-01":                  { en: "Warm greige wood grain with vertical texture", lt: "Šiltas greige medienos grūdėlių piešinys" },
  "velvet-1302":                    { en: "Soft charcoal-black matte finish", lt: "Minkšta anglies juodumo matinė tekstūra" },
  "alvic-valazquez-04":             { en: "Light natural oak with fine vertical grain", lt: "Šviesi natūrali ąžuolo mediena su smulkiu vertikaliu grūdėliu" },
  "alvic-valazquez-05":             { en: "Deep warm walnut with fine vertical grain", lt: "Tamsus šiltas riešutas su smulkiu vertikaliu grūdėliu" },
  "velvet-3703":                    { en: "Sage grey matte lacquer finish", lt: "Pilkai žalsvai matinė lakuota spalva" },
  "velvet-7361":                    { en: "Warm greige matte lacquer finish", lt: "Šilta greige matinė lakuota spalva" },
  "egger-natural-casella-oak":      { en: "Warm natural oak wood grain", lt: "Šiltas natūralaus ąžuolo medienos raštas" },
  "egger-dark-brown-eucalypthus":   { en: "Warm natural oak wood grain", lt: "Šiltas natūralaus ąžuolo medienos raštas" },
  "velvet-7473":                    { en: "Light greige flat matte finish", lt: "Švelnios šviesiai greige spalvos matinės tekstūros" },
  "velvet-1551":                    { en: "Off white flat matte finish", lt: "Švelnios šviesiai greige spalvos matinės tekstūros" },
  "pearl-7901":                     { en: "Dark bronze flat matte finish", lt: "Tamsi bronza matinės tekstūros" },
  "egger-premium-white-worktop":    { en: "Flat matte off-white.", lt: "Šilta balta spalva." },
  "velvet-7574":                    { en: "Charcoal slate colour with blue undertones", lt: "Nakties mėlyna su pilkšvais atspalviais" },
  "velvet-7393":                    { en: "Light grey texture", lt: "Šviesiai pilka tekstūra" },
  "egger-f244-st76":           { en: "Dark grey marble with dramatic, busy pattern: mixed charcoal, grey, and subtle warm inclusions, irregular mineral texture", lt: "Tamsiai pilkas akmens raštas." },
  "egger-f229-st75":           { en: "Soft beige worktops, stone-textured surface", lt: "Šilta balta akmens tekstūra" },
  "icono-c43-eleganza-bianco": { en: "Stone-textured warm white", lt: "Šilta balta su akmens tekstūra" },
  "egger-u702-st75":           { en: "Smooth grey stone finish", lt: "Lygus pilko akmens paviršius" },
  "fondi-23-vulcano-grigia":   { en: "Dark grey stone texture", lt: "Tamsiai pilka akmens tekstūra" },
  "fondi-40-peperino-marmo":   { en: "Warm grey-brown medium tone marble with white veining and a calm, honed stone texture.", lt: "Šilta pilka marmuro tekstūra." },
  "calacatta-viola":           { en: "Bold white and black marble calacatta viola texture.", lt: "Drąsi juodo ir balto marmuro tekstūra." },
  "grey-beige-marble":         { en: "Natural soft grey-beige marble, cloudy movement, dark rich veins.", lt: "Šviesaus natūralaus akmens tekstūra." },
  "icono-marquina-cava":       { en: "Deep black marble featuring white veining", lt: "Juodas marmuras su baltomis gyslelėmis" },
  "icono-sereno-noto":         { en: "Grey concrete texture with subtle warm undertones", lt: "Pilkas betonas su subtiliais šiltais atspalviais" },
  "icono-arabesca-marmo":      { en: "Light grey marble with soft white veining", lt: "Šviesiai pilkas marmuras su subtiliomis baltomis gyslelėmis" },
  "icono-picasso-marrone":     { en: "Dark grey-brown stone with warm rust veining", lt: "Tamsiai pilkai rudas akmuo su šiltomis rūdžių gyslelėmis" },
  "icono-laurent-carrata":     { en: "White stone with bold texture", lt: "Baltas akmuo su charakteringu raštu" },
  "fondi-32-vento-marmo":      { en: "Light warm marble with soft grey veining", lt: "Šviesi šilta marmurinė tekstūra su subtiliomis pilkomis gyslelėmis" },
  "egger-cremona-marble":      { en: "Warm beige marble with soft brown veining", lt: "Šiltas bežinis marmuras su subtiliomis rudomis gyslelėmis" },
  "egger-soft-black":          { en: "Dark grey-black marble with subtle white veining", lt: "Tamsiai pilkai juodas marmuras su subtiliomis baltomis gyslelėmis" },
  "florim-sensi-lithos-grey":              { en: "Warm beige limestone-look tiles with a soft sandy texture", lt: "Šiltos smėlio spalvos kalkakmenio imitacijos plytelės" },
  "soft-white-stone-tiles":                { en: "Soft white stone-effect tiles with subtle texture, matte finish.", lt: "Švelnios baltos akmens tekstūros plytelės." },
  "marazzi-confetto-kaki":                 { en: "Matte khaki-brown small ribbed tiles with horizontal oval reliefs", lt: "Reljefinės chaki-rudos spalvos plytelės" },
  "ragno-eterna-mix":                      { en: "Matte terrazzo-look stone tiles with beige and warm grey base and mixed stone fragments", lt: "Šiltos terazo stiliaus plytelės." },
  "vaniglia-lux-terramater":               { en: "Matte off-white handmade-look tiles with slightly uneven edges and soft warm-white tone", lt: "Baltos rankų darbo stiliaus plytelės." },
  "living-ceramics-oda-ductile-classic":   { en: "Vertically striped graphite tiles", lt: "Vertikaliai frezuotos grafito plytelės" },
  "living-ceramics-oda-classic-soft":      { en: "Dark graphite colour stone-textured surface tiles", lt: "Grafito spalvos akmens tekstūra" },
  "living-ceramics-oda-ductile-ice-coast": { en: "Ribbed tiles as subtle vertical accents of white stone texture", lt: "Rievėtos plytelės kaip subtilūs vertikalūs balto akmens tekstūros akcentai" },
  "marazzi-grande-marble-look-blue-grey":  { en: "Dark grey marble with dramatic, busy pattern: mixed charcoal, grey, and subtle warm inclusions, irregular mineral texture", lt: "Tamsiai pilkas akmens raštas." },
  "anthology-dark-natural":                { en: "Dark grey stone with a mixed mineral pattern: deep charcoal base, lighter grey veining, and scattered textured stone fragments.", lt: "Tamsiai pilkas akmuo su mišriu mineraliniu raštu." },
  "florim-onyx-silver-porphyry":           { en: "Dark taupe-grey natural stone texture with high variation, cloudy movement and fractured veining. Irregular white mineral streaks cutting through the surface.", lt: "Pilkos plytelės su uolų tekstūra" },
  "oda-classic-soft-textured":             { en: "Dark fossil limestone tiles with organic shell inclusions and a muted bluish-grey undertone.", lt: "Tamsios fosilijų kalkakmenio raštas." },
  "atlas-marvel-nero-marquina":            { en: "Deep black marble tiles featuring white veining", lt: "Gilios juodos marmuro plytelės su baltomis gyslelėmis" },
  "florim-sensi-lithos-white":             { en: "Soft light of white tiles with subtle texture, matte finish.", lt: "Švelnios šviesios spalvos akmens tekstūros plytelės." },
  "brushed-bronze":     { en: "Brushed bronze or muted brass texture", lt: "Šlifuotos bronzos arba švelnios žalvario tekstūra" },
  "off-white-wall":     { en: "Warm off-white wall paint, matte finish.", lt: "Šilta balta matinė sienų danga." },
  "signal-white-paint": { en: "Warm signal white wall paint, matte finish.", lt: "Neutrali balta matinė sienų danga." },
  "aged-bronze":        { en: "Aged bronze finish, warm undertones.", lt: "Sendintos bronzos detalės, šilti atspalviai." },
  "chrome":             { en: "Chrome finish, modern look.", lt: "Chromo detalės, moderni išvaizda." },
  "gold":               { en: "Gold finish, luxurious appearance.", lt: "Aukso detalės, prabangi išvaizda." },
  "wine-red":           { en: "Wine red finish, rich and warm.", lt: "Vyno raudonos detalės, netikėti akcentai." },
};

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Failed to create bucket: ${error.message}`);
    console.log(`✓ Created public bucket "${BUCKET}"`);
  } else {
    console.log(`✓ Bucket "${BUCKET}" already exists`);
  }
}

async function uploadImages() {
  const entries = Object.entries(CODE_TO_PATH);
  console.log(`\n── Uploading ${entries.length} images ──\n`);

  let uploaded = 0, skipped = 0, errors = 0;

  for (const [code, relativePath] of entries) {
    const localFile = path.join(ASSETS_DIR, relativePath);

    if (!fs.existsSync(localFile)) {
      console.warn(`  ⚠  ${code}: file not found (${relativePath}) — skipping`);
      skipped++;
      continue;
    }

    const fileBuffer = fs.readFileSync(localFile);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(relativePath, fileBuffer, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      console.error(`  ✗  ${code}: upload failed — ${uploadError.message}`);
      errors++;
      continue;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(relativePath);
    const publicUrl = urlData.publicUrl;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { error: dbError } = await (supabase as any)
      .from("materials")
      .update({ image_url: publicUrl })
      .eq("technical_code", code);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (dbError) {
      console.error(`  ✗  ${code}: DB image_url update failed — ${dbError.message}`);
      errors++;
      continue;
    }

    console.log(`  ✓  ${code}`);
    uploaded++;
  }

  console.log(`\nImages: uploaded=${uploaded}  skipped=${skipped}  errors=${errors}`);
  return errors;
}

async function updateMeta() {
  const entries = Object.entries(MATERIAL_META);
  console.log(`\n── Updating tier + material_type for ${entries.length} materials ──\n`);

  let ok = 0, errors = 0;

  for (const [code, meta] of entries) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { error } = await (supabase as any)
      .from("materials")
      .update({ tier: meta.tier, material_type: meta.materialType })
      .eq("technical_code", code);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (error) {
      console.error(`  ✗  ${code}: meta update failed — ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓  ${code}  [${meta.tier}${meta.materialType ? ` / ${meta.materialType}` : ""}]`);
      ok++;
    }
  }

  console.log(`\nMeta: ok=${ok}  errors=${errors}`);
  return errors;
}

async function updateDescriptions() {
  const entries = Object.entries(DESCRIPTIONS);
  console.log(`\n── Updating descriptions for ${entries.length} materials ──\n`);

  let ok = 0, errors = 0;

  for (const [code, desc] of entries) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { error } = await (supabase as any)
      .from("materials")
      .update({ description: desc })
      .eq("technical_code", code);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    if (error) {
      console.error(`  ✗  ${code}: description update failed — ${error.message}`);
      errors++;
    } else {
      ok++;
    }
  }

  console.log(`Description: ok=${ok}  errors=${errors}`);
  return errors;
}

async function run() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`\n✗ src/assets/materials/ not found at ${ASSETS_DIR}`);
    console.error("  Restore it first: git checkout HEAD -- src/assets/materials/\n");
    process.exit(1);
  }

  await ensureBucket();

  const e1 = await uploadImages();
  const e2 = await updateMeta();
  const e3 = await updateDescriptions();

  console.log(`\n${"─".repeat(45)}`);
  console.log("All done.");
  console.log("\nNext steps:");
  console.log("  rm -rf src/assets/materials/");
  console.log("  rm -rf src/data/materials/");

  if (e1 + e2 + e3 > 0) process.exit(1);
}

run().catch((e) => { console.error(e); process.exit(1); });
