-- Migration: Update tournament defaults for team count and stages
-- Run this in Supabase SQL Editor

-- Update default values for new tournaments
ALTER TABLE public.tournaments 
ALTER COLUMN max_teams SET DEFAULT 12,
ALTER COLUMN stages SET DEFAULT ARRAY['Qualifiers', 'Quarter', 'Semi', 'Final', 'Grand Final'];

-- Update existing tournaments with new stage names (optional)
UPDATE public.tournaments 
SET stages = ARRAY['Qualifiers', 'Quarter', 'Semi', 'Final', 'Grand Final']
WHERE stages IS NULL OR stages = ARRAY['Qualifiers', 'Quarter Finals', 'Semi Finals', 'Finals', 'Grand Finals'];

-- Add columns if they don't exist (for fresh installs)
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS max_teams integer DEFAULT 12,
ADD COLUMN IF NOT EXISTS total_stages integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS stages text[] DEFAULT ARRAY['Qualifiers', 'Quarter', 'Semi', 'Final', 'Grand Final'];
