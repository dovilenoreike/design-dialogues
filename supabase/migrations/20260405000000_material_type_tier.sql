-- Add material_type and tier columns to support full material data in Supabase
-- These migrate the remaining TypeScript-only fields to become Supabase-only fields.

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS material_type text,
  ADD COLUMN IF NOT EXISTS tier          text CHECK (tier IN ('budget', 'optimal', 'premium'));
