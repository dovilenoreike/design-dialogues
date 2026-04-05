/**
 * One-time migration script: upserts all TypeScript material data into Supabase.
 *
 * Populates: name (jsonb), material_type, tier, texture_prompt, showroom_ids
 * Skips:     image_url  — filled in a separate step after Supabase Storage upload
 * Skips:     graph attributes (texture/lightness/warmth/pattern/role) — already in seed
 *
 * Run with:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=service_role_key \
 *   npx tsx scripts/migrate-materials.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MaterialRow {
  technical_code: string;
  name: { en: string; lt: string };
  material_type: string | null;
  tier: string;
  texture_prompt: string;
  showroom_ids: string[];
}

const MATERIALS: MaterialRow[] = [
  // ─── FLOORING ─────────────────────────────────────────────────────────────
  { technical_code: "aspecta-baron",       name: { en: "Baron", lt: "Baron" },                                     material_type: "Vinyl",         tier: "optimal", texture_prompt: "Natural oak texture.",                                                                        showroom_ids: ["solido-grindys"] },
  { technical_code: "constance-chevrone",  name: { en: "Constance Chevrone", lt: "Constance Chevrone" },           material_type: "Vinyl",         tier: "optimal", texture_prompt: "Medium dark grey chevron vinyl flooring with irregular tone, wood-effect finish.",            showroom_ids: ["solido-grindys"] },
  { technical_code: "solido-como",         name: { en: "Como Chevrone", lt: "Como Chevrone" },                     material_type: "Vinyl",         tier: "optimal", texture_prompt: "Light warm-oak chevron floor with a matte finish.",                                           showroom_ids: ["solido-grindys"] },
  { technical_code: "macadamia",           name: { en: "Macadamia", lt: "Macadamia" },                             material_type: "Vinyl",         tier: "optimal", texture_prompt: "Honeyed oak in darker medium tone and herringbone pattern",                                   showroom_ids: ["solido-grindys"] },
  { technical_code: "525-calisson-oak",    name: { en: "525 Calisson Oak", lt: "525 Calisson Oak" },               material_type: "Laminate",      tier: "optimal", texture_prompt: "Warm smoked oak in a herringbone pattern.",                                                  showroom_ids: ["impeka"] },
  { technical_code: "pure-scandi-flooring",name: { en: "Light Natural Oak Parquet", lt: "Šviesaus ąžuolo parketas" }, material_type: null,         tier: "optimal", texture_prompt: "Light natural oak parquet, matte finish, subtle grain, laid in a mosaic pattern.",            showroom_ids: [] },
  { technical_code: "light-concrete",      name: { en: "Light Concrete", lt: "Šviesus betonas" },                  material_type: null,            tier: "optimal", texture_prompt: "Light concrete texture with subtle warm undertones, matte finish.",                            showroom_ids: [] },
  { technical_code: "solido-bolsena",      name: { en: "Light Smoked Oak", lt: "Šviesiai rūkytas ąžuolas" },       material_type: "Vinyl",         tier: "optimal", texture_prompt: "Natural light smoked oak flooring",                                                           showroom_ids: ["solido-grindys"] },
  { technical_code: "solido-pearl",        name: { en: "Light Concrete Texture", lt: "Šviesi betono tekstūra" },   material_type: "Vinyl",         tier: "optimal", texture_prompt: "Light concrete texture flooring",                                                              showroom_ids: ["jusu-salonas"] },
  { technical_code: "nagoja-duron",        name: { en: "Light Smoked Oak", lt: "Rudas ąžuolas" },                  material_type: "Engineered Wood", tier: "optimal", texture_prompt: "Natural medium brown oak flooring",                                                         showroom_ids: ["jusu-salonas"] },
  { technical_code: "aspecta-almond",      name: { en: "Almond", lt: "Almond" },                                   material_type: "Vinyl",         tier: "optimal", texture_prompt: "Warm almond-toned oak vinyl flooring, matte finish.",                                         showroom_ids: ["solido-grindys"] },
  { technical_code: "aspecta-brienz",      name: { en: "Brienz", lt: "Brienz" },                                   material_type: "Vinyl",         tier: "optimal", texture_prompt: "Cool grey-toned oak vinyl flooring, matte finish.",                                           showroom_ids: ["solido-grindys"] },
  { technical_code: "aspecta-maggiore",    name: { en: "Maggiore", lt: "Maggiore" },                               material_type: "Vinyl",         tier: "optimal", texture_prompt: "Warm brown-toned oak vinyl",                                                                  showroom_ids: ["solido-grindys"] },
  { technical_code: "aspecta-burned",      name: { en: "Burned", lt: "Burned" },                                   material_type: "Vinyl",         tier: "optimal", texture_prompt: "Dark brown-toned oak",                                                                        showroom_ids: ["solido-grindys"] },

  // ─── CABINET FRONTS ───────────────────────────────────────────────────────
  { technical_code: "off-white-matte",                 name: { en: "Off-White Matte", lt: "Matinė šilta balta" },                        material_type: null,   tier: "optimal", texture_prompt: "Flat matte off-white.",                                               showroom_ids: [] },
  { technical_code: "velvet-1648",                     name: { en: "Velvet 1648", lt: "Velvet 1648" },                                   material_type: "MDF",  tier: "optimal", texture_prompt: "Flat matte off-white.",                                               showroom_ids: ["impeka"] },
  { technical_code: "alvis-elitis-02-dy",              name: { en: "Alvis Elitis 02 DY", lt: "Alvis Elitis 02 DY" },                     material_type: "LMDP", tier: "optimal", texture_prompt: "Dark khaki-brown fronts with a subtle linear texture.",              showroom_ids: ["impeka"] },
  { technical_code: "alvis-velazques-05",              name: { en: "Alvis Velazques 05", lt: "Alvis Velazques 05" },                     material_type: "LMDP", tier: "optimal", texture_prompt: "Rich walnut veneer with deep chocolate brown tones and matte finish", showroom_ids: ["impeka"] },
  { technical_code: "velvet-4246",                     name: { en: "Velvet 4246", lt: "Velvet 4246" },                                   material_type: "MDF",  tier: "optimal", texture_prompt: "A pastel grey-blue with green undertones",                          showroom_ids: ["impeka"] },
  { technical_code: "egger-taupe-grey",                name: { en: "Egger U750 ST9", lt: "Egger U750 ST9" },                             material_type: "LMDP", tier: "optimal", texture_prompt: "Light taupe matte flat finish",                                       showroom_ids: ["impeka"] },
  { technical_code: "valchromat-chocolate",            name: { en: "Valchromat Chocolate", lt: "Valchromat Chocolate" },                 material_type: "MDF",  tier: "optimal", texture_prompt: "Rich, deep, earthy brown flat texture",                            showroom_ids: ["impeka"] },
  { technical_code: "velvet-3301",                     name: { en: "Velvet 3301", lt: "Velvet 3301" },                                   material_type: "MDF",  tier: "optimal", texture_prompt: "Garrison grey colour with blue undertone. Flat surfaces.",           showroom_ids: ["impeka"] },
  { technical_code: "egger-dark-grey-fineline",        name: { en: "Egger Dark Grey Fineline", lt: "Egger Dark Grey Fineline" },         material_type: "LMDP", tier: "optimal", texture_prompt: "Matte dark brown cabinet fronts with fine horizontal wood grain texture", showroom_ids: ["impeka"] },
  { technical_code: "egger-medium-grey-fineline",      name: { en: "Egger Medium Grey Fineline", lt: "Egger Medium Grey Fineline" },     material_type: "LMDP", tier: "optimal", texture_prompt: "Matte dark brown cabinet fronts with fine horizontal wood grain texture", showroom_ids: ["impeka"] },
  { technical_code: "velvet-3702",                     name: { en: "Velvet 3702", lt: "Velvet 3702" },                                   material_type: "MDF",  tier: "optimal", texture_prompt: "Matte grey-green color.",                                           showroom_ids: ["impeka"] },
  { technical_code: "alvic-vulcano",                   name: { en: "Alvic Vulcano", lt: "Alvic Vulcano" },                               material_type: "LMDP", tier: "optimal", texture_prompt: "Light taupe texture with a subtle vertical ribbed texture",           showroom_ids: ["impeka"] },
  { technical_code: "valchromat-black",                name: { en: "Valchromat Black", lt: "Valchromat Black" },                         material_type: "MDF",  tier: "optimal", texture_prompt: "Black, velvety matte",                                              showroom_ids: ["impeka"] },
  { technical_code: "egger-h1385-st40",                name: { en: "Egger H1385 ST40", lt: "Egger H1385 ST40" },                         material_type: "LMDP", tier: "optimal", texture_prompt: "Natural warm-toned wood with subtle vertical grain.",                showroom_ids: ["impeka"] },
  { technical_code: "velvet-5983",                     name: { en: "Velvet 5983", lt: "Velvet 5983" },                                   material_type: "MDF",  tier: "optimal", texture_prompt: "Rich brick-red colour matte finish.",                               showroom_ids: ["impeka"] },
  { technical_code: "light-oak-veneer",                name: { en: "Light Oak Veneer", lt: "Šviesaus ąžuolo lukštas" },                  material_type: null,   tier: "optimal", texture_prompt: "Light oak veneer fronts, vertical grain, matte natural oil finish",   showroom_ids: [] },
  { technical_code: "natural-oak-veneer-amber",        name: { en: "Natural Oak Veneer (Amber)", lt: "Natūralaus ąžuolo lukštas" },      material_type: null,   tier: "optimal", texture_prompt: "Natural oak veneer, vertical grain, amber undertones, matte natural oil finish", showroom_ids: [] },
  { technical_code: "egger-brown-casella-oak",         name: { en: "Brown Casella Oak", lt: "Rudas ramus ąžuolas" },                     material_type: "LMDP", tier: "optimal", texture_prompt: "Dark wood vertical texture and matte finish",                        showroom_ids: [] },
  { technical_code: "egger-light-natural-casella-oak", name: { en: "Light Natural Casella Oak", lt: "Šviesus ąžuolas" },                 material_type: "LMDP", tier: "optimal", texture_prompt: "Light natural wood vertical texture and matte finish",               showroom_ids: [] },
  { technical_code: "skin-carbon-fumo",                name: { en: "Black Carbon and Wood Texture", lt: "Juoda anglies ir medžio tekstūra" }, material_type: "LMDP", tier: "optimal", texture_prompt: "Black Carbon and Wood Texture",                               showroom_ids: [] },
  { technical_code: "alvi-goya-03-na",                 name: { en: "Dark Wood Texture", lt: "Tamsi medžio tektūra" },                    material_type: "LMDP", tier: "optimal", texture_prompt: "Dark wood vertical texture and matte finish",                        showroom_ids: ["impeka"] },
  { technical_code: "alvic-goya-02",                   name: { en: "Alvic Goya 02", lt: "Alvic Goya 02" },                               material_type: "LMDP", tier: "optimal", texture_prompt: "Warm greige wood grain with vertical texture, matte finish.",        showroom_ids: ["impeka"] },
  { technical_code: "alvic-goya-01",                   name: { en: "Alvic Goya 01", lt: "Alvic Goya 01" },                               material_type: "LMDP", tier: "optimal", texture_prompt: "Light greige wood grain with vertical texture, matte finish.",       showroom_ids: ["impeka"] },
  { technical_code: "velvet-1302",                     name: { en: "Velvet Soft Black", lt: "Velvet Soft Black" },                        material_type: "LMDP", tier: "optimal", texture_prompt: "Soft charcoal-black flat matte finish.",                            showroom_ids: ["impeka"] },
  { technical_code: "alvic-valazquez-04",              name: { en: "Alvic Valázquez 04", lt: "Alvic Valázquez 04" },                     material_type: "LMDP", tier: "optimal", texture_prompt: "Light natural oak with fine vertical grain, matte finish.",          showroom_ids: ["impeka"] },
  { technical_code: "alvic-valazquez-05",              name: { en: "Alvic Valázquez 05", lt: "Alvic Valázquez 05" },                     material_type: "LMDP", tier: "optimal", texture_prompt: "Deep warm walnut with fine vertical grain, matte finish.",           showroom_ids: ["impeka"] },
  { technical_code: "velvet-3703",                     name: { en: "Velvet 3703", lt: "Velvet 3703" },                                   material_type: "LMDP", tier: "optimal", texture_prompt: "Flat sage grey matte finish.",                                       showroom_ids: ["impeka"] },
  { technical_code: "velvet-7361",                     name: { en: "Velvet 7361", lt: "Velvet 7361" },                                   material_type: "LMDP", tier: "optimal", texture_prompt: "Flat warm greige matte finish.",                                     showroom_ids: ["impeka"] },
  { technical_code: "egger-natural-casella-oak",       name: { en: "Egger Natural Casella Oak", lt: "Egger Natural Casella Oak" },       material_type: "LMDP", tier: "optimal", texture_prompt: "Warm natural oak wood grain, vertical texture, matte finish.",      showroom_ids: ["impeka"] },
  { technical_code: "egger-dark-brown-eucalypthus",    name: { en: "Egger Dark", lt: "Egger Dark" },                                     material_type: "LMDP", tier: "optimal", texture_prompt: "Dark brown-toned oak veneer texture.",                               showroom_ids: ["impeka"] },
  { technical_code: "velvet-7473",                     name: { en: "Light Greige Matte", lt: "Šviesiai pilka matinė" },                  material_type: "LMDP", tier: "optimal", texture_prompt: "Light greige flat matte finish",                                     showroom_ids: ["impeka"] },
  { technical_code: "velvet-1551",                     name: { en: "Off White Matte", lt: "Šilta balta matinė" },                        material_type: "LMDP", tier: "optimal", texture_prompt: "Off white flat matte finish",                                        showroom_ids: ["impeka"] },
  { technical_code: "pearl-7901",                      name: { en: "Dark Bronze Matte", lt: "Tamsi bronza" },                            material_type: "LMDP", tier: "optimal", texture_prompt: "Dark bronze flat matte finish",                                      showroom_ids: ["impeka"] },
  { technical_code: "egger-premium-white-worktop",     name: { en: "Flat matte off-white", lt: "Šilta balta spalva" },                   material_type: "LMDP", tier: "optimal", texture_prompt: "Flat matte off-white.",                                             showroom_ids: ["impeka"] },
  { technical_code: "velvet-7574",                     name: { en: "Velvet 7574", lt: "Velvet 7574" },                                   material_type: "MDF",  tier: "optimal", texture_prompt: "Charcoal slate colour with blue undertones",                        showroom_ids: ["impeka"] },
  { technical_code: "velvet-7393",                     name: { en: "Velvet 7393", lt: "Velvet 7393" },                                   material_type: "MDF",  tier: "optimal", texture_prompt: "Light grey cashmere colour with flat matte finish",                  showroom_ids: ["impeka"] },

  // ─── WORKTOPS ─────────────────────────────────────────────────────────────
  { technical_code: "egger-f244-st76",             name: { en: "Egger F244 ST76", lt: "Egger F244 ST76" },             material_type: "Compact HPL", tier: "optimal", texture_prompt: "Dark grey marble with dramatic, busy pattern",                          showroom_ids: ["impeka"] },
  { technical_code: "egger-f229-st75",             name: { en: "Egger F229 ST75", lt: "Egger F229 ST75" },             material_type: "LMDP",        tier: "optimal", texture_prompt: "Soft beige worktops, stone-textured surface",                         showroom_ids: ["impeka"] },
  { technical_code: "icono-c43-eleganza-bianco",   name: { en: "ICONO C43 Eleganza Bianco", lt: "ICONO C43 Eleganza Bianco" }, material_type: "LMDP", tier: "optimal", texture_prompt: "Stone-textured warm white",                                  showroom_ids: ["impeka"] },
  { technical_code: "egger-u702-st75",             name: { en: "Egger U702 ST75", lt: "Egger U702 ST75" },             material_type: "LMDP",        tier: "optimal", texture_prompt: "Smooth grey stone finish",                                          showroom_ids: ["impeka"] },
  { technical_code: "fondi-23-vulcano-grigia",     name: { en: "FONDI 23 Vulcano Grigia", lt: "FONDI 23 Vulcano Grigia" }, material_type: "Compact HPL", tier: "optimal", texture_prompt: "Dark grey stone texture",                                    showroom_ids: ["impeka"] },
  { technical_code: "fondi-40-peperino-marmo",     name: { en: "Fondi 40 Peperino Marmo", lt: "Fondi 40 Peperino Marmo" }, material_type: "Compact HPL", tier: "optimal", texture_prompt: "Warm grey-brown medium tone marble with white veining",         showroom_ids: ["impeka"] },
  { technical_code: "calacatta-viola",             name: { en: "Calacatta Viola", lt: "Calacatta Viola" },             material_type: null,          tier: "optimal", texture_prompt: "Bold white and black marble calacatta viola texture.",            showroom_ids: [] },
  { technical_code: "grey-beige-marble",           name: { en: "Grey-Beige Marble", lt: "Pilkai smėlinis marmuras" }, material_type: null,          tier: "optimal", texture_prompt: "Natural soft grey-beige marble, cloudy movement, dark rich veins.", showroom_ids: ["impeka"] },
  { technical_code: "icono-marquina-cava",         name: { en: "Icono Marquina Cava", lt: "Icono Marquina Cava" },     material_type: "Compact HPL", tier: "optimal", texture_prompt: "Black marble featuring white veining",                            showroom_ids: ["impeka"] },
  { technical_code: "icono-sereno-noto",           name: { en: "Icono Sereno Noto", lt: "Icono Sereno Noto" },         material_type: "Compact HPL", tier: "optimal", texture_prompt: "Grey concrete texture with subtle warm undertones, matte finish.", showroom_ids: ["impeka"] },
  { technical_code: "icono-arabesca-marmo",        name: { en: "Icono Arabesca Marmo", lt: "Icono Arabesca Marmo" },   material_type: "Compact HPL", tier: "optimal", texture_prompt: "Light grey marble with soft white veining, matte finish.",       showroom_ids: ["impeka"] },
  { technical_code: "icono-picasso-marrone",       name: { en: "Icono Picasso Marrone", lt: "Icono Picasso Marrone" }, material_type: "Compact HPL", tier: "optimal", texture_prompt: "Dark grey-brown stone with warm rust veining, matte finish.",   showroom_ids: ["impeka"] },
  { technical_code: "icono-laurent-carrata",       name: { en: "Icono Laurent Carrata", lt: "Icono Laurent Carrata" }, material_type: "Compact HPL", tier: "optimal", texture_prompt: "White stone with bold texture.",                               showroom_ids: ["impeka"] },
  { technical_code: "fondi-32-vento-marmo",        name: { en: "Fondi 32 Vento Marmo", lt: "Fondi 32 Vento Marmo" },   material_type: "Compact HPL", tier: "optimal", texture_prompt: "Light warm marble with soft grey veining, matte finish.",      showroom_ids: ["impeka"] },
  { technical_code: "egger-cremona-marble",        name: { en: "Egger Cremona Marble", lt: "Egger Kremona marmuras" }, material_type: "Compact HPL", tier: "optimal", texture_prompt: "Warm beige marble with soft brown veining, matte finish.",     showroom_ids: ["impeka"] },
  { technical_code: "egger-soft-black",            name: { en: "Egger Soft Black", lt: "Egger Soft Black" },           material_type: "Compact HPL", tier: "optimal", texture_prompt: "Dark grey-black color matte finish.",                          showroom_ids: ["impeka"] },

  // ─── TILES ────────────────────────────────────────────────────────────────
  { technical_code: "florim-sensi-lithos-grey",              name: { en: "Florim Sensi Lithos Grey", lt: "Florim Sensi Lithos Grey" },             material_type: "Tiles", tier: "optimal", texture_prompt: "Warm beige limestone-look tiles with a soft sandy texture",                    showroom_ids: ["linea"] },
  { technical_code: "soft-white-stone-tiles",                name: { en: "Soft White Stone Tiles", lt: "Baltos akmens plytelės" },                 material_type: null,    tier: "optimal", texture_prompt: "Soft white stone-effect tiles with subtle texture, matte finish.",           showroom_ids: [] },
  { technical_code: "marazzi-confetto-kaki",                 name: { en: "Marazzi Confetto Kaki", lt: "Marazzi Confetto Kaki" },                   material_type: "Tiles", tier: "optimal", texture_prompt: "Matte khaki-brown small ribbed tiles with horizontal oval reliefs",         showroom_ids: ["linea"] },
  { technical_code: "ragno-eterna-mix",                      name: { en: "Ragno Eterna Mix Multicolor", lt: "Ragno Eterna Mix Multicolor" },       material_type: "Tiles", tier: "optimal", texture_prompt: "Matte terrazzo-look stone tiles with beige and warm grey base",            showroom_ids: ["linea"] },
  { technical_code: "vaniglia-lux-terramater",               name: { en: "Vaniglia Lux Terramater", lt: "Vaniglia Lux Terramater" },               material_type: "Tiles", tier: "optimal", texture_prompt: "Matte off-white handmade-look tiles with slightly uneven edges",          showroom_ids: ["linea"] },
  { technical_code: "living-ceramics-oda-ductile-classic",   name: { en: "Living Ceramics Oda Ductile Classic", lt: "Living Ceramics Oda Ductile Classic" }, material_type: "Tiles", tier: "optimal", texture_prompt: "Vertically striped graphite tiles",              showroom_ids: ["linea"] },
  { technical_code: "living-ceramics-oda-classic-soft",      name: { en: "Living Ceramics Oda Classic Soft", lt: "Living Ceramics Oda Classic Soft" }, material_type: "Tiles", tier: "optimal", texture_prompt: "Dark graphite colour stone-textured surface tiles",         showroom_ids: ["linea"] },
  { technical_code: "living-ceramics-oda-ductile-ice-coast", name: { en: "Living Ceramics Oda Ductile Ice Coast", lt: "Living Ceramics Oda Ductile Ice Coast" }, material_type: "Tiles", tier: "optimal", texture_prompt: "Ribbed tiles as subtle vertical accents of white stone texture", showroom_ids: ["linea"] },
  { technical_code: "marazzi-grande-marble-look-blue-grey",  name: { en: "Marazzi Grande Marble Look Blue Grey", lt: "Marazzi Grande Marble Look Blue Grey" }, material_type: "Tiles", tier: "optimal", texture_prompt: "Dark grey marble with dramatic, busy pattern",   showroom_ids: ["linea"] },
  { technical_code: "anthology-dark-natural",                name: { en: "Anthology Dark Natural", lt: "Anthology Dark Natural" },                 material_type: "Tiles", tier: "optimal", texture_prompt: "Dark grey stone with a mixed mineral pattern",                               showroom_ids: ["linea"] },
  { technical_code: "florim-onyx-silver-porphyry",           name: { en: "Florim Onyx Silver Porphyry", lt: "Florim Onyx Silver Porphyry" },       material_type: "Tiles", tier: "optimal", texture_prompt: "Dark taupe-grey natural stone texture with high variation",                showroom_ids: ["linea"] },
  { technical_code: "oda-classic-soft-textured",             name: { en: "Oda Classic Soft Textured", lt: "Oda Classic Soft Textured" },           material_type: "Tiles", tier: "optimal", texture_prompt: "Dark fossil limestone tiles with organic shell inclusions",                showroom_ids: ["linea"] },
  { technical_code: "atlas-marvel-nero-marquina",            name: { en: "Atlas Concorde Marvel Stone Nero Marquina", lt: "Atlas Concorde Marvel Stone Nero Marquina" }, material_type: "Tiles", tier: "optimal", texture_prompt: "Deep black marble tiles featuring white veining", showroom_ids: ["linea"] },
  { technical_code: "florim-sensi-lithos-white",             name: { en: "Soft White Tiles", lt: "Šviesios plytelės" },                           material_type: "Tiles", tier: "optimal", texture_prompt: "Soft off-white tiles with subtle texture, matte finish.",              showroom_ids: [] },

  // ─── ACCENTS & WALLS ──────────────────────────────────────────────────────
  { technical_code: "brushed-bronze",     name: { en: "Brushed Bronze", lt: "Šlifuota bronza" },             material_type: "Metal", tier: "optimal", texture_prompt: "Brushed bronze or muted brass texture", showroom_ids: ["impeka"] },
  { technical_code: "off-white-wall",     name: { en: "Off-White Wall Paint", lt: "Šilta balta sienų spalva" }, material_type: null, tier: "optimal", texture_prompt: "Warm off-white wall paint, matte finish.", showroom_ids: [] },
  { technical_code: "signal-white-paint", name: { en: "Signal White Paint", lt: "Signal balta spalva" },     material_type: null,    tier: "optimal", texture_prompt: "Neutral off-white wall paint, matte finish.", showroom_ids: [] },
  { technical_code: "aged-bronze",        name: { en: "Aged Bronze", lt: "Sedinta bronza" },                  material_type: null,    tier: "optimal", texture_prompt: "Plumbing fixtures", showroom_ids: [] },
  { technical_code: "chrome",             name: { en: "Chrome", lt: "Chromas" },                              material_type: null,    tier: "optimal", texture_prompt: "Chrome finish", showroom_ids: [] },
  { technical_code: "gold",               name: { en: "Gold", lt: "Auksas" },                                 material_type: null,    tier: "optimal", texture_prompt: "Gold finish", showroom_ids: [] },
  { technical_code: "wine-red",           name: { en: "Wine Red", lt: "Vyno raudona" },                       material_type: null,    tier: "optimal", texture_prompt: "Wine red finish", showroom_ids: [] },
];

async function run() {
  console.log(`Migrating ${MATERIALS.length} materials to Supabase…`);

  // Upsert in batches of 20
  const batchSize = 20;
  let upserted = 0;
  let errors = 0;

  for (let i = 0; i < MATERIALS.length; i += batchSize) {
    const batch = MATERIALS.slice(i, i + batchSize);

    const rows = batch.map((m) => ({
      technical_code: m.technical_code,
      name: m.name,
      material_type: m.material_type,
      tier: m.tier,
      texture_prompt: m.texture_prompt,
      showroom_ids: m.showroom_ids,
    }));

    const { error } = await (supabase as any)
      .from("materials")
      .upsert(rows, { onConflict: "technical_code", ignoreDuplicates: false });

    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error.message);
      errors += batch.length;
    } else {
      upserted += batch.length;
      console.log(`  ✓ Batch ${i / batchSize + 1}: ${batch.length} rows`);
    }
  }

  console.log(`\nDone. Upserted: ${upserted}, Errors: ${errors}`);
  if (errors > 0) process.exit(1);
}

run().catch((e) => { console.error(e); process.exit(1); });
