-- Extend material_texture enum with additional surface types.
-- Archetypes are unchanged — all new types fall through the isPlainLike
-- branch in archetype-rules.ts (anything that is not wood, stone, or metal).

ALTER TYPE material_texture ADD VALUE IF NOT EXISTS 'textile';
ALTER TYPE material_texture ADD VALUE IF NOT EXISTS 'ceramic';
ALTER TYPE material_texture ADD VALUE IF NOT EXISTS 'concrete';
