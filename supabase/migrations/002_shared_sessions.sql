-- Create shared_sessions table for partner sharing
CREATE TABLE IF NOT EXISTS shared_sessions (
  id TEXT PRIMARY KEY, -- Short unique ID (e.g., 'abc123')

  -- Design state
  uploaded_image TEXT, -- Base64 image (nullable - might be large)
  generated_image TEXT, -- Base64 generated design (nullable)
  selected_category TEXT,
  selected_material TEXT,
  selected_style TEXT,
  freestyle_description TEXT,

  -- Budget state
  selected_tier TEXT DEFAULT 'Standard',
  form_data JSONB, -- Budget calculator inputs

  -- Plan state
  user_move_in_date TIMESTAMPTZ,
  completed_tasks TEXT[], -- Array of completed task IDs

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'), -- Auto-expire after 30 days
  view_count INTEGER DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_sessions_id ON shared_sessions(id);
CREATE INDEX IF NOT EXISTS idx_shared_sessions_expires_at ON shared_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE shared_sessions ENABLE ROW LEVEL SECURITY;

-- Note: Edge functions use service role key which bypasses RLS

-- Function to generate short unique IDs
CREATE OR REPLACE FUNCTION generate_share_id(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Cleanup job: Delete expired sessions (run periodically via cron or manually)
-- SELECT delete_expired_shared_sessions();
CREATE OR REPLACE FUNCTION delete_expired_shared_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM shared_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
