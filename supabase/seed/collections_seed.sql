-- Collections seed for Phase 1
-- Inserts all 9 collections from collections-v2.ts into collections_v3.
-- UUIDs are resolved via subselects on technical_code.
--
-- floor_id / worktop_id: one representative product per slot (first/primary option).
-- front_ids: all front products for the collection.
-- tile_ids: empty for all collections (tiles not used in v2).
-- Accent materials are seeded in materials but not FK-linked to collections
-- (the schema stores front_ids/tile_ids only).
--
-- Run materials_seed.sql before this file.

-- 1. Cashmere Morning
INSERT INTO collections_v3 (id, name, designer, vibe, floor_id, worktop_id, front_ids, tile_ids)
SELECT
  'cashmere-morning',
  '{"en":"Cashmere Morning","lt":"Kašmyro rytas"}',
  'dizaino_dialogai',
  'light-and-airy',
  (SELECT id FROM materials WHERE technical_code = 'solido-bolsena'),
  (SELECT id FROM materials WHERE technical_code = 'icono-arabesca-marmo'),
  ARRAY[
    (SELECT id FROM materials WHERE technical_code = 'velvet-7393'),
    (SELECT id FROM materials WHERE technical_code = 'alvic-goya-02'),
    (SELECT id FROM materials WHERE technical_code = 'alvi-goya-03-na'),
    (SELECT id FROM materials WHERE technical_code = 'alvic-goya-01')
  ]::uuid[],
  ARRAY[]::uuid[];

-- 2. Chili & Pepper
INSERT INTO collections_v3 (id, name, designer, vibe, floor_id, worktop_id, front_ids, tile_ids)
SELECT
  'chili-and-pepper',
  '{"en":"Chili & Pepper","lt":"Čilis ir pipiras"}',
  'dizaino_dialogai',
  'bold-and-moody',
  (SELECT id FROM materials WHERE technical_code = 'solido-bolsena'),
  (SELECT id FROM materials WHERE technical_code = 'fondi-32-vento-marmo'),
  ARRAY[
    (SELECT id FROM materials WHERE technical_code = 'alvi-goya-03-na'),
    (SELECT id FROM materials WHERE technical_code = 'off-white-matte')
  ]::uuid[],
  ARRAY[]::uuid[];

-- 3. Urban Dusk
INSERT INTO collections_v3 (id, name, designer, vibe, floor_id, worktop_id, front_ids, tile_ids)
SELECT
  'urban-dusk',
  '{"en":"Urban Dusk","lt":"Miesto prieblanda"}',
  'dizaino_dialogai',
  'bold-and-moody',
  (SELECT id FROM materials WHERE technical_code = 'solido-bolsena'),
  (SELECT id FROM materials WHERE technical_code = 'icono-marquina-cava'),
  ARRAY[
    (SELECT id FROM materials WHERE technical_code = 'egger-brown-casella-oak'),
    (SELECT id FROM materials WHERE technical_code = 'skin-carbon-fumo'),
    (SELECT id FROM materials WHERE technical_code = 'velvet-1551'),
    (SELECT id FROM materials WHERE technical_code = 'pearl-7901')
  ]::uuid[],
  ARRAY[]::uuid[];

-- 4. Fog in the Forest
INSERT INTO collections_v3 (id, name, designer, vibe, floor_id, worktop_id, front_ids, tile_ids)
SELECT
  'fog-in-the-forest',
  '{"en":"Fog in the Forest","lt":"Rūkas miške"}',
  'athena_blackbird',
  'bold-and-moody',
  (SELECT id FROM materials WHERE technical_code = 'constance-chevrone'),
  (SELECT id FROM materials WHERE technical_code = 'egger-f244-st76'),
  ARRAY[
    (SELECT id FROM materials WHERE technical_code = 'egger-dark-grey-fineline'),
    (SELECT id FROM materials WHERE technical_code = 'velvet-3301'),
    (SELECT id FROM materials WHERE technical_code = 'egger-medium-grey-fineline')
  ]::uuid[],
  ARRAY[]::uuid[];

-- 5. Spicy Nord
INSERT INTO collections_v3 (id, name, designer, vibe, floor_id, worktop_id, front_ids, tile_ids)
SELECT
  'spicy-nord',
  '{"en":"Spicy Nord","lt":"Charakteringa Šiaurė"}',
  'dizaino_dialogai',
  'warm-and-grounded',
  (SELECT id FROM materials WHERE technical_code = 'aspecta-baron'),
  (SELECT id FROM materials WHERE technical_code = 'fondi-32-vento-marmo'),
  ARRAY[
    (SELECT id FROM materials WHERE technical_code = 'velvet-1648'),
    (SELECT id FROM materials WHERE technical_code = 'alvic-valazquez-04')
  ]::uuid[],
  ARRAY[]::uuid[];

-- 6. Chocolate Wabi-Sabi
INSERT INTO collections_v3 (id, name, designer, vibe, floor_id, worktop_id, front_ids, tile_ids)
SELECT
  'chocolate-wabi-sabi',
  '{"en":"Chocolate Wabi-Sabi","lt":"Wabi-Sabi Šokolade"}',
  'dizaino_dialogai',
  'warm-and-grounded',
  (SELECT id FROM materials WHERE technical_code = 'aspecta-brienz'),
  (SELECT id FROM materials WHERE technical_code = 'icono-arabesca-marmo'),
  ARRAY[
    (SELECT id FROM materials WHERE technical_code = 'egger-brown-casella-oak'),
    (SELECT id FROM materials WHERE technical_code = 'velvet-7393'),
    (SELECT id FROM materials WHERE technical_code = 'velvet-1302')
  ]::uuid[],
  ARRAY[]::uuid[];

-- 7. Day by the Sea
INSERT INTO collections_v3 (id, name, designer, vibe, floor_id, worktop_id, front_ids, tile_ids)
SELECT
  'day-by-the-sea',
  '{"en":"Day by the Sea","lt":"Diena prie jūros"}',
  'heya_studio',
  'light-and-airy',
  (SELECT id FROM materials WHERE technical_code = 'aspecta-baron'),
  (SELECT id FROM materials WHERE technical_code = 'icono-c43-eleganza-bianco'),
  ARRAY[
    (SELECT id FROM materials WHERE technical_code = 'velvet-4246'),
    (SELECT id FROM materials WHERE technical_code = 'egger-taupe-grey'),
    (SELECT id FROM materials WHERE technical_code = 'egger-light-natural-casella-oak')
  ]::uuid[],
  ARRAY[]::uuid[];

-- 8. Behind the Lights
INSERT INTO collections_v3 (id, name, designer, vibe, floor_id, worktop_id, front_ids, tile_ids)
SELECT
  'behind-the-lights',
  '{"en":"Behind the Lights","lt":"Šviesų užkulisiai"}',
  'impeka',
  'bold-and-moody',
  (SELECT id FROM materials WHERE technical_code = '525-calisson-oak'),
  (SELECT id FROM materials WHERE technical_code = 'fondi-40-peperino-marmo'),
  ARRAY[
    (SELECT id FROM materials WHERE technical_code = 'valchromat-black'),
    (SELECT id FROM materials WHERE technical_code = 'egger-natural-casella-oak'),
    (SELECT id FROM materials WHERE technical_code = 'velvet-5983')
  ]::uuid[],
  ARRAY[]::uuid[];

-- 9. Urban Night
INSERT INTO collections_v3 (id, name, designer, vibe, floor_id, worktop_id, front_ids, tile_ids)
SELECT
  'urban-night',
  '{"en":"Urban Night","lt":"Miesto naktis"}',
  'dizaino_dialogai',
  'bold-and-moody',
  (SELECT id FROM materials WHERE technical_code = 'aspecta-burned'),
  (SELECT id FROM materials WHERE technical_code = 'icono-laurent-carrata'),
  ARRAY[
    (SELECT id FROM materials WHERE technical_code = 'valchromat-black'),
    (SELECT id FROM materials WHERE technical_code = 'egger-dark-brown-eucalypthus'),
    (SELECT id FROM materials WHERE technical_code = 'pearl-7901')
  ]::uuid[],
  ARRAY[]::uuid[];
