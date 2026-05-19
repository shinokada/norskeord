-- Migration 007: Security fixes
-- Addresses all errors and warnings from Supabase security advisor.

-- ── 1. Drop email_subscribers_with_email view ────────────────────────────────
-- This view joined auth.users, exposing user emails to anon/authenticated roles.
-- The email lesson feature has been removed from the frontend; this view is no
-- longer needed. Fixes:
--   ERROR: auth_users_exposed
--   ERROR: security_definer_view
DROP VIEW IF EXISTS public.email_subscribers_with_email;


-- ── 2. Fix upsert_study_day: mutable search_path + revoke public execute ─────
-- Recreate the function with SET search_path = public to prevent search_path
-- injection attacks. Also revoke EXECUTE from anon and authenticated roles —
-- only the service role (used by the server) should call this function. Fixes:
--   WARN: function_search_path_mutable
--   WARN: anon_security_definer_function_executable
--   WARN: authenticated_security_definer_function_executable

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
REVOKE EXECUTE ON FUNCTION public.upsert_study_day(uuid, date) FROM authenticated;


-- ── 3. Leaked password protection ───────────────────────────────────────────
-- Cannot be fixed via SQL migration. Enable manually in the Supabase dashboard:
-- Authentication → Providers → Email → "Enable Leaked Password Protection"
-- (checks passwords against HaveIBeenPwned.org)
