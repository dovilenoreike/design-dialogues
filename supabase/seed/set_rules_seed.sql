-- Accent warmth/lightness mismatch rules
-- These rules flag when an accent finish clashes with the overall palette tone.
-- Evaluation logic (Phase 3): compare accent warmth/lightness against avg of
-- floor + worktop + fronts in the current set.

INSERT INTO set_rules (applies_to, severity, description, condition) VALUES
(
  'accent',
  'warn',
  'Warm accent finish (gold, aged-bronze) clashes with a cool-toned palette',
  '{
    "type": "accent_warmth_mismatch",
    "accent_warmth_min": 0.25,
    "set_avg_warmth_max": 0.0
  }'::jsonb
),
(
  'accent',
  'warn',
  'Chrome looks cold against a very warm palette',
  '{
    "type": "accent_warmth_mismatch",
    "accent_warmth_max": 0.05,
    "set_avg_warmth_min": 0.3
  }'::jsonb
),
(
  'accent',
  'warn',
  'Bold dark accent (wine-red) clashes with a light, airy palette',
  '{
    "type": "accent_lightness_mismatch",
    "accent_lightness_max": 35,
    "set_avg_lightness_min": 68
  }'::jsonb
);
