-- Draft generated 2026-04-17 by Claude Code

-- ════════════════════════════════════════════════════════════════════════════
-- NEW MATERIALS
-- Review scores, adjust name.lt if needed.
-- Column order: id, technical_code, name, role, texture,
--   lightness, warmth, pattern, texture_prompt, image_url, showroom_ids,
--   material_type, tier, chroma, hue_angle
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma, hue_angle) VALUES

-- ── Aspecta / floor ──────────────────────────────────────────────────────────
(gen_random_uuid(), 'aspecta-champagne',
 '{"en":"Champagne","lt":"Champagne"}',
 ARRAY['floor'], 'stone', 78, 0.08, 8,
 'Light warm beige stone, subtle mottled, matte.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Aspecta/aspecta_champagne.webp',
 ARRAY['solido-grindys'], 'Vinyl', 'optimal',
 4, NULL),

-- ── Floorest / floor ─────────────────────────────────────────────────────────
(gen_random_uuid(), 'floorest-lira',
 '{"en":"Lira","lt":"Lira"}',
 ARRAY['floor'], 'wood', 22, 0.15, 30,
 'Very dark warm olive-brown oak chevron, matte.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Floorest/floorest_lira.webp',
 ARRAY['solido-grindys'], 'Vinyl', 'optimal',
 8, 55),

(gen_random_uuid(), 'floorest-mira',
 '{"en":"Mira","lt":"Mira"}',
 ARRAY['floor'], 'wood', 68, 0.15, 38,
 'Light warm sandy beige oak herringbone, matte.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Floorest/floorest_mira.webp',
 ARRAY['solido-grindys'], 'Vinyl', 'optimal',
 7, 38),

(gen_random_uuid(), 'floorest-nora',
 '{"en":"Nora","lt":"Nora"}',
 ARRAY['floor'], 'wood', 20, 0.10, 30,
 'Very dark brown-olive oak chevron, matte.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Floorest/floorest_nora.webp',
 ARRAY['solido-grindys'], 'Vinyl', 'optimal',
 7, 52),

(gen_random_uuid(), 'floorest-orien',
 '{"en":"Orien","lt":"Orien"}',
 ARRAY['floor'], 'wood', 52, 0.12, 38,
 'Medium warm taupe-grey oak herringbone, matte.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Floorest/floorest_orien.webp',
 ARRAY['solido-grindys'], 'Vinyl', 'optimal',
 6, 40),

(gen_random_uuid(), 'floorest-runa',
 '{"en":"Runa","lt":"Runa"}',
 ARRAY['floor'], 'wood', 62, 0.22, 38,
 'Light warm golden beige oak chevron, matte.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Floorest/floorest_runa.webp',
 ARRAY['solido-grindys'], 'Vinyl', 'optimal',
 9, 36),

(gen_random_uuid(), 'floorest-silva',
 '{"en":"Silva","lt":"Silva"}',
 ARRAY['floor'], 'wood', 63, 0.18, 35,
 'Light warm natural beige oak chevron, matte.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Floorest/floorest_silva.webp',
 ARRAY['solido-grindys'], 'Vinyl', 'optimal',
 8, 37);

-- Aspecta rescores + new materials moved to: supabase/seed/aspecta_2026-05-11.sql


-- ════════════════════════════════════════════════════════════════════════════
-- NEW MATERIALS — 2026-05-04
-- Upload webp files to: material-images/SM-art/
-- ⚠️  w-core-9684-urban: unknown brand/showroom — verify before running
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma, hue_angle) VALUES

-- ── SM-art Atom plain fronts ──────────────────────────────────────────────────

(gen_random_uuid(), 'sm-art-0010-caolino-atom',
 '{"en":"Caolino Atom","lt":"Caolino Atom"}',
 ARRAY['front'], 'plain', 88, 0.08, 0,
 'Very light warm off-white plain surface, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_0010_Caolino_Atom.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 4, NULL),

(gen_random_uuid(), 'sm-art-0014-gobi-atom',
 '{"en":"Gobi Atom","lt":"Gobi Atom"}',
 ARRAY['front'], 'plain', 72, -0.02, 0,
 'Light neutral grey-beige plain surface, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_0014_Gobi_Atom.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 5, NULL),

(gen_random_uuid(), 'sm-art-3096-bianco-atom',
 '{"en":"Bianco Atom","lt":"Bianco Atom"}',
 ARRAY['front'], 'plain', 96, 0.0, 0,
 'Near pure white plain surface, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_3096_Bianco_Atom.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 2, NULL),

-- ── SM-art Intagli / SoHo wood fronts ────────────────────────────────────────

(gen_random_uuid(), 'sm-art-3190-nero-intagli',
 '{"en":"Nero Intagli","lt":"Nero Intagli"}',
 ARRAY['front'], 'wood', 5, -0.05, 25,
 'Very dark near-black wood with clear vertical grain, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_3190_Nero_Intagli.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 3, NULL),

(gen_random_uuid(), 'sm-art-s201-grand-soho',
 '{"en":"Grand SoHo","lt":"Grand SoHo"}',
 ARRAY['front'], 'wood', 68, 0.10, 28,
 'Light sandy warm oak with clear vertical grain, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_S201_Grand_SoHo.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 8, 35),

-- ── w-core (unknown brand — verify showroom_ids and role before running) ──────

(gen_random_uuid(), 'w-core-9684-urban',
 '{"en":"Urban","lt":"Urban"}',
 ARRAY['front'], 'wood', 8, 0.05, 30,
 'Very dark warm espresso wood with broad vertical stripe grain, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/W-core/w-core-9684-urban.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 5, 30);




-- ════════════════════════════════════════════════════════════════════════════
-- NEW MATERIAL — 2026-05-04
-- Upload to: material-images/Skin/
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma, hue_angle) VALUES

(gen_random_uuid(), 'skin-2451-carbon-fumo',
 '{"en":"Carbon Fumo","lt":"Carbon Fumo"}',
 ARRAY['front'], 'wood', 8, 0.0, 22,
 'Very dark charcoal wood with clear vertical grain, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Skin/skin-2451-carbon-fumo.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 3, NULL);


-- ════════════════════════════════════════════════════════════════════════════
-- NEW MATERIALS — 2026-05-08
-- Gentas worktop + SM-art fronts (trukme) + Artile tiles
-- Upload webp files to:
--   material-images/Gentas/      → gentas-5818-lorreto-Italian Stone.webp
--                                   ⚠️  space in filename — rename to
--                                   gentas-5818-lorreto-italian-stone.webp before upload
--   material-images/SM-art/      → SM_art_N002_Mercurio_Nirvana_development.webp
--                                   sm-art-3190-annapurna-nero.webp
--   material-images/Bari/        → bari-harmony-white.webp
--   material-images/Bottega/     → bottega-lithoteke-selce.webp
--   material-images/Dune/        → dune-Kit-Kat-Noche.webp
--   material-images/Fondovalle/  → fondovalle-royal-travertino-ebur-cross.webp
--   material-images/Midtown/     → Midtown-Pearl.webp
--   material-images/Peronda/     → PERONDA-FS-VENECIA.webp
--   material-images/Rondine/     → rondine-angers-white.webp
--   material-images/Vitacer/     → vitacer-bannau-natural.webp
--                                   vitacer-bannau-stone.webp
--                                   vitacer-missouri-light.webp
--   material-images/Borneo/      → BORNEO-PEARL.webp
-- ⚠️  'artile' showroom not yet in showrooms.ts — add before using in prod
-- ════════════════════════════════════════════════════════════════════════════

-- ── Gentas / worktop ─────────────────────────────────────────────────────────

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma, hue_angle) VALUES

(gen_random_uuid(), 'gentas-5818-lorreto-italian-stone',
 '{"en":"Lorreto Italian Stone","lt":"Lorreto Italian Stone"}',
 ARRAY['worktop'], 'stone', 75, 0.05, 55,
 'Light warm-grey marble-stone, swirling veining, matte.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gentas/gentas-5818-lorreto-italian-stone.webp',
 ARRAY['trukme'], 'Compact HPL', 'optimal',
 3, NULL);

-- ── SM-art / fronts ──────────────────────────────────────────────────────────

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma, hue_angle) VALUES

(gen_random_uuid(), 'sm-art-n002-mercurio-nirvana',
 '{"en":"Mercurio Nirvana","lt":"Mercurio Nirvana"}',
 ARRAY['front'], 'concrete', 88, 0.00, 15,
 'Very light cool-grey plaster-effect matte surface, subtle mottled.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_N002_Mercurio_Nirvana_development.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 2, NULL),

(gen_random_uuid(), 'sm-art-3190-annapurna-nero',
 '{"en":"Annapurna Nero","lt":"Annapurna Nero"}',
 ARRAY['front'], 'stone', 12, -0.05, 25,
 'Near-black dark stone-effect matte surface, subtle mottled texture.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/sm-art-3190-annapurna-nero.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 2, NULL);

-- ── Artile tiles ─────────────────────────────────────────────────────────────

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma, hue_angle) VALUES

(gen_random_uuid(), 'bari-harmony-white',
 '{"en":"Harmony White","lt":"Harmony White"}',
 ARRAY['tile'], 'ceramic', 92, 0.05, 30,
 'Near-white glossy elongated ceramic tile, subtle gloss variation.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Bari/bari-harmony-white.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 2, NULL),

(gen_random_uuid(), 'bottega-lithoteke-selce',
 '{"en":"Lithoteke Selce","lt":"Lithoteke Selce"}',
 ARRAY['tile'], 'stone', 82, 0.12, 45,
 'Light warm cream stone tile, organic natural veining.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Bottega/bottega-lithoteke-selce.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 4, 40),

(gen_random_uuid(), 'dune-kit-kat-noche',
 '{"en":"Kit Kat Noche","lt":"Kit Kat Noche"}',
 ARRAY['tile'], 'ceramic', 10, -0.05, 35,
 'Near-black glossy narrow kit-kat ceramic tile, elongated strips.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Dune/dune-Kit-Kat-Noche.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 2, NULL),

(gen_random_uuid(), 'fondovalle-royal-travertino-ebur-cross',
 '{"en":"Royal Travertino Ebur Cross","lt":"Royal Travertino Ebur Cross"}',
 ARRAY['tile'], 'stone', 88, 0.12, 35,
 'Very light warm cream travertine tile, subtle cross-cut veining.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Fondovalle/fondovalle-royal-travertino-ebur-cross.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 4, 40),

(gen_random_uuid(), 'midtown-pearl',
 '{"en":"Pearl","lt":"Pearl"}',
 ARRAY['tile'], 'stone', 84, -0.05, 20,
 'Light cool grey matte stone tile, subtle mottled concrete effect.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Midtown/Midtown-Pearl.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 2, NULL),

(gen_random_uuid(), 'peronda-fs-venecia',
 '{"en":"FS Venecia","lt":"FS Venecia"}',
 ARRAY['tile'], 'stone', 65, 0.05, 70,
 'Medium grey terrazzo tile with multicolour aggregate speckles.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Peronda/PERONDA-FS-VENECIA.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 12, 20),

(gen_random_uuid(), 'rondine-angers-white',
 '{"en":"Angers White","lt":"Angers White"}',
 ARRAY['tile'], 'stone', 90, 0.08, 40,
 'Very light warm white stone tile, gentle marble veining.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Rondine/rondine-angers-white.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 3, NULL),

(gen_random_uuid(), 'vitacer-bannau-natural',
 '{"en":"Bannau Natural","lt":"Bannau Natural"}',
 ARRAY['tile'], 'stone', 52, 0.08, 55,
 'Medium warm grey-brown quartzite tile, clear slate grain.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Vitacer/vitacer-bannau-natural.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 6, 40),

(gen_random_uuid(), 'vitacer-bannau-stone',
 '{"en":"Bannau Stone","lt":"Bannau Stone"}',
 ARRAY['tile'], 'stone', 45, 0.10, 55,
 'Medium-dark warm brown quartzite tile, clear slate grain.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Vitacer/vitacer-bannau-stone.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 7, 35),

(gen_random_uuid(), 'vitacer-missouri-light',
 '{"en":"Missouri Light","lt":"Missouri Light"}',
 ARRAY['tile'], 'stone', 80, -0.05, 15,
 'Light cool grey matte tile, very subtle mottled surface.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Vitacer/vitacer-missouri-light.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 2, NULL),

(gen_random_uuid(), 'borneo-pearl',
 '{"en":"Pearl","lt":"Pearl"}',
 ARRAY['tile'], 'stone', 82, -0.05, 12,
 'Light cool grey matte stone tile, fine pore surface, minimal texture.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Borneo/BORNEO-PEARL.webp',
 ARRAY['artile'], 'Tiles', 'optimal',
 2, NULL);




-- Draft generated 2026-05-18 by scripts/process-new-materials.ts

-- ════════════════════════════════════════════════════════════════════════════
-- NEW MATERIALS
-- Review scores, adjust name.lt translations if needed.
-- Column order: id, technical_code, name, role, texture,
--   lightness, warmth, pattern, texture_prompt, image_url, showroom_ids,
--   material_type, tier, chroma, hue_angle
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma, hue_angle) VALUES

-- ── Skin / front ──────────────────────────────────────────────
(gen_random_uuid(), 'skin-5450-lava',
 '{"en":"Lava","lt":"Lava"}',
 ARRAY['front'], 'plain', 12, 0.08, 8,
 'Dark near-black warm brown, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Skin/skin-5450-lava.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 6, 28);

-- ════════════════════════════════════════════════════════════════════════════
-- RESCORED MATERIALS (update/)
-- Only scores and image_url are changed. name/role/tier/material_type untouched.
-- ════════════════════════════════════════════════════════════════════════════

-- ── skin-d5456-bronzo ──────────────────────────────────────────────
UPDATE materials SET
  texture        = 'plain',
  lightness      = 35,
  warmth         = 0.12,
  pattern        = 8,
  chroma         = 7,
  hue_angle      = 32,
  texture_prompt = 'Medium-dark greige, subtle warm brown cast, matte finish.',
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Skin/skin-d5456-bronzo.webp'
WHERE technical_code = 'skin-d5456-bronzo';
