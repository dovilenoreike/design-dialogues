-- Create palette_waitlist table for collecting emails from users interested in coming-soon palettes
CREATE TABLE palette_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  palette_id text NOT NULL,
  email text NOT NULL,
  name text,
  budget_tier text,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  UNIQUE(palette_id, email)
);

-- Add indexes for efficient querying
CREATE INDEX idx_palette_waitlist_palette_id ON palette_waitlist(palette_id);
CREATE INDEX idx_palette_waitlist_email ON palette_waitlist(email);
CREATE INDEX idx_palette_waitlist_budget_tier ON palette_waitlist(budget_tier);

-- Enable row level security
ALTER TABLE palette_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (signups are public)
CREATE POLICY "Anyone can sign up for palette waitlist"
  ON palette_waitlist
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view waitlist data
CREATE POLICY "Only admins can view palette waitlist"
  ON palette_waitlist
  FOR SELECT
  USING (false);
