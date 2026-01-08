-- EdgeAI Carousel Gallery Tables
-- Run this in your Supabase SQL Editor

-- Create generations table
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id TEXT UNIQUE NOT NULL,
  hero_image_url TEXT,
  art_style TEXT NOT NULL,
  slide_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'complete', 'error')),
  video_url TEXT,
  zip_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create slides table
CREATE TABLE IF NOT EXISTS slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  original_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generations_generation_id ON generations(generation_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slides_generation_id ON slides(generation_id);

-- Enable Row Level Security
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on generations"
  ON generations FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on slides"
  ON slides FOR SELECT
  USING (true);

-- Create policies for insert/update (using anon key - adjust for production)
CREATE POLICY "Allow anon insert on generations"
  ON generations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anon update on generations"
  ON generations FOR UPDATE
  USING (true);

CREATE POLICY "Allow anon insert on slides"
  ON slides FOR INSERT
  WITH CHECK (true);

-- Storage buckets setup instructions:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create bucket: carousel-images (public)
-- 3. Create bucket: carousel-videos (public)
-- 4. Create bucket: hero-images (public)
-- 5. For each bucket, add policy: Allow public read (SELECT)
-- 6. For each bucket, add policy: Allow anon insert/update (INSERT, UPDATE)
