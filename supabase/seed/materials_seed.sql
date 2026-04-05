-- Materials seed for Phase 1
-- Populates every product referenced in collections-v2.ts products maps.
-- Descriptors (lightness/warmth/pattern) are derived from the archetype each material
-- is assigned to in collections-v2.ts. Texture reflects physical material type.
--
-- Archetype → descriptor lookup used:
--   light-wood:          wood  | 75  |  0.3 | 25
--   medium-wood:         wood  | 50  |  0.2 | 30
--   dark-wood:           wood  | 20  |  0.1 | 35
--   white:               plain | 95  |  0.0 |  5
--   neutral:             plain | 65  |  0.2 |  5
--   pastel:              plain | 72  |  0.1 |  5
--   black:               plain |  5  |  0.0 |  5
--   bold:                plain | 30  |  0.4 | 75
--   metallic:            metal | 60  |  0.0 | 10
--   concrete:            stone | 55  | -0.1 | 15
--   soft-texture-light:  stone | 75  |  0.1 | 20
--   soft-texture-medium: stone | 50  |  0.1 | 20
--   soft-texture-dark:   stone | 25  |  0.0 | 20
--   bold-texture-light:  stone | 75  |  0.1 | 80
--
-- NOTE: 3 materials not in the plan's explicit list are included here because
-- they are referenced in collections-v2.ts products maps:
--   florim-sensi-lithos-white, egger-medium-grey-fineline, alvic-valazquez-04

-- ─────────────────────────────────────────────────────────────
-- FLOORING  (role: ARRAY['floor'])
-- ─────────────────────────────────────────────────────────────

INSERT INTO materials (technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids) VALUES
(
  'solido-bolsena',
  '{"en":"Light Smoked Oak","lt":"Šviesiai rūkytas ąžuolas"}',
  ARRAY['floor'],
  'wood',
  75, 0.3, 25,
  'Natural light smoked oak flooring',
  '/assets/materials/flooring/aspecta-bolsena.jpg',
  ARRAY['solido-grindys']
),
(
  'solido-pearl',
  '{"en":"Light Concrete Texture","lt":"Šviesi betono tekstūra"}',
  ARRAY['floor'],
  'stone',
  55, -0.1, 15,
  'Light concrete texture flooring',
  '/assets/materials/flooring/solido_pearl.jpg',
  ARRAY['jusu-salonas']
),
(
  'aspecta-maggiore',
  '{"en":"Maggiore","lt":"Maggiore"}',
  ARRAY['floor'],
  'wood',
  20, 0.1, 35,
  'Warm brown-toned oak vinyl',
  '/assets/materials/flooring/aspecta-maggiore.jpg',
  ARRAY['solido-grindys']
),
(
  'constance-chevrone',
  '{"en":"Constance Chevrone","lt":"Constance Chevrone"}',
  ARRAY['floor'],
  'wood',
  75, 0.3, 25,
  'Medium dark grey chevron vinyl flooring with irregular tone, wood-effect finish. Soft matte finish, subtle grain, gentle variation in tone.',
  '/assets/materials/fog-in-the-forest/material1.jpg',
  ARRAY['solido-grindys']
),
(
  'aspecta-baron',
  '{"en":"Baron","lt":"Baron"}',
  ARRAY['floor'],
  'wood',
  75, 0.3, 25,
  'Natural oak texture.',
  '/assets/materials/flooring/aspecta-baron.jpg',
  ARRAY['solido-grindys']
),
(
  'aspecta-brienz',
  '{"en":"Brienz","lt":"Brienz"}',
  ARRAY['floor'],
  'wood',
  50, 0.2, 30,
  'Cool grey-toned oak vinyl flooring, matte finish.',
  '/assets/materials/flooring/aspecta-brienz.jpg',
  ARRAY['solido-grindys']
),
(
  'aspecta-burned',
  '{"en":"Burned","lt":"Burned"}',
  ARRAY['floor'],
  'wood',
  20, 0.1, 35,
  'Dark brown-toned oak',
  '/assets/materials/flooring/aspecta-burned.jpg',
  ARRAY['solido-grindys']
),
(
  '525-calisson-oak',
  '{"en":"525 Calisson Oak","lt":"525 Calisson Oak"}',
  ARRAY['floor'],
  'wood',
  50, 0.2, 30,
  'Warm smoked oak in a herringbone pattern.',
  '/assets/materials/behind-the-lights/material1.jpg',
  ARRAY['impeka']
),
-- Extra: referenced in collections but not in plan explicit list
(
  'florim-sensi-lithos-white',
  '{"en":"Florim Sensi Lithos White","lt":"Florim Sensi Lithos White"}',
  ARRAY['floor'],
  'stone',
  55, -0.1, 15,
  'Light stone-look ceramic flooring, matte finish.',
  NULL,
  ARRAY[]::text[]
);

-- ─────────────────────────────────────────────────────────────
-- CABINET FRONTS  (role: ARRAY['front'])
-- ─────────────────────────────────────────────────────────────

INSERT INTO materials (technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids) VALUES
-- neutral archetype
(
  'velvet-7393',
  '{"en":"Velvet 7393","lt":"Velvet 7393"}',
  ARRAY['front'],
  'plain',
  65, 0.2, 5,
  'Light grey cashmere colour with flat matte finish',
  '/assets/materials/sleeping-earth/material4.jpg',
  ARRAY['impeka']
),
(
  'velvet-1551',
  '{"en":"Off White Matte","lt":"Šilta balta matinė"}',
  ARRAY['front'],
  'plain',
  65, 0.2, 5,
  'Off white flat matte finish',
  '/assets/materials/cabinet-fronts/velvet_1551.jpg',
  ARRAY['impeka']
),
(
  'egger-taupe-grey',
  '{"en":"Egger U750 ST9","lt":"Egger U750 ST9"}',
  ARRAY['front'],
  'plain',
  65, 0.2, 5,
  'Light taupe matte flat finish',
  '/assets/materials/day-by-the-sea/material4.jpg',
  ARRAY['impeka']
),
-- medium-wood archetype
(
  'alvic-goya-02',
  '{"en":"Alvic Goya 02","lt":"Alvic Goya 02"}',
  ARRAY['front'],
  'wood',
  50, 0.2, 30,
  'Warm greige wood grain with vertical texture, matte finish.',
  '/assets/materials/cabinet-fronts/alvic-goya-02.jpg',
  ARRAY['impeka']
),
(
  'egger-brown-casella-oak',
  '{"en":"Brown Casella Oak","lt":"Rudas ramus ąžuolas"}',
  ARRAY['front'],
  'wood',
  50, 0.2, 30,
  'Dark wood vertical texture and matte finish',
  '/assets/materials/cabinet-fronts/egger_brown_casella_oak.jpg',
  ARRAY[]::text[]
),
(
  'egger-natural-casella-oak',
  '{"en":"Egger Natural Casella Oak","lt":"Egger Natural Casella Oak"}',
  ARRAY['front'],
  'wood',
  50, 0.2, 30,
  'Warm natural oak wood grain, vertical texture, matte finish.',
  '/assets/materials/cabinet-fronts/egger-natural-casella-oak.jpg',
  ARRAY['impeka']
),
-- light-wood archetype
(
  'alvic-goya-01',
  '{"en":"Alvic Goya 01","lt":"Alvic Goya 01"}',
  ARRAY['front'],
  'wood',
  75, 0.3, 25,
  'Light greige wood grain with vertical texture, matte finish.',
  '/assets/materials/cabinet-fronts/alvic-goya-01.jpg',
  ARRAY['impeka']
),
(
  'egger-light-natural-casella-oak',
  '{"en":"Light Natural Casella Oak","lt":"Šviesus ąžuolas"}',
  ARRAY['front'],
  'wood',
  75, 0.3, 25,
  'Light natural wood vertical texture and matte finish',
  '/assets/materials/cabinet-fronts/egger_light_natural_casella_oak.jpg',
  ARRAY[]::text[]
),
-- dark-wood archetype
(
  'alvi-goya-03-na',
  '{"en":"Dark Wood Texture","lt":"Tamsi medžio tektūra"}',
  ARRAY['front'],
  'wood',
  20, 0.1, 35,
  'Dark wood vertical texture and matte finish',
  '/assets/materials/cabinet-fronts/alvic-goya-03.jpg',
  ARRAY['impeka']
),
(
  'egger-dark-grey-fineline',
  '{"en":"Egger Dark Grey Fineline","lt":"Egger Dark Grey Fineline"}',
  ARRAY['front'],
  'wood',
  20, 0.1, 35,
  'Matte dark brown cabinet fronts with fine horizontal wood grain texture',
  '/assets/materials/cabinet-fronts/egger_dark_grey_fineline.jpg',
  ARRAY['impeka']
),
(
  'egger-dark-brown-eucalypthus',
  '{"en":"Egger Dark","lt":"Egger Dark"}',
  ARRAY['front'],
  'wood',
  20, 0.1, 35,
  'Dark brown-toned oak veneer texture.',
  '/assets/materials/cabinet-fronts/egger-dark-brown-eucalypthus.jpg',
  ARRAY['impeka']
),
-- white archetype
(
  'velvet-1648',
  '{"en":"Velvet 1648","lt":"Velvet 1648"}',
  ARRAY['front'],
  'plain',
  95, 0.0, 5,
  'Flat matte off-white.',
  '/assets/materials/caramel-morning/material5.jpg',
  ARRAY['impeka']
),
(
  'off-white-matte',
  '{"en":"Off-White Matte","lt":"Matinė šilta balta"}',
  ARRAY['front'],
  'plain',
  95, 0.0, 5,
  'Flat matte off-white.',
  '/assets/materials/spicy-nord/material3.jpg',
  ARRAY[]::text[]
),
-- black archetype
(
  'skin-carbon-fumo',
  '{"en":"Black Carbon and Wood Texture","lt":"Juoda anglies ir medžio tekstūra"}',
  ARRAY['front'],
  'plain',
  5, 0.0, 5,
  'Black Carbon and Wood Texture',
  '/assets/materials/cabinet-fronts/skin_carbon_fumo.jpg',
  ARRAY[]::text[]
),
(
  'valchromat-black',
  '{"en":"Valchromat Black","lt":"Valchromat Black"}',
  ARRAY['front'],
  'plain',
  5, 0.0, 5,
  'Black, velvety matte',
  '/assets/materials/behind-the-lights/material2.jpg',
  ARRAY['impeka']
),
(
  'velvet-1302',
  '{"en":"Velvet Soft Black","lt":"Velvet Soft Black"}',
  ARRAY['front'],
  'plain',
  5, 0.0, 5,
  'Soft charcoal-black flat matte finish.',
  '/assets/materials/cabinet-fronts/velvet-1302.jpg',
  ARRAY['impeka']
),
-- pastel archetype
(
  'velvet-3301',
  '{"en":"Velvet 3301","lt":"Velvet 3301"}',
  ARRAY['front'],
  'plain',
  72, 0.1, 5,
  'Garrison grey colour with blue undertone. Flat surfaces.',
  '/assets/materials/cabinet-fronts/velvet_3301.jpg',
  ARRAY['impeka']
),
(
  'velvet-4246',
  '{"en":"Velvet 4246","lt":"Velvet 4246"}',
  ARRAY['front'],
  'plain',
  72, 0.1, 5,
  'A pastel grey-blue with green undertones',
  '/assets/materials/cabinet-fronts/velvet_4246.jpg',
  ARRAY['impeka']
),
-- metallic archetype
(
  'pearl-7901',
  '{"en":"Dark Bronze Matte","lt":"Tamsi bronza"}',
  ARRAY['front'],
  'metal',
  60, 0.0, 10,
  'Dark bronze flat matte finish',
  '/assets/materials/cabinet-fronts/pearl_7901.jpg',
  ARRAY['impeka']
),
-- bold archetype
(
  'velvet-5983',
  '{"en":"Velvet 5983","lt":"Velvet 5983"}',
  ARRAY['front'],
  'plain',
  30, 0.4, 75,
  'Rich brick-red colour matte finish.',
  '/assets/materials/behind-the-lights/material7.jpg',
  ARRAY['impeka']
),
-- Extras: referenced in collections but not in plan explicit list
(
  'egger-medium-grey-fineline',
  '{"en":"Egger Medium Grey Fineline","lt":"Egger Medium Grey Fineline"}',
  ARRAY['front'],
  'wood',
  75, 0.3, 25,
  'Matte medium grey cabinet fronts with fine horizontal wood grain texture',
  '/assets/materials/cabinet-fronts/egger_medium_grey_fineline.jpg',
  ARRAY['impeka']
),
(
  'alvic-valazquez-04',
  '{"en":"Alvic Valázquez 04","lt":"Alvic Valázquez 04"}',
  ARRAY['front'],
  'wood',
  50, 0.2, 30,
  'Light natural oak with fine vertical grain, matte finish.',
  '/assets/materials/cabinet-fronts/alvic_valazquez-04.jpg',
  ARRAY['impeka']
);

-- ─────────────────────────────────────────────────────────────
-- WORKTOPS  (role: ARRAY['worktop'])
-- ─────────────────────────────────────────────────────────────

INSERT INTO materials (technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids) VALUES
-- soft-texture-light archetype
(
  'icono-arabesca-marmo',
  '{"en":"Icono Arabesca Marmo","lt":"Icono Arabesca Marmo"}',
  ARRAY['worktop'],
  'stone',
  75, 0.1, 20,
  'Light grey marble with soft white veining, matte finish.',
  '/assets/materials/worktops/icono-c42-arabesca-marmo.jpg',
  ARRAY['impeka']
),
(
  'egger-cremona-marble',
  '{"en":"Egger Cremona Marble","lt":"Egger Kremona marmuras"}',
  ARRAY['worktop'],
  'stone',
  75, 0.1, 20,
  'Warm beige marble with soft brown veining, matte finish.',
  '/assets/materials/worktops/egger-cremona-marble.jpg',
  ARRAY['impeka']
),
-- soft-texture-medium archetype
(
  'icono-picasso-marrone',
  '{"en":"Icono Picasso Marrone","lt":"Icono Picasso Marrone"}',
  ARRAY['worktop'],
  'stone',
  50, 0.1, 20,
  'Dark grey-brown stone with warm rust veining, matte finish.',
  '/assets/materials/worktops/icono-c59-picasso-marrone.jpg',
  ARRAY['impeka']
),
-- soft-texture-dark archetype
(
  'icono-marquina-cava',
  '{"en":"Icono Marquina Cava","lt":"Icono Marquina Cava"}',
  ARRAY['worktop'],
  'stone',
  25, 0.0, 20,
  'Black marble featuring white veining',
  '/assets/materials/worktops/icono_C35_marquina_cava.jpg',
  ARRAY['impeka']
),
(
  'egger-f244-st76',
  '{"en":"Egger F244 ST76","lt":"Egger F244 ST76"}',
  ARRAY['worktop'],
  'stone',
  25, 0.0, 20,
  'Dark grey marble with dramatic, busy pattern: mixed charcoal, grey, and subtle warm inclusions, irregular mineral texture',
  '/assets/materials/fog-in-the-forest/material3.jpg',
  ARRAY['impeka']
),
-- bold-texture-light archetype
(
  'fondi-32-vento-marmo',
  '{"en":"Fondi 32 Vento Marmo","lt":"Fondi 32 Vento Marmo"}',
  ARRAY['worktop'],
  'stone',
  75, 0.1, 80,
  'Light warm marble with soft grey veining, matte finish.',
  '/assets/materials/worktops/fondi-32-vento-marmo.jpg',
  ARRAY['impeka']
),
(
  'fondi-40-peperino-marmo',
  '{"en":"Fondi 40 Peperino Marmo","lt":"Fondi 40 Peperino Marmo"}',
  ARRAY['worktop'],
  'stone',
  75, 0.1, 80,
  'Warm grey-brown medium tone marble with white veining and a calm, honed stone texture.',
  '/assets/materials/worktops/fondi-40-peperino-marmo.jpg',
  ARRAY['impeka']
),
(
  'icono-laurent-carrata',
  '{"en":"Icono Laurent Carrata","lt":"Icono Laurent Carrata"}',
  ARRAY['worktop'],
  'stone',
  75, 0.1, 80,
  'White stone with bold texture.',
  '/assets/materials/worktops/icono-c31-laurent-carata.jpg',
  ARRAY['impeka']
),
-- white archetype (stone material)
(
  'icono-c43-eleganza-bianco',
  '{"en":"ICONO C43 Eleganza Bianco","lt":"ICONO C43 Eleganza Bianco"}',
  ARRAY['worktop'],
  'stone',
  95, 0.0, 5,
  'Stone-textured warm white',
  '/assets/materials/day-by-the-sea/material3.jpg',
  ARRAY['impeka']
),
-- white archetype (plain material)
(
  'egger-premium-white-worktop',
  '{"en":"Flat Matte Off-White","lt":"Šilta balta spalva"}',
  ARRAY['worktop'],
  'plain',
  95, 0.0, 5,
  'Flat matte off-white.',
  '/assets/materials/worktops/egger_premium_white_w1000_ST76.jpg',
  ARRAY['impeka']
),
-- concrete archetype
(
  'icono-sereno-noto',
  '{"en":"Icono Sereno Noto","lt":"Icono Sereno Noto"}',
  ARRAY['worktop'],
  'stone',
  55, -0.1, 15,
  'Grey concrete texture with subtle warm undertones, matte finish.',
  '/assets/materials/worktops/icono_C45_sereno_noto.jpg',
  ARRAY['impeka']
);

-- ─────────────────────────────────────────────────────────────
-- ACCENTS  (role: ARRAY['accent'])
-- ─────────────────────────────────────────────────────────────

INSERT INTO materials (technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids) VALUES
(
  'chrome',
  '{"en":"Chrome","lt":"Chromas"}',
  ARRAY['accent'],
  'metal',
  60, 0.0, 10,
  'Chrome finish',
  '/assets/materials/accents/chrome.jpg',
  ARRAY[]::text[]
),
(
  'wine-red',
  '{"en":"Wine Red","lt":"Vyno raudona"}',
  ARRAY['accent'],
  'plain',
  30, 0.4, 75,
  'Wine red finish',
  '/assets/materials/accents/wine_red.jpg',
  ARRAY[]::text[]
),
(
  'aged-bronze',
  '{"en":"Aged Bronze","lt":"Sedinta bronza"}',
  ARRAY['accent'],
  'metal',
  60, 0.0, 10,
  'Aged bronze finish, warm undertones.',
  '/assets/materials/accents/aged_bronze.jpg',
  ARRAY[]::text[]
),
(
  'gold',
  '{"en":"Gold","lt":"Auksas"}',
  ARRAY['accent'],
  'metal',
  60, 0.0, 10,
  'Gold finish',
  '/assets/materials/accents/gold.jpg',
  ARRAY[]::text[]
);
