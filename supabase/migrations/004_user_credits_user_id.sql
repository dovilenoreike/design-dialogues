-- Migration: Add user_id to user_credits table
-- Migrate from device_id (localStorage) to user_id (anonymous auth)

-- Add user_id column to user_credits
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make device_id nullable (was NOT NULL before, but new records will use user_id instead)
ALTER TABLE user_credits ALTER COLUMN device_id DROP NOT NULL;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all for now" ON user_credits;

-- Create RLS policy to allow users to manage their own credits
CREATE POLICY "Users manage own credits"
  ON user_credits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Make user_id unique (one credit record per user)
-- Note: Only add constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_credits_user_id_unique'
  ) THEN
    ALTER TABLE user_credits ADD CONSTRAINT user_credits_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Note: Keep device_id column temporarily for backwards compatibility during migration
-- It can be removed in a future migration once all users have been migrated
