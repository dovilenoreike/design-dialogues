-- Add moodboard state columns to shared_sessions table
ALTER TABLE shared_sessions
ADD COLUMN IF NOT EXISTS vibe_tag TEXT,
ADD COLUMN IF NOT EXISTS moodboard_slots JSONB;
