-- ════════════════════════════════════════════════════════════════════════════
-- New floor materials — 2026-05-11
-- Upload webp files to Supabase storage before running:
--   material-images/Invictus/  → invictus-maximus-highland-oak-42-chocolate.webp
--   material-images/Parador/   → parador-oak-oxford-dark-brown.webp
--                                 parador-oak-oxford-sanded.webp
--                                 parador-oak-regent-natural.webp
--                                 parador-oak-royal-light-limed.webp
-- Guidelines: supabase/seed/scoring-guidelines.md
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, chroma, hue_angle, texture_prompt, layout_pattern, image_url, showroom_ids, material_type, tier) VALUES

-- ── Invictus ──────────────────────────────────────────────────────────────────

(gen_random_uuid(), 'invictus-maximus-highland-oak-42-chocolate',
 '{"en":"Highland Oak 42 Chocolate","lt":"Highland Oak 42 Chocolate"}',
 ARRAY['floor'], 'wood', 35, 0.30, 32, 12, 30,
 'wood', 'herringbone',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/flooring/Invictus/invictus-maximus-highland-oak-42-chocolate.webp',
 ARRAY['magnus-grindys'], 'Vinyl', 'optimal'),

-- ── Parador ───────────────────────────────────────────────────────────────────

(gen_random_uuid(), 'parador-oak-oxford-dark-brown',
 '{"en":"Oak Oxford Dark Brown","lt":"Oak Oxford Dark Brown"}',
 ARRAY['floor'], 'wood', 20, 0.18, 16, 6, 30,
 'wood', 'chevron',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/flooring/Parador/parador-oak-oxford-dark-brown.webp',
 ARRAY['magnus-grindys'], 'Vinyl', 'optimal'),

(gen_random_uuid(), 'parador-oak-oxford-sanded',
 '{"en":"Oak Oxford Sanded","lt":"Oak Oxford Sanded"}',
 ARRAY['floor'], 'wood', 55, 0.08, 20, 7, 40,
 'wood', 'chevron',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/flooring/Parador/parador-oak-oxford-sanded.webp',
 ARRAY['magnus-grindys'], 'Vinyl', 'optimal'),

(gen_random_uuid(), 'parador-oak-regent-natural',
 '{"en":"Oak Regent Natural","lt":"Oak Regent Natural"}',
 ARRAY['floor'], 'wood', 52, 0.30, 26, 13, 37,
 'wood', 'plank',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/flooring/Parador/parador-oak-regent-natural.webp',
 ARRAY['magnus-grindys'], 'Vinyl', 'optimal'),

(gen_random_uuid(), 'parador-oak-royal-light-limed',
 '{"en":"Oak Royal Light Limed","lt":"Oak Royal Light Limed"}',
 ARRAY['floor'], 'wood', 60, 0.26, 30, 12, 38,
 'wood', 'plank',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/flooring/Parador/parador-oak-royal-light-limed.webp',
 ARRAY['magnus-grindys'], 'Vinyl', 'optimal');
