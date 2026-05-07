-- synonym_id groups materials that are visually identical for pairing purposes.
-- Materials sharing a synonym_id inherit each other's pair_compatibility entries
-- at a slightly reduced weight (see useGraphMaterials.ts SYNONYM_INHERIT_FACTOR).
-- NULL = no synonym relationship. Populated manually via SQL.

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS synonym_id text;
