-- BACKFILL PROFILES
-- Run this script to sync existing users from auth.users to public.profiles

insert into public.profiles (id, username, avatar_url, role)
select 
  id, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url',
  'user'
from auth.users
where id not in (select id from public.profiles);

-- Verify the count
select count(*) from public.profiles;
