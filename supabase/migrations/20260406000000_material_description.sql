-- Add description field to materials table
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS description jsonb; -- { "en": "...", "lt": "..." }

-- Populate descriptions from local TypeScript material data

-- FLOORING
UPDATE materials SET description = '{"en":"Natural oak texture.","lt":"Natūralaus ąžuolo tekstūra."}' WHERE technical_code = 'aspecta-baron';
UPDATE materials SET description = '{"en":"Medium dark grey chevron vinyl flooring with irregular tone, wood-effect finish. Soft matte finish, subtle grain, gentle variation in tone.","lt":"Pilkšva ąžuolo tekstūra."}' WHERE technical_code = 'constance-chevrone';
UPDATE materials SET description = '{"en":"Light warm-oak chevron floor with a matte finish. Soft natural wood grain, gentle colour variation, classic V-shaped pattern.","lt":"Šviesios šilto ąžuolo eglutės rašto grindys."}' WHERE technical_code = 'solido-como';
UPDATE materials SET description = '{"en":"Honeyed oak in darker medium tone and herringbone pattern","lt":"Šiltas, vidutinio atspalvio natūralaus ąžuolo tekstūra"}' WHERE technical_code = 'macadamia';
UPDATE materials SET description = '{"en":"Warm smoked oak in a herringbone pattern.","lt":"Šiltas rūkytas ąžuolas eglutės raštu."}' WHERE technical_code = '525-calisson-oak';
UPDATE materials SET description = '{"en":"Light natural oak parquet, matte finish, subtle grain, laid in a mosaic pattern, Scandinavian feel.","lt":"Šviesaus ąžuolo tekstūra."}' WHERE technical_code = 'pure-scandi-flooring';
UPDATE materials SET description = '{"en":"Light concrete texture with subtle warm undertones, matte finish.","lt":"Šviesaus betono tekstūra."}' WHERE technical_code = 'light-concrete';
UPDATE materials SET description = '{"en":"Natural light smoked oak flooring","lt":"Natūralios šviesiai rūkyto ąžuolo tekstūra"}' WHERE technical_code = 'solido-bolsena';
UPDATE materials SET description = '{"en":"Light concrete texture","lt":"Šviesi betono tekstūra"}' WHERE technical_code = 'solido-pearl';
UPDATE materials SET description = '{"en":"Natural light smoked oak flooring","lt":"Natūralios šviesiai rūkyto ąžuolo tekstūra"}' WHERE technical_code = 'nagoja-duron';
UPDATE materials SET description = '{"en":"Warm almond-toned oak vinyl flooring, matte finish.","lt":"Šilto migdolo tono ąžuolo vinilinės grindys, matinis paviršius."}' WHERE technical_code = 'aspecta-almond';
UPDATE materials SET description = '{"en":"Cool grey-toned oak vinyl flooring, matte finish.","lt":"Vėsaus pilko tono ąžuolo vinilinės grindys, matinis paviršius."}' WHERE technical_code = 'aspecta-brienz';
UPDATE materials SET description = '{"en":"Warm brown-toned oak vinyl flooring, matte finish.","lt":"Rudo ąžuolo vinilinės grindys, matinis paviršius."}' WHERE technical_code = 'aspecta-maggiore';
UPDATE materials SET description = '{"en":"Warm brown-toned oak vinyl flooring, matte finish.","lt":"Tamsaus ąžuolo vinilinės grindys, matinis paviršius."}' WHERE technical_code = 'aspecta-burned';

-- CABINET FRONTS
UPDATE materials SET description = '{"en":"Flat matte off-white.","lt":"Matinė šilta balta spalva."}' WHERE technical_code = 'off-white-matte';
UPDATE materials SET description = '{"en":"Flat matte off-white.","lt":"Šilta balta spalva."}' WHERE technical_code = 'velvet-1648';
UPDATE materials SET description = '{"en":"Dark khaki-brown fronts with a subtle linear texture.","lt":"Chaki-ruda su subtilia linijine tekstūra."}' WHERE technical_code = 'alvis-elitis-02-dy';
UPDATE materials SET description = '{"en":"Rich walnut veneer with deep chocolate brown tones and matte finish","lt":"Sodrus riešutmedžio tekstūra"}' WHERE technical_code = 'alvis-velazques-05';
UPDATE materials SET description = '{"en":"Fjord Green flat texture, a pastel grey-blue with green undertones","lt":"Jūros šviesiai mėlyna matinė tekstūra"}' WHERE technical_code = 'velvet-4246';
UPDATE materials SET description = '{"en":"Light taupe matte flat finish","lt":"Šviesiai pilkšvai ruda matinis paviršius"}' WHERE technical_code = 'egger-taupe-grey';
UPDATE materials SET description = '{"en":"Rich, deep, earthy brown flat texture","lt":"Šokolado, žemiška ruda tekstūra"}' WHERE technical_code = 'valchromat-chocolate';
UPDATE materials SET description = '{"en":"Garrison grey colour with blue undertone. Flat surfaces.","lt":"Rūką primenanti melsvai pilka."}' WHERE technical_code = 'velvet-3301';
UPDATE materials SET description = '{"en":"Matte dark brown cabinet fronts with fine horizontal wood grain texture","lt":"Matinė tamsiai ruda medienos tekstūra"}' WHERE technical_code = 'egger-dark-grey-fineline';
UPDATE materials SET description = '{"en":"Matte medium grey cabinet fronts with fine horizontal wood grain texture","lt":"Matinė vidutiniškai pilka medienos tekstūra"}' WHERE technical_code = 'egger-medium-grey-fineline';
UPDATE materials SET description = '{"en":"Matte grey-green color.","lt":"Matinė pilkai žalia spalva."}' WHERE technical_code = 'velvet-3702';
UPDATE materials SET description = '{"en":"Light taupe texture with a subtle vertical ribbed texture","lt":"Šviesi pilkšvai ruda tekstūra su subtiliu vertikaliu rievėjimu"}' WHERE technical_code = 'alvic-vulcano';
UPDATE materials SET description = '{"en":"Graphite matte – deep dark grey surface with a smooth, velvety matte texture","lt":"Grafito matinis – gilus tamsiai pilkas paviršius"}' WHERE technical_code = 'valchromat-black';
UPDATE materials SET description = '{"en":"Natural warm-toned wood with subtle vertical grain.","lt":"Natūralus šilto atspalvio medis."}' WHERE technical_code = 'egger-h1385-st40';
UPDATE materials SET description = '{"en":"Rich brick-red colour matte finish.","lt":"Sodriai plytų raudonos spalvos matinis paviršius."}' WHERE technical_code = 'velvet-5983';
UPDATE materials SET description = '{"en":"Light oak veneer fronts, vertical grain, matte natural oil finish","lt":"Šviesaus ąžuolo tekstūra."}' WHERE technical_code = 'light-oak-veneer';
UPDATE materials SET description = '{"en":"Natural oak veneer, vertical grain, amber undertones, matte natural oil finish","lt":"Natūralaus medžio tekstūra"}' WHERE technical_code = 'natural-oak-veneer-amber';
UPDATE materials SET description = '{"en":"Dark wood vertical texture and matte finish","lt":"Rudo medžio tekstūra"}' WHERE technical_code = 'egger-brown-casella-oak';
UPDATE materials SET description = '{"en":"Light natural wood vertical texture and matte finish","lt":"Šviesas natūralaus medžio tekstūra"}' WHERE technical_code = 'egger-light-natural-casella-oak';
UPDATE materials SET description = '{"en":"Black Carbon and Wood Texture","lt":"Juoda anglies ir medžio tekstūra"}' WHERE technical_code = 'skin-carbon-fumo';
UPDATE materials SET description = '{"en":"Dark wood vertical texture and matte finish","lt":"Tamsi medžio tektūra"}' WHERE technical_code = 'alvi-goya-03-na';
UPDATE materials SET description = '{"en":"Warm greige wood grain with vertical texture","lt":"Šiltas greige medienos grūdėlių piešinys"}' WHERE technical_code = 'alvic-goya-02';
UPDATE materials SET description = '{"en":"Warm greige wood grain with vertical texture","lt":"Šiltas greige medienos grūdėlių piešinys"}' WHERE technical_code = 'alvic-goya-01';
UPDATE materials SET description = '{"en":"Soft charcoal-black matte finish","lt":"Minkšta anglies juodumo matinė tekstūra"}' WHERE technical_code = 'velvet-1302';
UPDATE materials SET description = '{"en":"Light natural oak with fine vertical grain","lt":"Šviesi natūrali ąžuolo mediena su smulkiu vertikaliu grūdėliu"}' WHERE technical_code = 'alvic-valazquez-04';
UPDATE materials SET description = '{"en":"Deep warm walnut with fine vertical grain","lt":"Tamsus šiltas riešutas su smulkiu vertikaliu grūdėliu"}' WHERE technical_code = 'alvic-valazquez-05';
UPDATE materials SET description = '{"en":"Sage grey matte lacquer finish","lt":"Pilkai žalsvai matinė lakuota spalva"}' WHERE technical_code = 'velvet-3703';
UPDATE materials SET description = '{"en":"Warm greige matte lacquer finish","lt":"Šilta greige matinė lakuota spalva"}' WHERE technical_code = 'velvet-7361';
UPDATE materials SET description = '{"en":"Warm natural oak wood grain","lt":"Šiltas natūralaus ąžuolo medienos raštas"}' WHERE technical_code = 'egger-natural-casella-oak';
UPDATE materials SET description = '{"en":"Warm natural oak wood grain","lt":"Šiltas natūralaus ąžuolo medienos raštas"}' WHERE technical_code = 'egger-dark-brown-eucalypthus';
UPDATE materials SET description = '{"en":"Light greige flat matte finish","lt":"Švelnios šviesiai greige spalvos matinės tekstūros"}' WHERE technical_code = 'velvet-7473';
UPDATE materials SET description = '{"en":"Off white flat matte finish","lt":"Švelnios šviesiai greige spalvos matinės tekstūros"}' WHERE technical_code = 'velvet-1551';
UPDATE materials SET description = '{"en":"Dark bronze flat matte finish","lt":"Tamsi bronza matinės tekstūros"}' WHERE technical_code = 'pearl-7901';
UPDATE materials SET description = '{"en":"Flat matte off-white.","lt":"Šilta balta spalva."}' WHERE technical_code = 'egger-premium-white-worktop';
UPDATE materials SET description = '{"en":"Charcoal slate colour with blue undertones","lt":"Nakties mėlyna su pilkšvais atspalviais"}' WHERE technical_code = 'velvet-7574';
UPDATE materials SET description = '{"en":"Light grey texture","lt":"Šviesiai pilka tekstūra"}' WHERE technical_code = 'velvet-7393';

-- WORKTOPS
UPDATE materials SET description = '{"en":"Dark grey marble with dramatic, busy pattern: mixed charcoal, grey, and subtle warm inclusions, irregular mineral texture","lt":"Tamsiai pilkas akmens raštas."}' WHERE technical_code = 'egger-f244-st76';
UPDATE materials SET description = '{"en":"Soft beige worktops, stone-textured surface","lt":"Šilta balta akmens tekstūra"}' WHERE technical_code = 'egger-f229-st75';
UPDATE materials SET description = '{"en":"Stone-textured warm white","lt":"Šilta balta su akmens tekstūra"}' WHERE technical_code = 'icono-c43-eleganza-bianco';
UPDATE materials SET description = '{"en":"Smooth grey stone finish","lt":"Lygus pilko akmens paviršius"}' WHERE technical_code = 'egger-u702-st75';
UPDATE materials SET description = '{"en":"Dark grey stone texture","lt":"Tamsiai pilka akmens tekstūra"}' WHERE technical_code = 'fondi-23-vulcano-grigia';
UPDATE materials SET description = '{"en":"Warm grey-brown medium tone marble with white veining and a calm, honed stone texture.","lt":"Šilta pilka marmuro tekstūra."}' WHERE technical_code = 'fondi-40-peperino-marmo';
UPDATE materials SET description = '{"en":"Bold white and black marble calacatta viola texture.","lt":"Drąsi juodo ir balto marmuro tekstūra."}' WHERE technical_code = 'calacatta-viola';
UPDATE materials SET description = '{"en":"Natural soft grey-beige marble, cloudy movement, dark rich veins.","lt":"Šviesaus natūralaus akmens tekstūra."}' WHERE technical_code = 'grey-beige-marble';
UPDATE materials SET description = '{"en":"Deep black marble featuring white veining","lt":"Juodas marmuras su baltomis gyslelėmis"}' WHERE technical_code = 'icono-marquina-cava';
UPDATE materials SET description = '{"en":"Grey concrete texture with subtle warm undertones","lt":"Pilkas betonas su subtiliais šiltais atspalviais"}' WHERE technical_code = 'icono-sereno-noto';
UPDATE materials SET description = '{"en":"Light grey marble with soft white veining","lt":"Šviesiai pilkas marmuras su subtiliomis baltomis gyslelėmis"}' WHERE technical_code = 'icono-arabesca-marmo';
UPDATE materials SET description = '{"en":"Dark grey-brown stone with warm rust veining","lt":"Tamsiai pilkai rudas akmuo su šiltomis rūdžių gyslelėmis"}' WHERE technical_code = 'icono-picasso-marrone';
UPDATE materials SET description = '{"en":"White stone with bold texture","lt":"Baltas akmuo su charakteringu raštu"}' WHERE technical_code = 'icono-laurent-carrata';
UPDATE materials SET description = '{"en":"Light warm marble with soft grey veining","lt":"Šviesi šilta marmurinė tekstūra su subtiliomis pilkomis gyslelėmis"}' WHERE technical_code = 'fondi-32-vento-marmo';
UPDATE materials SET description = '{"en":"Warm beige marble with soft brown veining","lt":"Šiltas bežinis marmuras su subtiliomis rudomis gyslelėmis"}' WHERE technical_code = 'egger-cremona-marble';
UPDATE materials SET description = '{"en":"Dark grey-black marble with subtle white veining","lt":"Tamsiai pilkai juodas marmuras su subtiliomis baltomis gyslelėmis"}' WHERE technical_code = 'egger-soft-black';

-- TILES
UPDATE materials SET description = '{"en":"Warm beige limestone-look tiles with a soft sandy texture","lt":"Šiltos smėlio spalvos kalkakmenio imitacijos plytelės"}' WHERE technical_code = 'florim-sensi-lithos-grey';
UPDATE materials SET description = '{"en":"Soft white stone-effect tiles with subtle texture, matte finish.","lt":"Švelnios baltos akmens tekstūros plytelės."}' WHERE technical_code = 'soft-white-stone-tiles';
UPDATE materials SET description = '{"en":"Matte khaki-brown small ribbed tiles with horizontal oval reliefs","lt":"Reljefinės chaki-rudos spalvos plytelės"}' WHERE technical_code = 'marazzi-confetto-kaki';
UPDATE materials SET description = '{"en":"Matte terrazzo-look stone tiles with beige and warm grey base and mixed stone fragments","lt":"Šiltos terazo stiliaus plytelės."}' WHERE technical_code = 'ragno-eterna-mix';
UPDATE materials SET description = '{"en":"Matte off-white handmade-look tiles with slightly uneven edges and soft warm-white tone","lt":"Baltos rankų darbo stiliaus plytelės."}' WHERE technical_code = 'vaniglia-lux-terramater';
UPDATE materials SET description = '{"en":"Vertically striped graphite tiles","lt":"Vertikaliai frezuotos grafito plytelės"}' WHERE technical_code = 'living-ceramics-oda-ductile-classic';
UPDATE materials SET description = '{"en":"Dark graphite colour stone-textured surface tiles","lt":"Grafito spalvos akmens tekstūra"}' WHERE technical_code = 'living-ceramics-oda-classic-soft';
UPDATE materials SET description = '{"en":"Ribbed tiles as subtle vertical accents of white stone texture","lt":"Rievėtos plytelės kaip subtilūs vertikalūs balto akmens tekstūros akcentai"}' WHERE technical_code = 'living-ceramics-oda-ductile-ice-coast';
UPDATE materials SET description = '{"en":"Dark grey marble with dramatic, busy pattern: mixed charcoal, grey, and subtle warm inclusions, irregular mineral texture","lt":"Tamsiai pilkas akmens raštas."}' WHERE technical_code = 'marazzi-grande-marble-look-blue-grey';
UPDATE materials SET description = '{"en":"Dark grey stone with a mixed mineral pattern: deep charcoal base, lighter grey veining, and scattered textured stone fragments.","lt":"Tamsiai pilkas akmuo su mišriu mineraliniu raštu."}' WHERE technical_code = 'anthology-dark-natural';
UPDATE materials SET description = '{"en":"Dark taupe-grey natural stone texture with high variation, cloudy movement and fractured veining. Irregular white mineral streaks cutting through the surface.","lt":"Pilkos plytelės su uolų tekstūra"}' WHERE technical_code = 'florim-onyx-silver-porphyry';
UPDATE materials SET description = '{"en":"Dark fossil limestone tiles with organic shell inclusions and a muted bluish-grey undertone.","lt":"Tamsios fosilijų kalkakmenio raštas."}' WHERE technical_code = 'oda-classic-soft-textured';
UPDATE materials SET description = '{"en":"Deep black marble tiles featuring white veining","lt":"Gilios juodos marmuro plytelės su baltomis gyslelėmis"}' WHERE technical_code = 'atlas-marvel-nero-marquina';
UPDATE materials SET description = '{"en":"Soft light of white tiles with subtle texture, matte finish.","lt":"Švelnios šviesios spalvos akmens tekstūros plytelės."}' WHERE technical_code = 'florim-sensi-lithos-white';

-- ACCENTS
UPDATE materials SET description = '{"en":"Brushed bronze or muted brass texture","lt":"Šlifuotos bronzos arba švelnios žalvario tekstūra"}' WHERE technical_code = 'brushed-bronze';
UPDATE materials SET description = '{"en":"Warm off-white wall paint, matte finish.","lt":"Šilta balta matinė sienų danga."}' WHERE technical_code = 'off-white-wall';
UPDATE materials SET description = '{"en":"Warm signal white wall paint, matte finish.","lt":"Neutrali balta matinė sienų danga."}' WHERE technical_code = 'signal-white-paint';
UPDATE materials SET description = '{"en":"Aged bronze finish, warm undertones.","lt":"Sendintos bronzos detalės, šilti atspalviai."}' WHERE technical_code = 'aged-bronze';
UPDATE materials SET description = '{"en":"Chrome finish, modern look.","lt":"Chromo detalės, moderni išvaizda."}' WHERE technical_code = 'chrome';
UPDATE materials SET description = '{"en":"Gold finish, luxurious appearance.","lt":"Aukso detalės, prabangi išvaizda."}' WHERE technical_code = 'gold';
UPDATE materials SET description = '{"en":"Wine red finish, rich and warm.","lt":"Vyno raudonos detalės, netikėti akcentai."}' WHERE technical_code = 'wine-red';
