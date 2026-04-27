-- Drop old collections_v3 (no frontend usage; data is being re-authored)
DROP TABLE IF EXISTS collections_v3;

-- collection_presets: curated designer presets, flexible across room types.
-- `materials` maps surface slot keys (from surfaces.ts) → technical_code strings.
-- e.g. {"floor":"solido-bolsena","bottomCabinets":"velvet-7393","worktops":"icono-arabesca-marmo"}
-- Different rooms simply use different slot keys — no schema change needed.
CREATE TABLE collection_presets (
  id            text PRIMARY KEY,
  name          jsonb NOT NULL,                      -- {"en":"Urban Dusk","lt":"Miesto prieblanda"}
  designer      text,
  vibe          text,                                -- "light-and-airy" | "warm-and-grounded" | "bold-and-moody"
  room_category text,                               -- "kitchen" | "living-room" | "bedroom" | "bathroom"
  image_url     text,                               -- one representative photo of the whole collection
  materials     jsonb NOT NULL DEFAULT '{}'::jsonb  -- slot_key -> technical_code
);

ALTER TABLE collection_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read collection_presets"
  ON collection_presets FOR SELECT USING (true);
