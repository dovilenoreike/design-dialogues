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

-- ════════════════════════════════════════════════════════════════════════════
-- RESCORED MATERIALS (update/floor/)
-- Only scores and image_url are changed. name/role/tier/material_type untouched.
-- ════════════════════════════════════════════════════════════════════════════

-- ── aspecta-almond ───────────────────────────────────────────────────────────
UPDATE materials SET
  texture        = 'wood',
  lightness      = 70,
  warmth         = 0.12,
  pattern        = 35,
  chroma         = 6,
  hue_angle      = 37,
  texture_prompt = 'Light warm sandy beige oak chevron, matte.',
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Aspecta/aspecta_almond.webp'
WHERE technical_code = 'aspecta-almond';

-- ── aspecta-baron ────────────────────────────────────────────────────────────
UPDATE materials SET
  texture        = 'wood',
  lightness      = 68,
  warmth         = 0.18,
  pattern        = 22,
  chroma         = 8,
  hue_angle      = 35,
  texture_prompt = 'Light warm natural oak planks, clear grain, matte.',
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Aspecta/aspecta_baron.webp'
WHERE technical_code = 'aspecta-baron';

-- ── aspecta-bolsena ──────────────────────────────────────────────────────────
UPDATE materials SET
  texture        = 'wood',
  lightness      = 58,
  warmth         = 0.03,
  pattern        = 38,
  chroma         = 5,
  hue_angle      = NULL,
  texture_prompt = 'Medium neutral grey oak chevron, matte.',
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Aspecta/aspecta_bolsena.webp'
WHERE technical_code = 'aspecta-bolsena';

-- ── aspecta-brienz ───────────────────────────────────────────────────────────
UPDATE materials SET
  texture        = 'wood',
  lightness      = 42,
  warmth         = 0.25,
  pattern        = 38,
  chroma         = 12,
  hue_angle      = 35,
  texture_prompt = 'Medium dark warm brown oak chevron, matte.',
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Aspecta/aspecta_brienz.webp'
WHERE technical_code = 'aspecta-brienz';

-- ── aspecta-burned ───────────────────────────────────────────────────────────
UPDATE materials SET
  texture        = 'wood',
  lightness      = 14,
  warmth         = 0.05,
  pattern        = 15,
  chroma         = 3,
  hue_angle      = NULL,
  texture_prompt = 'Very dark charcoal oak planks, subtle grain, matte.',
  image_url      = 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Aspecta/aspecta_burned.webp'
WHERE technical_code = 'aspecta-burned';
