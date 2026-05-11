-- ════════════════════════════════════════════════════════════════════════════
-- Aspecta flooring — rescore (2026-05-11)
-- All materials already in DB. Scores only — image_url NOT changed.
-- Guidelines: supabase/seed/scoring-guidelines.md
-- Lightness calibrated against pixel luminance anchors:
--   bolsena=55 (54.8% measured), runa=51 (51.2% measured)
-- ════════════════════════════════════════════════════════════════════════════

-- aspecta-almond — light warm sandy-beige chevron oak
-- Fine grain, subtle plank variation, warm sandy tone
UPDATE materials SET
  texture        = 'wood',
  lightness      = 64,
  warmth         = 0.25,
  pattern        = 28,
  chroma         = 10,
  hue_angle      = 38,
  texture_prompt = 'wood',
  layout_pattern = 'chevron'
WHERE technical_code = 'aspecta-almond';

-- aspecta-baron — light warm natural oak plank, prominent knots
-- Clear grain swirls, bold knots, high plank variation
UPDATE materials SET
  texture        = 'wood',
  lightness      = 62,
  warmth         = 0.28,
  pattern        = 35,
  chroma         = 11,
  hue_angle      = 35,
  texture_prompt = 'wood',
  layout_pattern = 'plank'
WHERE technical_code = 'aspecta-baron';

-- aspecta-bolsena — medium greige chevron oak, warm beige undertone
-- Washed grain, lower contrast, subtle plank variation — confirmed 54.8% pixel
UPDATE materials SET
  texture        = 'wood',
  lightness      = 55,
  warmth         = 0.05,
  pattern        = 23,
  chroma         = 7,
  hue_angle      = 38,
  texture_prompt = 'wood',
  layout_pattern = 'chevron'
WHERE technical_code = 'aspecta-bolsena';

-- aspecta-brienz — medium-dark warm brown chevron oak
-- Warm brown grain, visible tonal variation between planks
UPDATE materials SET
  texture        = 'wood',
  lightness      = 35,
  warmth         = 0.30,
  pattern        = 32,
  chroma         = 12,
  hue_angle      = 30,
  texture_prompt = 'wood',
  layout_pattern = 'chevron'
WHERE technical_code = 'aspecta-brienz';

-- aspecta-burned — very dark near-black oak plank
-- Grain barely visible at this depth, near-achromatic
UPDATE materials SET
  texture        = 'wood',
  lightness      = 13,
  warmth         = 0.08,
  pattern        = 15,
  chroma         = 4,
  hue_angle      = NULL,
  texture_prompt = 'wood',
  layout_pattern = 'plank'
WHERE technical_code = 'aspecta-burned';

-- aspecta-como — very light sandy-greige chevron oak, warm undertone
-- Light sandy tone, subtle grain, low plank contrast
UPDATE materials SET
  texture        = 'wood',
  lightness      = 70,
  warmth         = 0.05,
  pattern        = 23,
  chroma         = 7,
  hue_angle      = 40,
  texture_prompt = 'wood',
  layout_pattern = 'chevron'
WHERE technical_code = 'aspecta-como';

-- aspecta-constance — medium cool-grey oak plank
-- Grey-washed, grain visible but low contrast, genuinely achromatic
UPDATE materials SET
  texture        = 'wood',
  lightness      = 46,
  warmth         = -0.08,
  pattern        = 22,
  chroma         = 5,
  hue_angle      = NULL,
  texture_prompt = 'wood',
  layout_pattern = 'plank'
WHERE technical_code = 'aspecta-constance';

-- aspecta-macadamia — medium warm honey-brown chevron oak
-- Strong warm grain, clear tonal variation, rich honey tones
UPDATE materials SET
  texture        = 'wood',
  lightness      = 47,
  warmth         = 0.32,
  pattern        = 35,
  chroma         = 13,
  hue_angle      = 32,
  texture_prompt = 'wood',
  layout_pattern = 'chevron'
WHERE technical_code = 'aspecta-macadamia';

-- aspecta-maggiore — dark warm espresso oak plank
-- Dark but warmer than burned, some grain and variation readable
UPDATE materials SET
  texture        = 'wood',
  lightness      = 22,
  warmth         = 0.25,
  pattern        = 22,
  chroma         = 8,
  hue_angle      = 28,
  texture_prompt = 'wood',
  layout_pattern = 'plank'
WHERE technical_code = 'aspecta-maggiore';

-- aspecta-pecan — medium warm brown oak plank, clear grain + knots
-- Clear warm grain, visible knots, rich brown tone
UPDATE materials SET
  texture        = 'wood',
  lightness      = 43,
  warmth         = 0.30,
  pattern        = 30,
  chroma         = 11,
  hue_angle      = 32,
  texture_prompt = 'wood',
  layout_pattern = 'plank'
WHERE technical_code = 'aspecta-pecan';
