-- hue_angle backfill — scored visually from material images, 2026-05-09
-- 0=red  30=orange  60=yellow  90=yellow-green  120=green
-- 180=cyan  215=blue  240=blue  300=magenta  330-350=pink/rose
-- NULL = achromatic (chroma ≤ 5 threshold applies elsewhere; included here for completeness)
--
-- * = image not yet in storage — angle estimated from name/description

UPDATE materials SET hue_angle = 215  WHERE technical_code = 'kronospan-k5994-alby-blue';        -- steel blue-grey
UPDATE materials SET hue_angle = 25   WHERE technical_code = 'sm-art-re09-scintilla-polvere';     -- warm rust/terracotta
UPDATE materials SET hue_angle = 15   WHERE technical_code = 'sm-art-ma11-rabat-malta';           -- warm brownish-red plaster
UPDATE materials SET hue_angle = 90   WHERE technical_code = 'sm-art-ma13-gozo-malta';            -- olive/khaki green
UPDATE materials SET hue_angle = 350  WHERE technical_code = 'wine-red';                          -- deep burgundy/crimson
UPDATE materials SET hue_angle = 18   WHERE technical_code = 'sm-art-ma15-sliema-malta';          -- dusty blush/warm pink plaster
UPDATE materials SET hue_angle = 145  WHERE technical_code = 'sm-art-0042-sottobosco-atom';       -- sage green
UPDATE materials SET hue_angle = 175  WHERE technical_code = 'sm-art-0041-atmosfera-atom';        -- blue-grey-green (cooler sage)
UPDATE materials SET hue_angle = 45   WHERE technical_code = 'gold';                              -- warm yellow-gold/brass
UPDATE materials SET hue_angle = 35   WHERE technical_code = 'sm-art-es03-malto-essenza';         -- light honey oak
UPDATE materials SET hue_angle = 30   WHERE technical_code = 'sm-art-es04-anice-essenza';         -- medium warm brown wood
UPDATE materials SET hue_angle = 28   WHERE technical_code = 'sm-art-es05-ginepro-essenza';       -- darker walnut-brown wood
UPDATE materials SET hue_angle = 25   WHERE technical_code = 'sm-art-es06-tabacco-essenza';       -- dark chocolate/tobacco wood
UPDATE materials SET hue_angle = 40   WHERE technical_code = 'sm-art-es02-coriandolo-essenza';    -- light blonde/whitewashed oak
UPDATE materials SET hue_angle = 45   WHERE technical_code = 'sm-art-r022-tevere-rio';            -- warm cream travertine stone
UPDATE materials SET hue_angle = 38   WHERE technical_code = 'sm-art-re02-meriggio-reverso';      -- warm beige/tan textile
UPDATE materials SET hue_angle = 35   WHERE technical_code = 'sm-art-s202-spring-soho';           -- dark smoky grey-brown oak
UPDATE materials SET hue_angle = 35   WHERE technical_code = 'sm-art-s203-prince-soho';           -- very dark near-black grey-brown oak
UPDATE materials SET hue_angle = 50   WHERE technical_code = 'sm-art-me01-palladio-met';          -- warm champagne metallic (greenish-gold sheen)
UPDATE materials SET hue_angle = 50   WHERE technical_code = 'sm-art-t002-shetland-trama';        -- light warm beige linen textile
UPDATE materials SET hue_angle = 45   WHERE technical_code = 'kronospan-k367-cream-navona';       -- warm cream/beige marble stone
UPDATE materials SET hue_angle = 60   WHERE technical_code = 'kronospan-k564-almond';             -- very pale warm cream/off-white (yellow-cream)
UPDATE materials SET hue_angle = 40   WHERE technical_code = 'kronospan-k680-stone-beige';        -- light warm greige stone
UPDATE materials SET hue_angle = 40   WHERE technical_code = 'kronospan-k681-macadamia';          -- warm medium beige/tan
UPDATE materials SET hue_angle = 35   WHERE technical_code = 'kronospan-k696-umber-primavera-oak'; -- medium warm umber-brown oak
UPDATE materials SET hue_angle = 20   WHERE technical_code = 'kronospan-k5981-cashmere';          -- muted warm pinkish-beige/cashmere
UPDATE materials SET hue_angle = 30   WHERE technical_code = 'kronospan-k7045-satin';             -- warm peachy-beige
UPDATE materials SET hue_angle = 38   WHERE technical_code = 'skin-2526-partenone';               -- light warm natural oak
UPDATE materials SET hue_angle = 40   WHERE technical_code = 'skin-d5456-bronzo';                 -- dark bronze-grey (slight warm direction)
UPDATE materials SET hue_angle = 35   WHERE technical_code = 'gizir-s027-mink';                   -- warm medium beige/mink
UPDATE materials SET hue_angle = 45   WHERE technical_code = 'fab-6133-black-marble';             -- dark marble, warm gold veining

-- * Images not yet uploaded to storage — estimated from name/description:
UPDATE materials SET hue_angle = 45   WHERE technical_code = 'sm-art-0014-gobi-atom';             -- * sandy desert beige (Gobi)
UPDATE materials SET hue_angle = 40   WHERE technical_code = 'aspecta-bolsena';                   -- * warm stone beige (Italian lake reference)
UPDATE materials SET hue_angle = 35   WHERE technical_code = 'aspecta-maggiore';                  -- * warm brown-toned oak vinyl
UPDATE materials SET hue_angle = 38   WHERE technical_code = '1000grindu-texas-oak';              -- * warm golden oak
UPDATE materials SET hue_angle = 40   WHERE technical_code = 'coretec-stone-ceratouch-pico-0372b'; -- * neutral warm stone
UPDATE materials SET hue_angle = 40   WHERE technical_code = 'aged-bronze';                       -- * warm brown-gold bronze accent
