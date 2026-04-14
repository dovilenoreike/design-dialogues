-- New materials: Fab & Gentas HPL worktops + Gizir, Kronospan, Skin, SM-art LMDP fronts
-- Upload images before running — suggested storage folders:
--   material-images/Fab/         ← fab-* files
--   material-images/Gentas/      ← gentas-* files (existing folder)
--   material-images/Gizir/       ← gizir-* files
--   material-images/Kronospan/   ← kronospan-* files
--   material-images/Skin/        ← skin-* files
--   material-images/SM-art/      ← SM_art_* / SM-art-* files (existing folder)
-- NOTE: "kronospan-K696 -umber-primavera-oak.webp" has a space — rename before upload or encode as %20 in URL
-- Column order: id, technical_code, name, role, texture,
--   lightness, warmth, pattern, texture_prompt, image_url, showroom_ids,
--   material_type, tier, description, chroma

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, chroma) VALUES

-- ── Fab Compact HPL worktops ────────────────────────────────────────────────

(gen_random_uuid(), 'fab-6133-black-marble',
 '{"en":"FAB 6133 Black Marble","lt":"FAB 6133 Black Marble"}',
 ARRAY['worktop'], 'stone', 15, 0.15, 65,
 'Near-black marble with bold white and gold veining, dramatic flowing pattern, polished finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Fab/fab-6133-Black-Marble.webp',
 ARRAY['trukme'], 'Compact HPL', 'premium',
 5),

-- ── Gentas Compact HPL worktops ─────────────────────────────────────────────

(gen_random_uuid(), 'gentas-5716-vl-sydney',
 '{"en":"Gentas 5716 VL Sydney","lt":"Gentas 5716 VL Sydney"}',
 ARRAY['worktop'], 'stone', 38, 0.10, 70,
 'Dark grey stone with heavy swirling veining and dramatic movement, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gentas/gentas-5716-VL-Sydney.webp',
 ARRAY['trukme'], 'Compact HPL', 'premium',
 3),

(gen_random_uuid(), 'gentas-5811-pristine',
 '{"en":"Gentas 5811 Pristine","lt":"Gentas 5811 Pristine"}',
 ARRAY['worktop'], 'stone', 45, 0.15, 8,
 'Medium grey-green compact stone, near-uniform surface with very subtle tonal variation, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gentas/gentas-5811-pristine.webp',
 ARRAY['trukme'], 'Compact HPL', 'premium',
 4),

(gen_random_uuid(), 'gentas-5813-loreley-jupiter',
 '{"en":"Gentas 5813 Loreley Jupiter","lt":"Gentas 5813 Loreley Jupiter"}',
 ARRAY['worktop'], 'stone', 55, 0.05, 12,
 'Medium light grey concrete-effect compact stone with subtle tonal variation, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gentas/gentas-5813-Loreley-Jupiter.webp',
 ARRAY['trukme'], 'Compact HPL', 'premium',
 2),

(gen_random_uuid(), 'gentas-5831-ocala',
 '{"en":"Gentas 5831 Ocala","lt":"Gentas 5831 Ocala"}',
 ARRAY['worktop'], 'stone', 82, 0.20, 22,
 'Very light warm cream stone with soft mottled pattern and fine mineral variation, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gentas/gentas-5831-ocala.webp',
 ARRAY['trukme'], 'Compact HPL', 'premium',
 4),

-- ── Gizir LMDP fronts ───────────────────────────────────────────────────────

(gen_random_uuid(), 'gizir-af34-grey',
 '{"en":"Gizir AF34 Grey","lt":"Gizir AF34 Grey"}',
 ARRAY['front'], 'smooth', 55, -0.05, 0,
 'Solid medium grey matt lacquer, completely uniform surface.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gizir/gizir-AF34-grey.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 1),

(gen_random_uuid(), 'gizir-af35-light-grey',
 '{"en":"Gizir AF35 Light Grey","lt":"Gizir AF35 Light Grey"}',
 ARRAY['front'], 'smooth', 72, -0.05, 0,
 'Solid light grey matt lacquer with cool undertone, completely uniform surface.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gizir/gizir-AF35-light-grey.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 1),

(gen_random_uuid(), 'gizir-s027-mink',
 '{"en":"Gizir S027 Mink","lt":"Gizir S027 Mink"}',
 ARRAY['front'], 'smooth', 60, 0.40, 0,
 'Solid warm beige-taupe matt lacquer, completely uniform surface.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gizir/gizir-S027-Mink.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 8),

(gen_random_uuid(), 'gizir-s028-light-grey',
 '{"en":"Gizir S028 Light Grey","lt":"Gizir S028 Light Grey"}',
 ARRAY['front'], 'smooth', 55, 0.15, 0,
 'Solid medium greige matt lacquer with warm undertone, completely uniform surface.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gizir/gizir-S028-Light-Grey.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 3),

(gen_random_uuid(), 'gizir-t002-shetland',
 '{"en":"Gizir T002 Shetland","lt":"Gizir T002 Shetland"}',
 ARRAY['front'], 'fabric', 72, 0.10, 12,
 'Light sage-green fine linen textile texture with subtle woven pattern, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gizir/gizir-t002-shetland.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 5),

-- ── Kronospan LMDP fronts ────────────────────────────────────────────────────

(gen_random_uuid(), 'kronospan-k526-iron-surfside-ash',
 '{"en":"Kronospan K526 Iron Surfside Ash","lt":"Kronospan K526 Iron Surfside Ash"}',
 ARRAY['front'], 'wood', 25, -0.20, 20,
 'Dark teal-iron ash wood grain with fine vertical texture and cool deep tones, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-k526-iron-surfside-ash.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 8),

(gen_random_uuid(), 'kronospan-k696-umber-primavera-oak',
 '{"en":"Kronospan K696 Umber Primavera Oak","lt":"Kronospan K696 Umber Primavera Oak"}',
 ARRAY['front'], 'wood', 45, 0.20, 18,
 'Medium warm grey-brown oak grain with natural vertical movement, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Kronospan/kronospan-K696%20-umber-primavera-oak.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 6),

-- ── Skin LMDP fronts ────────────────────────────────────────────────────────

(gen_random_uuid(), 'skin-2526-partenone',
 '{"en":"Skin 2526 Partenone","lt":"Skin 2526 Partenone"}',
 ARRAY['front'], 'wood', 62, 0.40, 22,
 'Medium warm honey oak with flowing vertical grain and natural movement, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Skin/skin-2526_Partenone.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 10),

-- ── SM-art LMDP fronts ──────────────────────────────────────────────────────

(gen_random_uuid(), 'sm-art-me01-palladio-met',
 '{"en":"Palladio Met","lt":"Palladio Met"}',
 ARRAY['front'], 'metal', 58, 0.25, 10,
 'Warm greige brushed metal effect with fine vertical striations and subtle sheen, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_ME01_Palladio_Met_development.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 6),

(gen_random_uuid(), 'sm-art-me05-riflesso',
 '{"en":"Riflesso Met","lt":"Riflesso Met"}',
 ARRAY['front'], 'metal', 28, -0.10, 10,
 'Dark charcoal brushed metal effect with fine vertical striations and cool deep tones, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM-art-ME05_pannello_dettaglio_riflesso.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 2),

(gen_random_uuid(), 'sm-art-s202-spring-soho',
 '{"en":"Spring SoHo","lt":"Spring SoHo"}',
 ARRAY['front'], 'wood', 32, 0.30, 20,
 'Medium-dark warm brown oak with flowing vertical grain and natural movement, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM-art-S202_Spring_SoHo-dev.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 8),

(gen_random_uuid(), 'sm-art-s203-prince-soho',
 '{"en":"Prince SoHo","lt":"Prince SoHo"}',
 ARRAY['front'], 'wood', 18, 0.10, 18,
 'Very dark charcoal-brown oak with fine vertical grain and deep cool-warm tones, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM-art-S203_Prince_SoHo-dev.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 4),

(gen_random_uuid(), 'sm-art-t002-shetland-trama',
 '{"en":"Shetland Trama","lt":"Shetland Trama"}',
 ARRAY['front'], 'fabric', 72, 0.10, 12,
 'Light sage-green fine linen textile texture with subtle woven pattern, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM-art-T002-Shetland-Trama.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 5);
