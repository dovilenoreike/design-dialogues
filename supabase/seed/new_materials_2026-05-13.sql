-- ════════════════════════════════════════════════════════════════════════════
-- New + rescored materials — 2026-05-13
-- All scores from BCGSC Color Summarizer API (rescored 2026-05-13)
-- New materials: 9 Kronospan + sm-art-3096-annapurna-bianco
-- Rescored (colour + cluster_id=NULL): Kronospan existing, Gentas, Gizir, SM-art
-- ⚠ Pattern may be inflated (achromatic hue noise) for:
--   caolino-atom(100), atmosfera-atom(59), nero-intagli(100), pepe-intagli(100),
--   piombo-met(100), penombra-polvere(100), penombra-reverso(80), cashmere(65)
-- kronospan-k352/k367/k526 not in _scoring — original scores kept
-- Upload webp files to Supabase storage before running:
--   material-images/Kronospan/  → kronospan-0112-snow-grey.webp
--                                  kronospan-k695-sraw-primavera-oak.webp
--                                  kronospan-k697-cocao-primavera-oak.webp
--                                  kronospan-k684-black-truffle.webp
--                                  kronospan-0166-basalt.webp
--                                  kronospan-k521-smoke-green.webp
--                                  kronospan-k098-ceramic-red.webp
--                                  kronospan-k682-alpaca.webp
--                                  kronospan-k683-cajun.webp
--   material-images/SM-art/     → sm-art-3096-annapurna-bianco.webp
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- PART 1: NEW MATERIALS — RESCORE (already inserted)
-- ════════════════════════════════════════════════════════════════════════════

-- ── Kronospan / front ─────────────────────────────────────────────────────────

UPDATE materials SET
  lightness = 88, warmth = 0.00, chroma = 0, hue_angle = NULL, pattern = 0, cluster_id = NULL
WHERE technical_code = 'kronospan-0112-snow-grey';

UPDATE materials SET
  lightness = 64, warmth = 0.28, chroma = 28, hue_angle = 31, pattern = 8, cluster_id = NULL
WHERE technical_code = 'kronospan-k695-sraw-primavera-oak';

UPDATE materials SET
  lightness = 21, warmth = 0.29, chroma = 29, hue_angle = 29, pattern = 28, cluster_id = NULL
WHERE technical_code = 'kronospan-k697-cocao-primavera-oak';

UPDATE materials SET
  lightness = 25, warmth = 0.09, chroma = 11, hue_angle = 359, pattern = 0, cluster_id = NULL
WHERE technical_code = 'kronospan-k684-black-truffle';

UPDATE materials SET
  lightness = 20, warmth = 0.10, chroma = 11, hue_angle = 59, pattern = 48, cluster_id = NULL
WHERE technical_code = 'kronospan-0166-basalt';

UPDATE materials SET
  lightness = 38, warmth = 0.09, chroma = 17, hue_angle = 88, pattern = 17, cluster_id = NULL
WHERE technical_code = 'kronospan-k521-smoke-green';

UPDATE materials SET
  lightness = 34, warmth = 0.62, chroma = 66, hue_angle = 13, pattern = 17, cluster_id = NULL
WHERE technical_code = 'kronospan-k098-ceramic-red';

UPDATE materials SET
  lightness = 59, warmth = 0.35, chroma = 35, hue_angle = 24, pattern = 8, cluster_id = NULL
WHERE technical_code = 'kronospan-k682-alpaca';

UPDATE materials SET
  lightness = 45, warmth = 0.28, chroma = 29, hue_angle = 12, pattern = 21, cluster_id = NULL
WHERE technical_code = 'kronospan-k683-cajun';

-- ── SM-art / front ────────────────────────────────────────────────────────────

UPDATE materials SET
  lightness = 96, warmth = 0.04, chroma = 4, hue_angle = NULL, pattern = 32, cluster_id = NULL
WHERE technical_code = 'sm-art-3096-annapurna-bianco';


-- ════════════════════════════════════════════════════════════════════════════
-- PART 2: COLOUR RESCORE — EXISTING MATERIALS
-- Updates: lightness, warmth, chroma, hue_angle, pattern, cluster_id = NULL
-- ════════════════════════════════════════════════════════════════════════════

-- ── Kronospan existing ────────────────────────────────────────────────────────

-- kronospan-k352-iron-flow — no image in _scoring, original score kept
UPDATE materials SET
  lightness = 55, warmth = 0.05, chroma = 5, hue_angle = NULL, pattern = 35, cluster_id = NULL
WHERE technical_code = 'kronospan-k352-iron-flow';

-- kronospan-k367-cream-navona — no image in _scoring, original score kept
UPDATE materials SET
  lightness = 78, warmth = 0.12, chroma = 8, hue_angle = 40, pattern = 50, cluster_id = NULL
WHERE technical_code = 'kronospan-k367-cream-navona';

-- kronospan-k526-iron-surfside-ash — no image in _scoring, original score kept
UPDATE materials SET
  lightness = 20, warmth = 0.00, chroma = 3, hue_angle = NULL, pattern = 25, cluster_id = NULL
WHERE technical_code = 'kronospan-k526-iron-surfside-ash';

-- kronospan-k564-almond — near-white, very low chroma
UPDATE materials SET
  lightness = 94, warmth = 0.03, chroma = 4, hue_angle = NULL, pattern = 32, cluster_id = NULL
WHERE technical_code = 'kronospan-k564-almond';

-- kronospan-k5981-cashmere — light warm greige plain
UPDATE materials SET
  lightness = 84, warmth = 0.05, chroma = 6, hue_angle = 31, pattern = 65, cluster_id = NULL
WHERE technical_code = 'kronospan-k5981-cashmere';

-- kronospan-k5994-alby-blue — medium-dark steel-blue plain
UPDATE materials SET
  lightness = 31, warmth = -0.23, chroma = 23, hue_angle = 212, pattern = 20, cluster_id = NULL
WHERE technical_code = 'kronospan-k5994-alby-blue';

-- kronospan-k680-stone-beige — very light neutral greige plain
UPDATE materials SET
  lightness = 90, warmth = 0.04, chroma = 4, hue_angle = NULL, pattern = 29, cluster_id = NULL
WHERE technical_code = 'kronospan-k680-stone-beige';

-- kronospan-k681-macadamia — light warm greige-tan plain
UPDATE materials SET
  lightness = 83, warmth = 0.11, chroma = 11, hue_angle = 30, pattern = 18, cluster_id = NULL
WHERE technical_code = 'kronospan-k681-macadamia';

-- kronospan-k696-umber-primavera-oak — medium warm greige-brown wood grain
UPDATE materials SET
  lightness = 40, warmth = 0.32, chroma = 33, hue_angle = 28, pattern = 20, cluster_id = NULL
WHERE technical_code = 'kronospan-k696-umber-primavera-oak';

-- kronospan-k7045-satin — light warm greige plain
UPDATE materials SET
  lightness = 83, warmth = 0.11, chroma = 12, hue_angle = 36, pattern = 26, cluster_id = NULL
WHERE technical_code = 'kronospan-k7045-satin';

-- kronospan-k8685-snow-white — pure bright white plain
UPDATE materials SET
  lightness = 99, warmth = 0.00, chroma = 0, hue_angle = NULL, pattern = 0, cluster_id = NULL
WHERE technical_code = 'kronospan-k8685-snow-white';


-- ── Gentas existing ───────────────────────────────────────────────────────────

-- gentas-5700-italian-stone — dark warm-grey stone, heavy mottling
UPDATE materials SET
  lightness = 41, warmth = 0.19, chroma = 20, hue_angle = 41, pattern = 62, cluster_id = NULL
WHERE technical_code = 'gentas-5700-italian-stone';

-- gentas-5716-vl-sydney — dark dramatic stone with metallic swirls
UPDATE materials SET
  lightness = 49, warmth = 0.12, chroma = 12, hue_angle = 27, pattern = 74, cluster_id = NULL
WHERE technical_code = 'gentas-5716-vl-sydney';

-- gentas-5728-everest — medium grey concrete with subtle mottling
UPDATE materials SET
  lightness = 59, warmth = 0.07, chroma = 7, hue_angle = 39, pattern = 29, cluster_id = NULL
WHERE technical_code = 'gentas-5728-everest';

-- gentas-5807-twinkle-pristine — light cool grey stone, subtle speckle
UPDATE materials SET
  lightness = 65, warmth = 0.07, chroma = 7, hue_angle = 28, pattern = 38, cluster_id = NULL
WHERE technical_code = 'gentas-5807-twinkle-pristine';

-- gentas-5813-loreley-jupiter — medium grey stone with soft texture
UPDATE materials SET
  lightness = 62, warmth = 0.13, chroma = 13, hue_angle = 35, pattern = 30, cluster_id = NULL
WHERE technical_code = 'gentas-5813-loreley-jupiter';

-- gentas-5818-lorreto-italian-stone — light warm grey flowing stone
UPDATE materials SET
  lightness = 78, warmth = 0.09, chroma = 9, hue_angle = 35, pattern = 22, cluster_id = NULL
WHERE technical_code = 'gentas-5818-lorreto-italian-stone';

-- gentas-5828-canyon — medium grey travertine with horizontal striation
UPDATE materials SET
  lightness = 67, warmth = 0.08, chroma = 8, hue_angle = 39, pattern = 51, cluster_id = NULL
WHERE technical_code = 'gentas-5828-canyon';

-- gentas-5831-ocala — light grey stone with fractured marble pattern
UPDATE materials SET
  lightness = 86, warmth = 0.09, chroma = 9, hue_angle = 38, pattern = 22, cluster_id = NULL
WHERE technical_code = 'gentas-5831-ocala';


-- ── Gizir existing ────────────────────────────────────────────────────────────

-- gizir-af34-grey — medium warm-grey plain
UPDATE materials SET
  lightness = 50, warmth = 0.06, chroma = 6, hue_angle = 40, pattern = 32, cluster_id = NULL
WHERE technical_code = 'gizir-af34-grey';

-- gizir-af35-light-grey — light warm greige plain
UPDATE materials SET
  lightness = 82, warmth = 0.07, chroma = 8, hue_angle = 48, pattern = 25, cluster_id = NULL
WHERE technical_code = 'gizir-af35-light-grey';

-- gizir-s027-mink — medium warm taupe-beige plain
UPDATE materials SET
  lightness = 58, warmth = 0.18, chroma = 18, hue_angle = 29, pattern = 21, cluster_id = NULL
WHERE technical_code = 'gizir-s027-mink';

-- gizir-s028-light-grey — medium warm khaki-grey plain
UPDATE materials SET
  lightness = 48, warmth = 0.20, chroma = 20, hue_angle = 45, pattern = 10, cluster_id = NULL
WHERE technical_code = 'gizir-s028-light-grey';


-- ── SM-art existing ───────────────────────────────────────────────────────────

-- sm-art-0010-caolino-atom — near-white plain (⚠ pattern=100 is achromatic noise, visual=0)
UPDATE materials SET
  lightness = 93, warmth = 0.01, chroma = 1, hue_angle = NULL, pattern = 100, cluster_id = NULL
WHERE technical_code = 'sm-art-0010-caolino-atom';

-- sm-art-0014-gobi-atom — light warm greige plain
UPDATE materials SET
  lightness = 85, warmth = 0.06, chroma = 6, hue_angle = 40, pattern = 23, cluster_id = NULL
WHERE technical_code = 'sm-art-0014-gobi-atom';

-- sm-art-0041-atmosfera-atom — light sage/grey-green plain (⚠ pattern=59 likely noise)
UPDATE materials SET
  lightness = 72, warmth = -0.01, chroma = 4, hue_angle = NULL, pattern = 59, cluster_id = NULL
WHERE technical_code = 'sm-art-0041-atmosfera-atom';

-- sm-art-0042-sottobosco-atom — medium sage-green plain
UPDATE materials SET
  lightness = 62, warmth = 0.00, chroma = 5, hue_angle = NULL, pattern = 21, cluster_id = NULL
WHERE technical_code = 'sm-art-0042-sottobosco-atom';

-- sm-art-3190-nero-intagli — very dark near-black wood grain (⚠ pattern=100 likely noise)
UPDATE materials SET
  lightness = 8, warmth = -0.03, chroma = 5, hue_angle = NULL, pattern = 100, cluster_id = NULL
WHERE technical_code = 'sm-art-3190-nero-intagli';

-- sm-art-d003-atacama-dune — light warm greige wood grain (Dune series)
UPDATE materials SET
  lightness = 63, warmth = 0.22, chroma = 22, hue_angle = 21, pattern = 40, cluster_id = NULL
WHERE technical_code = 'sm-art-d003-atacama-dune';

-- sm-art-d006-betonmarsiglia-dune — light grey plain with fine vertical ribbing
UPDATE materials SET
  lightness = 59, warmth = 0.00, chroma = 0, hue_angle = NULL, pattern = 8, cluster_id = NULL
WHERE technical_code = 'sm-art-d006-betonmarsiglia-dune';

-- sm-art-es03-malto-essenza — light warm honey-golden oak (Essenza series)
UPDATE materials SET
  lightness = 59, warmth = 0.47, chroma = 47, hue_angle = 31, pattern = 11, cluster_id = NULL
WHERE technical_code = 'sm-art-es03-malto-essenza';

-- sm-art-es04-anice-essenza — medium warm brown-honey oak
UPDATE materials SET
  lightness = 51, warmth = 0.41, chroma = 41, hue_angle = 29, pattern = 14, cluster_id = NULL
WHERE technical_code = 'sm-art-es04-anice-essenza';

-- sm-art-es05-ginepro-essenza — medium-dark warm walnut oak
UPDATE materials SET
  lightness = 35, warmth = 0.40, chroma = 40, hue_angle = 27, pattern = 17, cluster_id = NULL
WHERE technical_code = 'sm-art-es05-ginepro-essenza';

-- sm-art-es06-tabacco-essenza — dark warm chocolate-brown oak
UPDATE materials SET
  lightness = 26, warmth = 0.33, chroma = 33, hue_angle = 19, pattern = 27, cluster_id = NULL
WHERE technical_code = 'sm-art-es06-tabacco-essenza';

-- sm-art-es07-liquirizia-essenza — very dark near-black wood grain
UPDATE materials SET
  lightness = 22, warmth = 0.16, chroma = 16, hue_angle = 16, pattern = 67, cluster_id = NULL
WHERE technical_code = 'sm-art-es07-liquirizia-essenza';

-- sm-art-in04-cannella-intagli — light warm greige oak (Intagli series)
UPDATE materials SET
  lightness = 47, warmth = 0.33, chroma = 34, hue_angle = 25, pattern = 18, cluster_id = NULL
WHERE technical_code = 'sm-art-in04-cannella-intagli';

-- sm-art-in05-cumino-intagli — medium warm brown-greige oak
UPDATE materials SET
  lightness = 39, warmth = 0.31, chroma = 31, hue_angle = 26, pattern = 18, cluster_id = NULL
WHERE technical_code = 'sm-art-in05-cumino-intagli';

-- sm-art-in07-pepe-intagli — dark warm charcoal wood grain (⚠ pattern=100 likely noise)
UPDATE materials SET
  lightness = 21, warmth = 0.11, chroma = 11, hue_angle = 25, pattern = 100, cluster_id = NULL
WHERE technical_code = 'sm-art-in07-pepe-intagli';

-- sm-art-ma11-rabat-malta — medium muted rose-brown plaster finish (Malta series)
UPDATE materials SET
  lightness = 38, warmth = 0.31, chroma = 33, hue_angle = 8, pattern = 59, cluster_id = NULL
WHERE technical_code = 'sm-art-ma11-rabat-malta';

-- sm-art-ma13-gozo-malta — dark charcoal-grey plaster finish
UPDATE materials SET
  lightness = 33, warmth = 0.09, chroma = 11, hue_angle = 65, pattern = 18, cluster_id = NULL
WHERE technical_code = 'sm-art-ma13-gozo-malta';

-- sm-art-ma15-sliema-malta — light warm sandy-taupe plaster finish
UPDATE materials SET
  lightness = 60, warmth = 0.27, chroma = 27, hue_angle = 27, pattern = 19, cluster_id = NULL
WHERE technical_code = 'sm-art-ma15-sliema-malta';

-- sm-art-me01-palladio-met — light warm taupe brushed metal (Met series)
UPDATE materials SET
  lightness = 61, warmth = 0.16, chroma = 16, hue_angle = 44, pattern = 17, cluster_id = NULL
WHERE technical_code = 'sm-art-me01-palladio-met';

-- sm-art-me02-acciaio-met — medium-dark charcoal brushed metal
UPDATE materials SET
  lightness = 44, warmth = 0.05, chroma = 5, hue_angle = 51, pattern = 35, cluster_id = NULL
WHERE technical_code = 'sm-art-me02-acciaio-met';

-- sm-art-me04-brunito-met — medium warm brown-grey brushed metal
UPDATE materials SET
  lightness = 36, warmth = 0.20, chroma = 20, hue_angle = 31, pattern = 15, cluster_id = NULL
WHERE technical_code = 'sm-art-me04-brunito-met';

-- sm-art-me05-piombo-met — very dark near-black brushed metal (⚠ pattern=100 likely noise)
UPDATE materials SET
  lightness = 19, warmth = 0.08, chroma = 9, hue_angle = 5, pattern = 100, cluster_id = NULL
WHERE technical_code = 'sm-art-me05-piombo-met';

-- sm-art-n002-mercurio-nirvana — light grey concrete/plaster (Nirvana series)
UPDATE materials SET
  lightness = 71, warmth = 0.07, chroma = 7, hue_angle = 35, pattern = 20, cluster_id = NULL
WHERE technical_code = 'sm-art-n002-mercurio-nirvana';

-- sm-art-ol01-zeus-olympus — medium grey marble with heavy veining (Olympus series)
UPDATE materials SET
  lightness = 68, warmth = 0.06, chroma = 6, hue_angle = 29, pattern = 39, cluster_id = NULL
WHERE technical_code = 'sm-art-ol01-zeus-olympus';

-- sm-art-ol04-apollo-olympus — very dark black marble with light veining
UPDATE materials SET
  lightness = 25, warmth = 0.15, chroma = 16, hue_angle = 29, pattern = 73, cluster_id = NULL
WHERE technical_code = 'sm-art-ol04-apollo-olympus';

-- sm-art-ol05-hera-olympus — white marble with prominent dark veining
UPDATE materials SET
  lightness = 77, warmth = 0.08, chroma = 8, hue_angle = 41, pattern = 47, cluster_id = NULL
WHERE technical_code = 'sm-art-ol05-hera-olympus';

-- sm-art-ol07-dionysus-olympus — light grey stone with speckled aggregate
UPDATE materials SET
  lightness = 73, warmth = 0.08, chroma = 8, hue_angle = 34, pattern = 24, cluster_id = NULL
WHERE technical_code = 'sm-art-ol07-dionysus-olympus';

-- sm-art-ol08-artemis-olympus — dark charcoal stone with speckled aggregate
UPDATE materials SET
  lightness = 38, warmth = 0.06, chroma = 6, hue_angle = 58, pattern = 26, cluster_id = NULL
WHERE technical_code = 'sm-art-ol08-artemis-olympus';

-- sm-art-ol09-calacatta-olympus — white marble with warm golden veining
UPDATE materials SET
  lightness = 93, warmth = 0.03, chroma = 4, hue_angle = NULL, pattern = 100, cluster_id = NULL
WHERE technical_code = 'sm-art-ol09-calacatta-olympus';

-- sm-art-ol10-arabescato-olympus — white marble with warm grey/beige veining
UPDATE materials SET
  lightness = 77, warmth = 0.01, chroma = 4, hue_angle = NULL, pattern = 100, cluster_id = NULL
WHERE technical_code = 'sm-art-ol10-arabescato-olympus';

-- sm-art-r006-bravo-rio — light warm greige stone with fine speckle (Rio series)
UPDATE materials SET
  lightness = 72, warmth = 0.11, chroma = 11, hue_angle = 34, pattern = 20, cluster_id = NULL
WHERE technical_code = 'sm-art-r006-bravo-rio';

-- sm-art-r007-delaplata-rio — medium light grey stone with fine speckle
UPDATE materials SET
  lightness = 69, warmth = 0.04, chroma = 4, hue_angle = NULL, pattern = 26, cluster_id = NULL
WHERE technical_code = 'sm-art-r007-delaplata-rio';

-- sm-art-r018-amazzonia-rio — light warm grey stone with subtle flow veining
UPDATE materials SET
  lightness = 78, warmth = 0.10, chroma = 10, hue_angle = 35, pattern = 20, cluster_id = NULL
WHERE technical_code = 'sm-art-r018-amazzonia-rio';

-- sm-art-r019-branco-rio — medium grey stone with subtle cloud pattern
UPDATE materials SET
  lightness = 54, warmth = 0.03, chroma = 3, hue_angle = NULL, pattern = 31, cluster_id = NULL
WHERE technical_code = 'sm-art-r019-branco-rio';

-- sm-art-r022-tevere-rio — light warm cream travertine with horizontal flow
UPDATE materials SET
  lightness = 86, warmth = 0.15, chroma = 15, hue_angle = 32, pattern = 20, cluster_id = NULL
WHERE technical_code = 'sm-art-r022-tevere-rio';

-- sm-art-re02-meriggio-reverso — light warm camel woven textile (Reverso series)
UPDATE materials SET
  lightness = 60, warmth = 0.33, chroma = 33, hue_angle = 32, pattern = 8, cluster_id = NULL
WHERE technical_code = 'sm-art-re02-meriggio-reverso';

-- sm-art-re05-notte-reverso — very dark brown near-black woven textile
UPDATE materials SET
  lightness = 20, warmth = 0.19, chroma = 20, hue_angle = 15, pattern = 59, cluster_id = NULL
WHERE technical_code = 'sm-art-re05-notte-reverso';

-- sm-art-re09-scintilla-polvere — medium warm terracotta/rust plain (Polvere finish)
UPDATE materials SET
  lightness = 42, warmth = 0.46, chroma = 46, hue_angle = 21, pattern = 6, cluster_id = NULL
WHERE technical_code = 'sm-art-re09-scintilla-polvere';

-- sm-art-re09-scintilla-reverso — medium warm terracotta woven textile (Reverso finish)
UPDATE materials SET
  lightness = 25, warmth = 0.47, chroma = 48, hue_angle = 19, pattern = 16, cluster_id = NULL
WHERE technical_code = 'sm-art-re09-scintilla-reverso';

-- sm-art-re10-riflesso-polvere — medium warm taupe-grey plain
UPDATE materials SET
  lightness = 38, warmth = 0.21, chroma = 21, hue_angle = 36, pattern = 14, cluster_id = NULL
WHERE technical_code = 'sm-art-re10-riflesso-polvere';

-- sm-art-re11-penombra-polvere — very dark near-black plain (⚠ pattern=100 likely noise)
UPDATE materials SET
  lightness = 26, warmth = -0.01, chroma = 6, hue_angle = 280, pattern = 100, cluster_id = NULL
WHERE technical_code = 'sm-art-re11-penombra-polvere';

-- sm-art-re11-penombra-reverso — very dark near-black woven textile (⚠ pattern=80 may be high)
UPDATE materials SET
  lightness = 19, warmth = 0.04, chroma = 4, hue_angle = NULL, pattern = 80, cluster_id = NULL
WHERE technical_code = 'sm-art-re11-penombra-reverso';

-- sm-art-s201-grand-soho — light warm greige oak, fine grain (SoHo series)
UPDATE materials SET
  lightness = 69, warmth = 0.17, chroma = 17, hue_angle = 33, pattern = 18, cluster_id = NULL
WHERE technical_code = 'sm-art-s201-grand-soho';

-- sm-art-s202-spring-soho — medium warm greige-brown oak
UPDATE materials SET
  lightness = 38, warmth = 0.28, chroma = 28, hue_angle = 31, pattern = 19, cluster_id = NULL
WHERE technical_code = 'sm-art-s202-spring-soho';

-- sm-art-s203-prince-soho — dark warm brown-grey oak
UPDATE materials SET
  lightness = 30, warmth = 0.17, chroma = 17, hue_angle = 16, pattern = 55, cluster_id = NULL
WHERE technical_code = 'sm-art-s203-prince-soho';

-- sm-art-t001-mohair-trama — very light cream fine woven textile (Trama series)
UPDATE materials SET
  lightness = 91, warmth = 0.10, chroma = 10, hue_angle = 35, pattern = 17, cluster_id = NULL
WHERE technical_code = 'sm-art-t001-mohair-trama';

-- sm-art-t002-shetland-trama — light warm greige fine woven textile
UPDATE materials SET
  lightness = 72, warmth = 0.14, chroma = 14, hue_angle = 41, pattern = 14, cluster_id = NULL
WHERE technical_code = 'sm-art-t002-shetland-trama';

-- sm-art-3190-annapurna-nero — very dark near-black stone texture
UPDATE materials SET
  lightness = 18, warmth = -0.06, chroma = 9, hue_angle = 259, pattern = 78, cluster_id = NULL
WHERE technical_code = 'sm-art-3190-annapurna-nero';
