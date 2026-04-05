-- pair_compatibility seed — Phase 1
-- Derives all compatible pairs from collections-v2.ts:
-- every structural material (floor, worktop, front) that co-appears in the same
-- collection is treated as an approved pair.
-- Accents (chrome, gold, aged-bronze, wine-red) are excluded.
--
-- The CTE self-joins to produce all intra-collection pairs, applies LEAST/GREATEST
-- for canonical (material_a < material_b) ordering, then deduplicates across
-- collections before inserting.
--
-- ON CONFLICT DO NOTHING is safe to re-run.
-- Run materials_seed.sql first.

WITH collection_materials (col_id, code) AS (
  VALUES
    -- 1. Cashmere Morning
    ('cashmere-morning', 'solido-bolsena'),
    ('cashmere-morning', 'solido-pearl'),
    ('cashmere-morning', 'icono-arabesca-marmo'),
    ('cashmere-morning', 'icono-picasso-marrone'),
    ('cashmere-morning', 'velvet-7393'),
    ('cashmere-morning', 'alvic-goya-02'),
    ('cashmere-morning', 'alvi-goya-03-na'),
    ('cashmere-morning', 'alvic-goya-01'),

    -- 2. Chili & Pepper
    ('chili-and-pepper', 'solido-bolsena'),
    ('chili-and-pepper', 'aspecta-maggiore'),
    ('chili-and-pepper', 'solido-pearl'),
    ('chili-and-pepper', 'fondi-32-vento-marmo'),
    ('chili-and-pepper', 'alvi-goya-03-na'),
    ('chili-and-pepper', 'off-white-matte'),

    -- 3. Urban Dusk
    ('urban-dusk', 'solido-bolsena'),
    ('urban-dusk', 'aspecta-brienz'),
    ('urban-dusk', 'solido-pearl'),
    ('urban-dusk', 'icono-marquina-cava'),
    ('urban-dusk', 'icono-sereno-noto'),
    ('urban-dusk', 'egger-brown-casella-oak'),
    ('urban-dusk', 'skin-carbon-fumo'),
    ('urban-dusk', 'velvet-1551'),
    ('urban-dusk', 'pearl-7901'),

    -- 4. Fog in the Forest
    ('fog-in-the-forest', 'constance-chevrone'),
    ('fog-in-the-forest', 'solido-pearl'),
    ('fog-in-the-forest', 'egger-f244-st76'),
    ('fog-in-the-forest', 'egger-dark-grey-fineline'),
    ('fog-in-the-forest', 'velvet-3301'),
    ('fog-in-the-forest', 'egger-medium-grey-fineline'),

    -- 5. Spicy Nord
    ('spicy-nord', 'aspecta-baron'),
    ('spicy-nord', 'florim-sensi-lithos-white'),
    ('spicy-nord', 'fondi-32-vento-marmo'),
    ('spicy-nord', 'egger-cremona-marble'),
    ('spicy-nord', 'egger-premium-white-worktop'),
    ('spicy-nord', 'velvet-1648'),
    ('spicy-nord', 'alvic-valazquez-04'),

    -- 6. Chocolate Wabi-Sabi
    ('chocolate-wabi-sabi', 'aspecta-brienz'),
    ('chocolate-wabi-sabi', 'solido-bolsena'),
    ('chocolate-wabi-sabi', 'solido-pearl'),
    ('chocolate-wabi-sabi', 'icono-arabesca-marmo'),
    ('chocolate-wabi-sabi', 'fondi-32-vento-marmo'),
    ('chocolate-wabi-sabi', 'icono-picasso-marrone'),
    ('chocolate-wabi-sabi', 'egger-brown-casella-oak'),
    ('chocolate-wabi-sabi', 'velvet-7393'),
    ('chocolate-wabi-sabi', 'velvet-1302'),

    -- 7. Day by the Sea
    ('day-by-the-sea', 'aspecta-baron'),
    ('day-by-the-sea', 'florim-sensi-lithos-white'),
    ('day-by-the-sea', 'icono-c43-eleganza-bianco'),
    ('day-by-the-sea', 'velvet-4246'),
    ('day-by-the-sea', 'egger-taupe-grey'),
    ('day-by-the-sea', 'egger-light-natural-casella-oak'),

    -- 8. Behind the Lights
    ('behind-the-lights', '525-calisson-oak'),
    ('behind-the-lights', 'florim-sensi-lithos-white'),
    ('behind-the-lights', 'fondi-40-peperino-marmo'),
    ('behind-the-lights', 'icono-marquina-cava'),
    ('behind-the-lights', 'valchromat-black'),
    ('behind-the-lights', 'egger-natural-casella-oak'),
    ('behind-the-lights', 'velvet-5983'),

    -- 9. Urban Night
    ('urban-night', 'aspecta-burned'),
    ('urban-night', 'solido-pearl'),
    ('urban-night', 'icono-laurent-carrata'),
    ('urban-night', 'icono-picasso-marrone'),
    ('urban-night', 'valchromat-black'),
    ('urban-night', 'egger-dark-brown-eucalypthus'),
    ('urban-night', 'pearl-7901')
),

-- Resolve technical_code → uuid
resolved (col_id, mat_id) AS (
  SELECT cm.col_id, m.id
  FROM collection_materials cm
  JOIN materials m ON m.technical_code = cm.code
),

-- All intra-collection pairs with canonical ordering
all_pairs AS (
  SELECT DISTINCT
    LEAST(a.mat_id, b.mat_id)    AS material_a,
    GREATEST(a.mat_id, b.mat_id) AS material_b
  FROM resolved a
  JOIN resolved b ON a.col_id = b.col_id AND a.mat_id <> b.mat_id
)

INSERT INTO pair_compatibility (material_a, material_b, approved_by, notes)
SELECT
  material_a,
  material_b,
  'collections-v2-seed',
  'Auto-derived: co-appear in the same collections-v2.ts collection'
FROM all_pairs
ON CONFLICT (material_a, material_b) DO NOTHING;
