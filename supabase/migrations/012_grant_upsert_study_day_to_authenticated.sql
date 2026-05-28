-- Migration 012: Recreate upsert_study_day and grant to authenticated role
-- Run in Supabase Dashboard → SQL Editor.
--
-- Migration 007 revoked EXECUTE from both anon and authenticated to satisfy
-- the Supabase security advisor. However, recordStudyDay() in progress.ts
-- calls this function from the client via supabase.rpc(), so authenticated
-- must have EXECUTE or the call silently fails and study_days is never written.
--
-- This migration also recreates the function in case it was never deployed
-- or was dropped. Re-granting authenticated is safe because:
--   1. SECURITY DEFINER + SET search_path = public prevents injection attacks.
--   2. The function only inserts/increments the row for p_user_id; study_days
--      holds no sensitive data (just a card count per day per user).
--   3. anon remains revoked.

CREATE OR REPLACE FUNCTION public.upsert_study_day(p_user_id uuid, p_day date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO study_days (user_id, day, cards)
  VALUES (p_user_id, p_day, 1)
  ON CONFLICT (user_id, day)
  DO UPDATE SET cards = study_days.cards + 1;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_study_day(uuid, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_study_day(uuid, date) TO authenticated;
