
-- NOTE: Functions are not exported by Supabase's schema dump tool.
-- Manually maintained below.

CREATE OR REPLACE FUNCTION public.upsert_study_day(p_user_id uuid, p_day date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  insert into study_days (user_id, day, cards)
  values (p_user_id, p_day, 1)
  on conflict (user_id, day)
  do update set cards = study_days.cards + 1;
$$;