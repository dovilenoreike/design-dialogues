-- Add cluster_id to materials for visual similarity grouping.
-- NULL = singleton (displayed individually, as today).
-- Populated by running: npx tsx scripts/cluster-materials.ts --apply

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS cluster_id text;
