-- Kronospan cabinet front materials (LMDP)
-- Upload WebP files to: material-images/Kronospan/ in Supabase storage before running this.
-- Column order: id, technical_code, name, role, texture,
--   lightness, warmth, pattern, texture_prompt, image_url, showroom_ids,
--   material_type, tier, description, chroma

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, description, chroma) VALUES


-- ── Kronospan plain colour fronts ───────────────────────────────────────────

(gen_random_uuid(), 'kronospan-k5994-alby-blue',
 '{"en":"Alby Blue","lt":"Alby mėlynas"}',
 ARRAY['front'], 'plain', 40, -0.7, 5,
 'Blue matte surface, smooth and uniform.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k5994-alby-blue.webp',
 ARRAY['trukme'], 'LMDP', 'budget',
 '{"en":"Pure flat blue, smooth uniform matte surface.","lt":"Mėlyna matinė lygi plokštė."}',
 70),

(gen_random_uuid(), 'kronospan-k8685-snow-white',
 '{"en":"Snow White","lt":"Sniego balta"}',
 ARRAY['front'], 'plain', 97, 0.0, 5,
 'Pure flat white matte surface, smooth and uniform.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k8685-snow-white.webp',
 ARRAY['trukme'], 'LMDP', 'budget',
 '{"en":"Pure flat white, smooth uniform matte surface.","lt":"Gryna balta matinė lygi plokštė."}',
 0),

(gen_random_uuid(), 'kronospan-k5981-cashmere',
 '{"en":"Cashmere","lt":"Kašmyras"}',
 ARRAY['front'], 'plain', 68, -0.05, 5,
 'Flat cool greige matte surface, smooth and uniform.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k5981-cashmere.webp',
 ARRAY['trukme'], 'LMDP', 'budget',
 '{"en":"Flat cool greige, smooth uniform matte surface.","lt":"Lygi vėsiai greige matinė plokštė."}',
 5),

(gen_random_uuid(), 'kronospan-k681-macadamia',
 '{"en":"Macadamia","lt":"Makadamija"}',
 ARRAY['front'], 'plain', 72, 0.10, 5,
 'Flat warm beige matte surface, smooth and uniform.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k681-macadamia.webp',
 ARRAY['trukme'], 'LMDP', 'budget',
 '{"en":"Flat warm beige, smooth uniform matte surface.","lt":"Lygi šilta bežinė matinė plokštė."}',
 8),

(gen_random_uuid(), 'kronospan-k7045-satin',
 '{"en":"Satin","lt":"Satinas"}',
 ARRAY['front'], 'plain', 78, 0.15, 5,
 'Flat warm cream matte surface with soft pinkish-beige undertone, smooth and uniform.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k7045-satin.webp',
 ARRAY['trukme'], 'LMDP', 'budget',
 '{"en":"Flat warm cream with soft pinkish-beige undertone, smooth matte surface.","lt":"Lygi šilta kreminė matinė plokštė su rožiniu atspalviu."}',
 8),

-- ── Kronospan stone-effect front ─────────────────────────────────────────────
(gen_random_uuid(), 'kronospan-k367-cream-navona',
 '{"en":"Cream Navona","lt":"Cream Navona"}',
 ARRAY['worktop'], 'stone', 82, 0.15, 55,
 'Light warm beige marble-effect panel with soft grey-white veining, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k367-cream-navona.webp',
 ARRAY['trukme'], 'LMDP', 'budget',
 '{"en":"Light warm beige marble-effect with soft grey-white veining.","lt":"Šviesi šilta bežinė marmuro imitacija su subtiliomis pilkšvai baltomis gyslelėmis."}',
 10);
