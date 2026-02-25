CREATE TABLE feature_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id text NOT NULL,
  email text NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  UNIQUE(feature_id, email)
);
CREATE INDEX idx_feature_waitlist_feature_id ON feature_waitlist(feature_id);
CREATE INDEX idx_feature_waitlist_email ON feature_waitlist(email);
ALTER TABLE feature_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can sign up" ON feature_waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can view" ON feature_waitlist FOR SELECT USING (false);
