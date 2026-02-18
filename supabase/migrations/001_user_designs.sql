-- Migration: Two-table schema for uploads and generations with separate retention strategies
-- Run this in Supabase SQL Editor or via CLI

-- Enable anonymous auth (do this in Authentication > Providers in Dashboard)

-- ============================================================================
-- Drop existing schema if migrating from old single-table approach
-- ============================================================================
DROP TABLE IF EXISTS user_designs CASCADE;

-- ============================================================================
-- 1. Create user_uploads table (one per room - replaced on new upload)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_category TEXT NOT NULL,
  image_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, room_category)  -- Only one upload per room per user
);

-- ============================================================================
-- 2. Create user_generations table (one per room+style+palette combo)
-- This preserves explorations - switching back to a previous combo restores it
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_category TEXT NOT NULL,
  selected_style TEXT NOT NULL,
  selected_material TEXT NOT NULL,  -- Use "freestyle" for freestyle mode
  image_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, room_category, selected_style, selected_material)
);

-- ============================================================================
-- 3. Enable Row Level Security
-- ============================================================================
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_generations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS Policies - users can only access their own data
-- ============================================================================
CREATE POLICY "Users manage own uploads"
  ON user_uploads FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own generations"
  ON user_generations FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Create user-images storage bucket (public for easy access)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-images', 'user-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. Storage policies - users can upload to their own folder
-- ============================================================================
DO $$
BEGIN
  -- Drop existing policies if they exist (for clean migration)
  DROP POLICY IF EXISTS "Users upload own images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
  DROP POLICY IF EXISTS "Users manage own images" ON storage.objects;
  DROP POLICY IF EXISTS "Users delete own images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-images');

CREATE POLICY "Users manage own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
