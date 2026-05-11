-- ════════════════════════════════════════════════════════════════════════════
-- Floorest flooring — rescore (2026-05-11)
-- All materials already in DB. Scores only — image_url NOT changed.
-- Guidelines: supabase/seed/scoring-guidelines.md
-- Lightness calibrated against pixel luminance anchors:
--   bolsena=55 (54.8% measured), runa=51 (51.2% measured)
-- ════════════════════════════════════════════════════════════════════════════

-- floorest-lira — medium-dark greige-brown herringbone oak
-- Washed grain, low contrast, cool-greige undertone
UPDATE materials SET
  texture        = 'wood',
  lightness      = 35,
  warmth         = 0.10,
  pattern        = 20,
  chroma         = 7,
  hue_angle      = 38,
  texture_prompt = 'wood',
  layout_pattern = 'herringbone'
WHERE technical_code = 'floorest-lira';

-- floorest-maren — medium warm honey-brown herringbone oak
-- Clear warm grain, rich brown tone, good tonal variation between planks
UPDATE materials SET
  texture        = 'wood',
  lightness      = 46,
  warmth         = 0.28,
  pattern        = 20,
  chroma         = 12,
  hue_angle      = 32,
  texture_prompt = 'wood',
  layout_pattern = 'herringbone'
WHERE technical_code = 'floorest-maren';

-- floorest-mira — light warm sandy-greige herringbone oak
-- Subtle grain, low plank contrast, sandy warm undertone
UPDATE materials SET
  texture        = 'wood',
  lightness      = 64,
  warmth         = 0.12,
  pattern        = 20,
  chroma         = 8,
  hue_angle      = 40,
  texture_prompt = 'wood',
  layout_pattern = 'herringbone'
WHERE technical_code = 'floorest-mira';

-- floorest-nora — dark greige-brown herringbone oak, slightly darker than lira
-- Washed grain, low contrast, warm greige undertone
UPDATE materials SET
  texture        = 'wood',
  lightness      = 33,
  warmth         = 0.08,
  pattern        = 20,
  chroma         = 6,
  hue_angle      = 38,
  texture_prompt = 'wood',
  layout_pattern = 'herringbone'
WHERE technical_code = 'floorest-nora';

-- floorest-orien — medium greige herringbone oak, lighter than lira/nora
-- Soft grain, moderate tonal variation, warm grey-taupe undertone
UPDATE materials SET
  texture        = 'wood',
  lightness      = 42,
  warmth         = 0.08,
  pattern        = 20,
  chroma         = 7,
  hue_angle      = 38,
  texture_prompt = 'wood',
  layout_pattern = 'herringbone'
WHERE technical_code = 'floorest-orien';

-- floorest-runa — light warm golden chevron oak
-- Warm golden tone, clear grain — lightness confirmed 51.2% pixel
UPDATE materials SET
  texture        = 'wood',
  lightness      = 51,
  warmth         = 0.22,
  pattern        = 20,
  chroma         = 10,
  hue_angle      = 37,
  texture_prompt = 'wood',
  layout_pattern = 'chevron'
WHERE technical_code = 'floorest-runa';

-- floorest-silva — light golden-yellow herringbone oak
-- Assertively golden-yellow, warmest of the light oaks, clear plank variation
UPDATE materials SET
  texture        = 'wood',
  lightness      = 53,
  warmth         = 0.32,
  pattern        = 20,
  chroma         = 11,
  hue_angle      = 45,
  texture_prompt = 'wood',
  layout_pattern = 'herringbone'
WHERE technical_code = 'floorest-silva';
