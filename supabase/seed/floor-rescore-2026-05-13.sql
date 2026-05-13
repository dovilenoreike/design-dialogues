-- floor-rescore-2026-05-13.sql
-- BCGSC rescore for floor materials with scoring images in _scoring/floor/
-- After running: execute cluster-materials.ts --clusters --apply
--
-- ⚠ aspecta-almond is a new material — INSERT below, then run cluster script.
--   Verify image_url path once webp is converted and uploaded.

INSERT INTO materials (
  technical_code, name, role, texture, lightness, warmth, chroma, hue_angle, pattern,
  texture_prompt, image_url, showroom_ids, material_type, tier, layout_pattern,
  cluster_id, synonym_id
) VALUES (
  'aspecta-almond',
  '{"en": "Almond", "lt": "Almond"}',
  '{floor}',
  'wood',
  66.1, 0.27, 27, 38, 11,
  'wood',
  'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/flooring/Aspecta/aspecta_almond.webp',
  '{solido-grindys}',
  'Vinyl',
  'optimal',
  'plank',
  NULL, NULL
);

-- ── Aspecta ──────────────────────────────────────────────────────────────────

UPDATE materials SET
  lightness = 65.9, warmth = 0.16, chroma = 16.3, hue_angle = 37, pattern = 25, cluster_id = NULL
WHERE technical_code = 'aspecta-como';

UPDATE materials SET
  lightness = 54.1, warmth = 0.15, chroma = 15.2, hue_angle = 33, pattern = 22, cluster_id = NULL
WHERE technical_code = 'aspecta-constance';

UPDATE materials SET
  lightness = 20.9, warmth = 0.53, chroma = 53.1, hue_angle = 32, pattern = 40, cluster_id = NULL
WHERE technical_code = 'aspecta-maggiore';

UPDATE materials SET
  lightness = 44.9, warmth = 0.39, chroma = 39.2, hue_angle = 35, pattern = 18, cluster_id = NULL
WHERE technical_code = 'aspecta-pecan';

UPDATE materials SET
  lightness = 70, warmth = 0.3, chroma = 30.2, hue_angle = 37, pattern = 10, cluster_id = NULL
WHERE technical_code = 'aspecta-baron';

UPDATE materials SET
  lightness = 59.4, warmth = 0.24, chroma = 23.8, hue_angle = 35, pattern = 26, cluster_id = NULL
WHERE technical_code = 'aspecta-bolsena';

UPDATE materials SET
  lightness = 38.6, warmth = 0.44, chroma = 43.7, hue_angle = 31, pattern = 21, cluster_id = NULL
WHERE technical_code = 'aspecta-brienz';

UPDATE materials SET
  lightness = 19.3, warmth = 0.31, chroma = 30.9, hue_angle = 38, pattern = 42, cluster_id = NULL
WHERE technical_code = 'aspecta-burned';

UPDATE materials SET
  lightness = 51, warmth = 0.43, chroma = 42.9, hue_angle = 33, pattern = 40, cluster_id = NULL
WHERE technical_code = 'aspecta-macadamia';

-- ── Floorest ─────────────────────────────────────────────────────────────────

UPDATE materials SET
  lightness = 41.1, warmth = 0.31, chroma = 30.9, hue_angle = 33, pattern = 12, cluster_id = NULL
WHERE technical_code = 'floorest-lira';

UPDATE materials SET
  lightness = 45.3, warmth = 0.49, chroma = 48.8, hue_angle = 33, pattern = 9, cluster_id = NULL
WHERE technical_code = 'floorest-maren';

UPDATE materials SET
  lightness = 58.8, warmth = 0.34, chroma = 33.6, hue_angle = 34, pattern = 48, cluster_id = NULL
WHERE technical_code = 'floorest-mira';

UPDATE materials SET
  lightness = 35.1, warmth = 0.43, chroma = 42.9, hue_angle = 34, pattern = 14, cluster_id = NULL
WHERE technical_code = 'floorest-nora';

UPDATE materials SET
  lightness = 49.7, warmth = 0.36, chroma = 36.6, hue_angle = 34, pattern = 12, cluster_id = NULL
WHERE technical_code = 'floorest-orien';

UPDATE materials SET
  lightness = 57.5, warmth = 0.37, chroma = 37.7, hue_angle = 37, pattern = 11, cluster_id = NULL
WHERE technical_code = 'floorest-runa';

UPDATE materials SET
  lightness = 60.4, warmth = 0.41, chroma = 40.9, hue_angle = 35, pattern = 10, cluster_id = NULL
WHERE technical_code = 'floorest-silva';

-- ── Other ─────────────────────────────────────────────────────────────────────

UPDATE materials SET
  lightness = 63.7, warmth = 0.26, chroma = 25.7, hue_angle = 30, pattern = 14, cluster_id = NULL
WHERE technical_code = 'coretec-naturals-807-meadow';

UPDATE materials SET
  lightness = 63.1, warmth = 0.36, chroma = 36.2, hue_angle = 33, pattern = 9, cluster_id = NULL
WHERE technical_code = 'parador-oak-regent-natural';

UPDATE materials SET
  lightness = 66.4, warmth = 0.3, chroma = 30.2, hue_angle = 35, pattern = 17, cluster_id = NULL
WHERE technical_code = 'parador-oak-royal-light-limed';
