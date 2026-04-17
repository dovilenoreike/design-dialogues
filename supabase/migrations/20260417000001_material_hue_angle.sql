-- Adds hue_angle for mathematical colour matching.
-- NULL = achromatic material (chroma ≤ ~5) — hue is meaningless for greys/whites/blacks.
-- Range: [0, 360) degrees. 0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta.

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS hue_angle float
  CHECK (hue_angle IS NULL OR (hue_angle >= 0 AND hue_angle < 360));
