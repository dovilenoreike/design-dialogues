-- Add layout_pattern column to materials.
-- Captures the installation pattern shown in the material image (plank, chevron, etc.).
-- NULL for non-floor materials (walls, fronts, worktops, etc.).

ALTER TABLE materials
  ADD COLUMN layout_pattern text
  CHECK (layout_pattern IN ('plank', 'chevron', 'herringbone', 'tile'));

-- Backfill existing floor materials as 'plank' — all current floor images show planks.
UPDATE materials
SET layout_pattern = 'plank'
WHERE 'floor' = ANY(role);
