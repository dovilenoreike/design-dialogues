-- Generated 2026-06-04 by Claude Code
-- Sources: src/assets/new-materials/{front,worktop,update}/

-- ════════════════════════════════════════════════════════════════════════════
-- NEW MATERIALS (INSERT)
-- Review name.lt before running.
-- Upload webp files to Supabase Storage first.
-- ════════════════════════════════════════════════════════════════════════════

-- Upload paths:
--   material-images/Kronospan/kronospan-k2739-cannolo-cremona-oak.webp
--   material-images/Kronospan/kronospan-k695-sraw-primavera-oak.webp
--   material-images/Kronospan/kronospan-k749-babylon-slate.webp
--   material-images/SM-art/SM_art_S204_Warwick_SoHo.webp

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma, hue_angle) VALUES

-- kronospan-k2739-cannolo-cremona-oak — medium greige-washed oak, clear grain with knots
(gen_random_uuid(), 'kronospan-k2739-cannolo-cremona-oak',
 '{"en":"Cannolo Cremona Oak","lt":"Cannolo Cremona Oak"}',
 ARRAY['front'], 'wood', 62, 0.05, 30,
 'wood',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k2739-cannolo-cremona-oak.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 8, 35),

-- kronospan-k695-sraw-primavera-oak — light warm honey oak, fine straight grain
(gen_random_uuid(), 'kronospan-k695-sraw-primavera-oak',
 '{"en":"Sraw Primavera Oak","lt":"Sraw Primavera Oak"}',
 ARRAY['front'], 'wood', 72, 0.32, 20,
 'wood',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k695-sraw-primavera-oak.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 18, 35),

-- sm-art-s204-warwick-soho — very dark espresso oak, near-black warm brown, strong grain
(gen_random_uuid(), 'sm-art-s204-warwick-soho',
 '{"en":"Warwick SoHo","lt":"Warwick SoHo"}',
 ARRAY['front'], 'wood', 18, 0.20, 35,
 'wood',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_S204_Warwick_SoHo.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 10, 28),

-- kronospan-k749-babylon-slate — very light sandy cream stone, soft cloud-like movement
(gen_random_uuid(), 'kronospan-k749-babylon-slate',
 '{"en":"Babylon Slate","lt":"Babylon Slate"}',
 ARRAY['worktop'], 'stone', 82, 0.22, 40,
 'stone',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k749-babylon-slate.webp',
 ARRAY['trukme'], 'Compact HPL', 'optimal',
 6, 40);


-- ════════════════════════════════════════════════════════════════════════════
-- UPDATES (rescore from new images)
-- Upload webp files to Supabase Storage first.
-- ════════════════════════════════════════════════════════════════════════════

-- Upload paths:
--   material-images/Aspecta/aspecta-bolsena.webp
--   material-images/flooring/Invictus/invictus-maximus-highland-oak-42-chocolate.webp
--   material-images/SM-art/SM_art_RE02_Meriggio_Reverso.webp
--   material-images/SM-art/SM_art_S202_Spring_SoHo.webp
--   material-images/SM-art/SM_art_S203_Prince_SoHo.webp

-- aspecta-bolsena — medium greige chevron oak (new image)
UPDATE materials SET
  lightness      = 55,
  warmth         = 0.10,
  pattern        = 25,
  chroma         = 8,
  hue_angle      = 35,
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Aspecta/aspecta-bolsena.webp',
  cluster_id     = NULL
WHERE technical_code = 'aspecta-bolsena';

-- invictus-maximus-highland-oak-42-chocolate — rich warm chocolate herringbone oak (new image)
UPDATE materials SET
  lightness      = 38,
  warmth         = 0.35,
  pattern        = 25,
  chroma         = 14,
  hue_angle      = 30,
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/flooring/Invictus/invictus-maximus-highland-oak-42-chocolate.webp',
  cluster_id     = NULL
WHERE technical_code = 'invictus-maximus-highland-oak-42-chocolate';

-- sm-art-re02-meriggio-reverso — light warm sandy/camel fine woven textile (new image)
-- Previously lightness=60 — new image is clearly lighter (74)
UPDATE materials SET
  lightness      = 74,
  warmth         = 0.28,
  pattern        = 15,
  chroma         = 20,
  hue_angle      = 38,
  texture_prompt = 'textile',
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_RE02_Meriggio_Reverso.webp',
  cluster_id     = NULL
WHERE technical_code = 'sm-art-re02-meriggio-reverso';

-- sm-art-s202-spring-soho — medium warm greige-brown oak, strong vertical grain (new image)
UPDATE materials SET
  lightness      = 42,
  warmth         = 0.18,
  pattern        = 28,
  chroma         = 15,
  hue_angle      = 30,
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_S202_Spring_SoHo.webp',
  cluster_id     = NULL
WHERE technical_code = 'sm-art-s202-spring-soho';

-- sm-art-s203-prince-soho — dark warm brown-grey oak, strong vertical grain (new image)
-- Previously pattern=55 (likely noise) and hue_angle=16 (too reddish) — corrected from new image
UPDATE materials SET
  lightness      = 28,
  warmth         = 0.18,
  pattern        = 32,
  chroma         = 12,
  hue_angle      = 28,
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_S203_Prince_SoHo.webp',
  cluster_id     = NULL
WHERE technical_code = 'sm-art-s203-prince-soho';
