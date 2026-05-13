-- ════════════════════════════════════════════════════════════════════════════
-- Flooring colour rescore — 2026-05-12 (local k-means)
-- Updates: lightness, warmth, chroma, hue_angle, pattern, cluster_id = NULL
-- Covers: 1000grindu, Aspecta, Coretec, Floorest, Invictus, Parador
-- NOTE: chroma values are significantly higher than previous manual estimates —
--   local k-means measures actual HSV saturation (~25–54 range for wood grain)
--   vs old manual scores (~6–13). Review if needed before running.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1000 Grindų ───────────────────────────────────────────────────────────────

-- 1000grindu-texas-oak — medium warm golden-brown oak plank
UPDATE materials SET
  lightness  = 57,
  warmth     = 0.31,
  chroma     = 31,
  hue_angle  = 35,
  pattern    = 27,
  cluster_id = NULL
WHERE technical_code = '1000grindu-texas-oak';

-- ── Aspecta ───────────────────────────────────────────────────────────────────

-- aspecta-almond — light warm sandy-beige chevron oak
UPDATE materials SET
  lightness  = 66,
  warmth     = 0.27,
  chroma     = 27,
  hue_angle  = 39,
  pattern    = 18,
  cluster_id = NULL
WHERE technical_code = 'aspecta-almond';

-- aspecta-baron — light warm natural oak plank, prominent knots
UPDATE materials SET
  lightness  = 70,
  warmth     = 0.30,
  chroma     = 30,
  hue_angle  = 36,
  pattern    = 13,
  cluster_id = NULL
WHERE technical_code = 'aspecta-baron';

-- aspecta-bolsena — medium greige chevron oak
UPDATE materials SET
  lightness  = 60,
  warmth     = 0.24,
  chroma     = 24,
  hue_angle  = 34,
  pattern    = 29,
  cluster_id = NULL
WHERE technical_code = 'aspecta-bolsena';

-- aspecta-brienz — medium-dark warm brown chevron oak
UPDATE materials SET
  lightness  = 39,
  warmth     = 0.43,
  chroma     = 43,
  hue_angle  = 33,
  pattern    = 24,
  cluster_id = NULL
WHERE technical_code = 'aspecta-brienz';

-- aspecta-burned — very dark near-black oak plank
-- k-means picks up warm grain; chroma/hue_angle now non-null (HSV-S ~31%)
UPDATE materials SET
  lightness  = 20,
  warmth     = 0.31,
  chroma     = 32,
  hue_angle  = 37,
  pattern    = 26,
  cluster_id = NULL
WHERE technical_code = 'aspecta-burned';

-- aspecta-como — very light sandy-greige chevron oak
UPDATE materials SET
  lightness  = 66,
  warmth     = 0.16,
  chroma     = 16,
  hue_angle  = 37,
  pattern    = 25,
  cluster_id = NULL
WHERE technical_code = 'aspecta-como';

-- aspecta-constance — medium grey oak plank
-- k-means: H=36°, S=15% — warm grey, not achromatic; hue_angle now non-null
UPDATE materials SET
  lightness  = 55,
  warmth     = 0.15,
  chroma     = 15,
  hue_angle  = 36,
  pattern    = 27,
  cluster_id = NULL
WHERE technical_code = 'aspecta-constance';

-- aspecta-macadamia — medium warm honey-brown chevron oak
UPDATE materials SET
  lightness  = 51,
  warmth     = 0.42,
  chroma     = 42,
  hue_angle  = 33,
  pattern    = 17,
  cluster_id = NULL
WHERE technical_code = 'aspecta-macadamia';

-- aspecta-maggiore — dark warm espresso oak plank
UPDATE materials SET
  lightness  = 21,
  warmth     = 0.54,
  chroma     = 54,
  hue_angle  = 32,
  pattern    = 45,
  cluster_id = NULL
WHERE technical_code = 'aspecta-maggiore';

-- aspecta-pecan — medium warm brown oak plank
UPDATE materials SET
  lightness  = 45,
  warmth     = 0.39,
  chroma     = 39,
  hue_angle  = 36,
  pattern    = 18,
  cluster_id = NULL
WHERE technical_code = 'aspecta-pecan';

-- ── Coretec ───────────────────────────────────────────────────────────────────

-- coretec-naturals-807-meadow — medium warm sandy-brown oak plank
UPDATE materials SET
  lightness  = 64,
  warmth     = 0.26,
  chroma     = 26,
  hue_angle  = 31,
  pattern    = 16,
  cluster_id = NULL
WHERE technical_code = 'coretec-naturals-807-meadow';

-- coretec-stone-ceratouch-pico-0372b — light warm greige stone tile
UPDATE materials SET
  lightness  = 79,
  warmth     = 0.12,
  chroma     = 12,
  hue_angle  = 30,
  pattern    = 33,
  cluster_id = NULL
WHERE technical_code = 'coretec-stone-ceratouch-pico-0372b';

-- ── Floorest ──────────────────────────────────────────────────────────────────

-- floorest-lira — medium-dark greige-brown herringbone oak
UPDATE materials SET
  lightness  = 41,
  warmth     = 0.31,
  chroma     = 31,
  hue_angle  = 34,
  pattern    = 10,
  cluster_id = NULL
WHERE technical_code = 'floorest-lira';

-- floorest-maren — medium warm honey-brown herringbone oak
UPDATE materials SET
  lightness  = 46,
  warmth     = 0.48,
  chroma     = 48,
  hue_angle  = 32,
  pattern    = 11,
  cluster_id = NULL
WHERE technical_code = 'floorest-maren';

-- floorest-mira — light warm sandy-brown herringbone oak
UPDATE materials SET
  lightness  = 59,
  warmth     = 0.33,
  chroma     = 34,
  hue_angle  = 35,
  pattern    = 12,
  cluster_id = NULL
WHERE technical_code = 'floorest-mira';

-- floorest-nora — dark greige-brown herringbone oak
UPDATE materials SET
  lightness  = 35,
  warmth     = 0.42,
  chroma     = 43,
  hue_angle  = 33,
  pattern    = 11,
  cluster_id = NULL
WHERE technical_code = 'floorest-nora';

-- floorest-orien — medium greige herringbone oak
UPDATE materials SET
  lightness  = 50,
  warmth     = 0.36,
  chroma     = 37,
  hue_angle  = 36,
  pattern    = 12,
  cluster_id = NULL
WHERE technical_code = 'floorest-orien';

-- floorest-runa — light warm golden chevron oak
UPDATE materials SET
  lightness  = 58,
  warmth     = 0.37,
  chroma     = 37,
  hue_angle  = 39,
  pattern    = 11,
  cluster_id = NULL
WHERE technical_code = 'floorest-runa';

-- floorest-silva — light golden-yellow herringbone oak
UPDATE materials SET
  lightness  = 61,
  warmth     = 0.41,
  chroma     = 41,
  hue_angle  = 34,
  pattern    = 10,
  cluster_id = NULL
WHERE technical_code = 'floorest-silva';

-- ── Invictus ──────────────────────────────────────────────────────────────────

-- invictus-maximus-highland-oak-42-chocolate — medium-dark warm reddish-brown oak herringbone
UPDATE materials SET
  lightness  = 42,
  warmth     = 0.37,
  chroma     = 38,
  hue_angle  = 25,
  pattern    = 35,
  cluster_id = NULL
WHERE technical_code = 'invictus-maximus-highland-oak-42-chocolate';

-- ── Parador ───────────────────────────────────────────────────────────────────

-- parador-oak-oxford-dark-brown — dark warm brown chevron oak
UPDATE materials SET
  lightness  = 26,
  warmth     = 0.31,
  chroma     = 31,
  hue_angle  = 34,
  pattern    = 16,
  cluster_id = NULL
WHERE technical_code = 'parador-oak-oxford-dark-brown';

-- parador-oak-oxford-sanded — medium light greige chevron oak
UPDATE materials SET
  lightness  = 63,
  warmth     = 0.23,
  chroma     = 24,
  hue_angle  = 38,
  pattern    = 13,
  cluster_id = NULL
WHERE technical_code = 'parador-oak-oxford-sanded';

-- parador-oak-regent-natural — medium-light warm brown plank oak
UPDATE materials SET
  lightness  = 63,
  warmth     = 0.36,
  chroma     = 36,
  hue_angle  = 33,
  pattern    = 11,
  cluster_id = NULL
WHERE technical_code = 'parador-oak-regent-natural';

-- parador-oak-royal-light-limed — light warm greige plank oak
UPDATE materials SET
  lightness  = 67,
  warmth     = 0.30,
  chroma     = 30,
  hue_angle  = 35,
  pattern    = 17,
  cluster_id = NULL
WHERE technical_code = 'parador-oak-royal-light-limed';
