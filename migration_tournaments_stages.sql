-- Migration: Add team count and stages columns to tournaments
-- Run this in Supabase SQL Editor

ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS max_teams integer DEFAULT 16,
ADD COLUMN IF NOT EXISTS total_stages integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS stages text[] DEFAULT ARRAY['Qualifiers', 'Quarter Finals', 'Semi Finals', 'Finals', 'Grand Finals'];

-- Update existing tournaments with default values
UPDATE public.tournaments 
SET 
  max_teams = 16,
  total_stages = 5,
  stages = ARRAY['Qualifiers', 'Quarter Finals', 'Semi Finals', 'Finals', 'Grand Finals']
WHERE max_teams IS NULL;
