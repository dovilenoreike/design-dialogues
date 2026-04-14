-- New materials: SM-art Reverso LMDP fronts
-- Upload images before running:
--   material-images/SM-art/  ← SM_art_RE* files
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
 3);
