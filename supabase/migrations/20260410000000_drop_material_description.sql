-- Drop the description column from materials.
-- UI now uses name, generation prompts use texture_prompt.
ALTER TABLE materials DROP COLUMN IF EXISTS description;
