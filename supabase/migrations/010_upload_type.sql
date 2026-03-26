-- Add upload_type to user_uploads so floorplan/sketch type survives page reload
ALTER TABLE user_uploads ADD COLUMN IF NOT EXISTS upload_type TEXT NOT NULL DEFAULT 'photo';
