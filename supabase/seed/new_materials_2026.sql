-- New materials: SM-art Essenza fronts + Gentas & SM-art Rio worktops
-- Upload WebP files before running:
--   Fronts/Rio → material-images/SM-art/
--   Gentas     → material-images/Gentas/
-- Column order: id, technical_code, name, role, texture,
--   lightness, warmth, pattern, texture_prompt, image_url, showroom_ids,
--   material_type, tier, description, chroma

INSERT INTO materials (id, technical_code, name, role, texture, lightness, warmth, pattern, texture_prompt, image_url, showroom_ids, material_type, tier, description, chroma) VALUES

-- ── SM-art Essenza (wood-effect LMDP fronts) ────────────────────────────────

(gen_random_uuid(), 'sm-art-es06-ginepro-essenza',
 '{"en":"Ginepro","lt":"Ginepro"}',
 ARRAY['front'], 'wood', 52, 0.35, 20,
 'Medium warm walnut-effect laminate with natural grain movement, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_ES06_Ginepro_Essenza.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 '{"en":"Medium warm walnut-effect with natural grain movement.","lt":"Vidutinio šiltumo riešutmedžio imitacija su natūraliu grūdėliu."}',
 10),

(gen_random_uuid(), 'sm-art-es02-coriandolo-essenza',
 '{"en":"Coriandolo","lt":"Coriandolo"}',
 ARRAY['front'], 'wood', 78, 0.30, 20,
 'Light blonde wood-effect laminate with fine vertical grain and warm beige undertones, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_ES02_Coriandolo_Essenza.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 '{"en":"Light blonde oak-effect with fine vertical grain and warm beige undertones.","lt":"Šviesi blondinė ąžuolo imitacija su smulkiu vertikaliu grūdėliu."}',
 8),

(gen_random_uuid(), 'sm-art-es03-malto-essenza',
 '{"en":"Malto","lt":"Malto"}',
 ARRAY['front'], 'wood', 62, 0.40, 20,
 'Warm honey oak wood-effect laminate with natural flowing grain, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_ES03_Malto_Essenza.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 '{"en":"Warm honey oak with natural flowing grain.","lt":"Šiltas medaus ąžuolas su natūraliu grūdėliu."}',
 12),

(gen_random_uuid(), 'sm-art-es04-anice-essenza',
 '{"en":"Anice","lt":"Anice"}',
 ARRAY['front'], 'wood', 52, 0.35, 20,
 'Medium warm walnut-effect laminate with natural grain movement, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_ES04_Anice_Essenza.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 '{"en":"Medium warm walnut-effect with natural grain movement.","lt":"Vidutinio šiltumo riešutmedžio imitacija su natūraliu grūdėliu."}',
 10),

(gen_random_uuid(), 'sm-art-es06-tabacco-essenza',
 '{"en":"Tabacco","lt":"Tabacco"}',
 ARRAY['front'], 'wood', 22, 0.45, 20,
 'Rich chocolate-brown walnut-effect laminate with fine vertical grain, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_ES06_Tabacco_Essenza.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 '{"en":"Rich chocolate-brown walnut-effect with fine vertical grain.","lt":"Sodrus šokoladinis riešutmedžio efektas su smulkiu vertikaliu grūdėliu."}',
 8),

(gen_random_uuid(), 'sm-art-es07-liquirizia-essenza',
 '{"en":"Liquirizia","lt":"Liquirizia"}',
 ARRAY['front'], 'wood', 10, 0.10, 15,
 'Near-black wood-effect laminate with subtle grain and cool dark undertones, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_ES07_Liquirizia_Essenza.webp',
 ARRAY['trukme'], 'LMDP', 'optimal',
 '{"en":"Near-black wood-effect with subtle grain and cool dark undertones.","lt":"Beveik juoda medienos imitacija su subtiliu grūdėliu ir vėsiais tamsiais atspalviais."}',
 4),

-- ── Gentas compact stone worktops ───────────────────────────────────────────
(gen_random_uuid(), 'gentas-5728-everest',
 '{"en":"Gentas Everest","lt":"Gentas Everest"}',
 ARRAY['worktop'], 'stone', 55, -0.10, 35,
 'Medium grey concrete-effect compact stone with subtle surface variation, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gentas/gentas-5728-everest.webp',
 ARRAY['trukme'], 'Kompaktinis akmuo', 'premium',
 '{"en":"Medium grey concrete-effect compact stone, subtle surface variation.","lt":"Vidutiniškai pilkas betono efekto kompaktinis akmuo."}',
 2),

(gen_random_uuid(), 'gentas-5807-twinkle-pristine',
 '{"en":"Gentas Twinkle Pristine","lt":"Gentas Twinkle Pristine"}',
 ARRAY['worktop'], 'stone', 72, -0.10, 10,
 'Very light cool grey compact stone with minimal texture and smooth matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gentas/gentas-5807-twinkle-pristine.webp',
 ARRAY['trukme'], 'Kompaktinis akmuo', 'premium',
 '{"en":"Very light cool grey compact stone, near-uniform smooth surface.","lt":"Labai šviesi vėsiai pilka kompaktinio akmens plokštė, lygus paviršius."}',
 2),

(gen_random_uuid(), 'gentas-5828-canyon',
 '{"en":"Gentas Canyon","lt":"Gentas Canyon"}',
 ARRAY['worktop'], 'stone', 57, -0.05, 55,
 'Cool grey compact stone with bold horizontal layered banding and travertine-like movement, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/Gentas/gentas-5828-canyon.webp',
 ARRAY['trukme'], 'Kompaktinis akmuo', 'premium',
 '{"en":"Cool grey with bold horizontal banding and travertine-like movement.","lt":"Vėsiai pilkas su ryškiais horizontaliais sluoksniais ir travertino judesiu."}',
 3),

-- ── SM-art Rio porcelain worktops ────────────────────────────────────────────
(gen_random_uuid(), 'sm-art-r018-amazzonia-rio',
 '{"en":"Amazzonia","lt":"Amazzonia"}',
 ARRAY['worktop'], 'stone', 62, -0.05, 58,
 'Light grey rough-textured natural stone effect with granular surface and irregular variation, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_R018_Amazzonia_Rio.webp',
 ARRAY['trukme'], 'Keraminė plokštė', 'optimal',
 '{"en":"Light grey natural stone effect with rough granular texture and irregular variation.","lt":"Šviesiai pilkas natūralaus akmens efektas su rupiu grūdėtu paviršiumi."}',
 3),

(gen_random_uuid(), 'sm-art-r019-branco-rio',
 '{"en":"Branco","lt":"Branco"}',
 ARRAY['worktop'], 'stone', 35, -0.10, 52,
 'Dark anthracite slate-effect stone with rough granular texture and cool dark tones, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_R019_Branco_Rio.webp',
 ARRAY['trukme'], 'Keraminė plokštė', 'optimal',
 '{"en":"Dark anthracite slate-effect with rough granular texture and cool dark tones.","lt":"Tamsus antracito skalūno efektas su rupiu paviršiumi ir vėsiais atspalviais."}',
 2),

(gen_random_uuid(), 'sm-art-r022-tevere-rio',
 '{"en":"Tevere","lt":"Tevere"}',
 ARRAY['worktop'], 'stone', 83, 0.20, 48,
 'Light warm beige travertine with distinctive horizontal banding and natural flowing movement, matte finish.',
 'https://nimrggpqcvgpgdmcermb.supabase.co/storage/v1/object/public/material-images/SM-art/SM_art_R022_Tevere_Rio.webp',
 ARRAY['trukme'], 'Keraminė plokštė', 'optimal',
 '{"en":"Light warm beige travertine with horizontal banding and natural movement.","lt":"Šviesi šilta travertino imitacija su horizontaliais sluoksniais ir natūraliu judėjimu."}',
 6);
