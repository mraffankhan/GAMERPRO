-- Migration: Automation Schema (Discord & Detailed Stats)

-- 1. Update TOURNAMENTS
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS discord_category_id text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'open'; -- draft, open, ongoing, completed

-- 2. Update GROUPS
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS discord_channel_id text;

-- 3. Update GROUP_TEAMS (Stats & Status)
ALTER TABLE public.group_teams
ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'; -- pending, qualified, disqualified, eliminated

-- 4. USER_DISCORD_MAPPINGS Table
CREATE TABLE IF NOT EXISTS public.user_discord_mappings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  discord_user_id text not null unique,
  discord_username text,
  linked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.user_discord_mappings ENABLE ROW LEVEL SECURITY;

-- Policies for user_discord_mappings
DROP POLICY IF EXISTS "Users can view own discord mapping" ON public.user_discord_mappings;
CREATE POLICY "Users can view own discord mapping" ON public.user_discord_mappings 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all discord mappings" ON public.user_discord_mappings;
CREATE POLICY "Admins view all discord mappings" ON public.user_discord_mappings 
FOR SELECT USING (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Users can link own discord" ON public.user_discord_mappings;
CREATE POLICY "Users can link own discord" ON public.user_discord_mappings 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own discord" ON public.user_discord_mappings;
CREATE POLICY "Users can update own discord" ON public.user_discord_mappings 
FOR UPDATE USING (auth.uid() = user_id);
