CREATE TABLE credit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE credit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert credit request"
  ON credit_requests FOR INSERT
  WITH CHECK (true);
