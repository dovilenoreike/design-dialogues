-- Migrate pair_compatibility from UUID foreign keys → technical_code text keys.
-- Motivation: layout pattern variants share the same technical_code, so code-keyed
-- pairs are automatically inherited by all variants with no duplication.

-- 1. Add new code columns (nullable initially for backfill)
ALTER TABLE pair_compatibility
  ADD COLUMN code_a text,
  ADD COLUMN code_b text;

-- 2. Backfill from existing UUID data.
--    LEAST/GREATEST ensures alphabetical ordering (code_a < code_b).
UPDATE pair_compatibility pc
SET
  code_a = LEAST(ma.technical_code, mb.technical_code),
  code_b = GREATEST(ma.technical_code, mb.technical_code)
FROM materials ma, materials mb
WHERE ma.id = pc.material_a
  AND mb.id = pc.material_b;

-- 3. Enforce NOT NULL, FK integrity, uniqueness, and ordering
ALTER TABLE pair_compatibility
  ALTER COLUMN code_a SET NOT NULL,
  ALTER COLUMN code_b SET NOT NULL;

ALTER TABLE pair_compatibility
  ADD CONSTRAINT pair_compat_code_fk_a FOREIGN KEY (code_a) REFERENCES materials(technical_code),
  ADD CONSTRAINT pair_compat_code_fk_b FOREIGN KEY (code_b) REFERENCES materials(technical_code),
  ADD CONSTRAINT pair_compat_code_unique UNIQUE (code_a, code_b),
  ADD CONSTRAINT pair_compat_code_order CHECK (code_a < code_b);

-- 4. Drop old UUID columns (CASCADE removes the FK constraints and old UNIQUE/CHECK)
ALTER TABLE pair_compatibility
  DROP COLUMN material_a,
  DROP COLUMN material_b;

-- 5. Update weight trigger to resolve texture by technical_code instead of UUID
CREATE OR REPLACE FUNCTION set_pair_weight()
RETURNS TRIGGER AS $$
DECLARE
  texture_a text;
  texture_b text;
BEGIN
  SELECT texture INTO texture_a FROM materials WHERE technical_code = NEW.code_a;
  SELECT texture INTO texture_b FROM materials WHERE technical_code = NEW.code_b;

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
