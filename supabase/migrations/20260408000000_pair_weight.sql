-- Add weight column to pair_compatibility and auto-set via trigger
-- Weight reflects texture-pair importance: wood/stone anchors score higher

ALTER TABLE pair_compatibility ADD COLUMN weight float NOT NULL DEFAULT 1.0;

-- Trigger function: sets weight based on the texture of both materials
CREATE OR REPLACE FUNCTION set_pair_weight()
RETURNS TRIGGER AS $$
DECLARE
  texture_a text;
  texture_b text;
BEGIN
  SELECT texture INTO texture_a FROM materials WHERE id = NEW.material_a;
  SELECT texture INTO texture_b FROM materials WHERE id = NEW.material_b;

  IF (texture_a IN ('wood','stone') AND texture_b IN ('wood','stone')) THEN
    NEW.weight := 3.0;
  ELSIF (texture_a IN ('wood','stone') AND texture_b = 'plain')
     OR (texture_b IN ('wood','stone') AND texture_a = 'plain') THEN
    NEW.weight := 2.0;
  ELSE
    NEW.weight := 1.0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pair_weight_trigger
BEFORE INSERT ON pair_compatibility
FOR EACH ROW EXECUTE FUNCTION set_pair_weight();

-- Backfill existing rows with correct weights
UPDATE pair_compatibility pc
SET weight = CASE
  WHEN (ma.texture IN ('wood','stone') AND mb.texture IN ('wood','stone')) THEN 3.0
  WHEN (ma.texture IN ('wood','stone') AND mb.texture = 'plain')
    OR (mb.texture IN ('wood','stone') AND ma.texture = 'plain')        THEN 2.0
  ELSE 1.0
END
FROM materials ma, materials mb
WHERE ma.id = pc.material_a
  AND mb.id = pc.material_b;
