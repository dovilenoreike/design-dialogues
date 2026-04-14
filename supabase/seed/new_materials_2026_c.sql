-- New materials: SM-art Reverso LMDP fronts + Gentas HPL worktop + Kronospan & Skin & SM-art LMDP fronts
-- Upload images before running:
--   material-images/SM-art/    ← SM_art_RE* and SM_art_ME05_Piombo_Met files
--   material-images/Gentas/    ← gentas-5700-italian-stone.webp
--   material-images/Kronospan/ ← kronospan-k352-iron-flow.webp
--   material-images/Skin/      ← skin-D5456-Bronzo.jpg  (note: .jpg not .webp)
-- Column order: id, technical_code, name, role, texture,
--   lightness, warmth, pattern, texture_prompt, image_url, showroom_ids,
--   material_type, tier, chroma

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma) VALUES

-- ── SM-art Reverso LMDP fronts ──────────────────────────────────────────────

(gen_random_uuid(), 'sm-art-re02-meriggio-reverso',
 '{"en":"Meriggio Reverso","lt":"Meriggio Reverso"}',
 ARRAY['front'], 'fabric', 68, 0.35, 0,
 'Light warm beige-tan with fine woven fabric texture, subtle grid-like surface, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_RE02_Meriggio_Reverso-converted-from-jpg.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 5),

(gen_random_uuid(), 'sm-art-re05-notte-reverso',
 '{"en":"Notte Reverso","lt":"Notte Reverso"}',
 ARRAY['front'], 'fabric', 18, 0.20, 0,
 'Very dark warm brown-black with fine woven fabric texture, subtle grid-like surface, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_RE05_Notte_Reverso.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 3),

-- ── Gentas Compact HPL worktop ───────────────────────────────────────────────

(gen_random_uuid(), 'gentas-5700-italian-stone',
 '{"en":"Italian Stone","lt":"Italian Stone"}',
 ARRAY['worktop'], 'stone', 28, -0.05, 50,
 'Dark charcoal grey marble with bold irregular white veining and dramatic mottled movement, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gentas/gentas-5700-italian-stone.webp',
 ARRAY['trukme'], 'Compact HPL', 'premium',
 3),

-- ── Kronospan LMDP front ─────────────────────────────────────────────────────

(gen_random_uuid(), 'kronospan-k352-iron-flow',
 '{"en":"Iron Flow","lt":"Iron Flow"}',
 ARRAY['front'], 'metal', 50, 0.10, 30,
 'Medium warm grey with soft flowing vertical striations and subtle tonal variation, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k352-iron-flow.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 3),

-- ── Skin LMDP front ──────────────────────────────────────────────────────────

(gen_random_uuid(), 'skin-d5456-bronzo',
 '{"en":"Bronzo","lt":"Bronzo"}',
 ARRAY['front'], 'plain', 35, 0.30, 5,
 'Dark warm olive-bronze grey with subtle mottled variation and smooth leather-like surface, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Skin/skin-D5456-Bronzo.jpg',
 ARRAY['trukme'], 'LMDP', 'optimal',
 10),

-- ── SM-art LMDP front ────────────────────────────────────────────────────────
-- NOTE: sm-art-me05-riflesso already exists in new_materials_2026_b.sql — different material, unique code used here

(gen_random_uuid(), 'sm-art-me05-piombo-met',
 '{"en":"Piombo Met","lt":"Piombo Met"}',
 ARRAY['front'], 'metal', 22, -0.05, 5,
 'Very dark leaden charcoal with fine vertical brushed metal striations and subtle sheen, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_ME05_Piombo_Met.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 2);
