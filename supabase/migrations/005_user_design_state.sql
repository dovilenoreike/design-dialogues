-- Migration: User design state persistence
-- Stores user selections so they persist across sessions

-- ============================================================================
-- 1. Create update_updated_at_column function if not exists
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Create user_design_state table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_design_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Design selections
  selected_style TEXT,
  selected_material TEXT,
  selected_category TEXT,
  freestyle_description TEXT DEFAULT '',

  -- Budget
  selected_tier TEXT DEFAULT 'Standard',
  form_data JSONB,

  -- Audit
  layout_audit_responses JSONB DEFAULT '{}',
  layout_audit_variables JSONB,

  -- Timeline
  user_move_in_date DATE,
  completed_tasks TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. Enable Row Level Security
-- ============================================================================
ALTER TABLE user_design_state ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS Policy - users can only access their own design state
-- ============================================================================
CREATE POLICY "Users manage own design state"
  ON user_design_state FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Auto-update timestamp trigger
-- ============================================================================
CREATE TRIGGER update_user_design_state_updated_at
  BEFORE UPDATE ON user_design_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. Create index for faster user lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_design_state_user_id ON user_design_state(user_id);
