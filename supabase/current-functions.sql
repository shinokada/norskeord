
-- NOTE: Functions are not exported by Supabase's schema dump tool.
-- Manually maintained.

-- ── upsert_study_day ──────────────────────────────────────────────────────────
-- Increments the card count for a given user/day, inserting if absent.
-- Called from the client via supabase.rpc('upsert_study_day', { p_user_id, p_day }).
-- SET search_path = '' prevents search_path injection (Supabase linter 0011).
-- REVOKE on anon ensures only authenticated users can call this RPC.
-- Deployed via: Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION public.upsert_study_day(p_user_id uuid, p_day date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.study_days (user_id, day, cards)
  VALUES (p_user_id, p_day, 1)
  ON CONFLICT (user_id, day)
  DO UPDATE SET cards = public.study_days.cards + 1;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_study_day(uuid, date) FROM anon;

-- ── get_welcome_sequence_candidates ──────────────────────────────────────────
-- Returns users who signed up ~24 hours ago and haven't received a welcome
-- sequence email yet. Called by the welcome-sequence Edge Function / cron.
-- Internal only — not callable by end users.
-- SET search_path = '' prevents search_path injection (Supabase linter 0011).
-- REVOKE on anon + authenticated locks it down (Supabase linter 0028/0029).

CREATE OR REPLACE FUNCTION public.get_welcome_sequence_candidates()
RETURNS TABLE (id uuid, email text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id, u.email, u.created_at
  FROM auth.users u
  WHERE u.created_at >= now() - interval '25 hours'
    AND u.created_at <= now() - interval '23 hours'
    AND u.email_confirmed_at IS NOT NULL
    AND u.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.email_log el
      WHERE el.user_id = u.id
        AND el.email_type = 'welcome_sequence'
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_welcome_sequence_candidates() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_welcome_sequence_candidates() FROM authenticated;

-- ── pg_cron: send-push-reminders ──────────────────────────────────────────────
-- Calls the send-push-reminders Edge Function daily at 19:00 UTC (21:00 Oslo).
-- Set up via: Supabase Dashboard → Integrations → Cron → Edit
-- JWT verification is OFF on the Edge Function (Settings → Verify JWT: off),
-- so no Authorization header is needed.
--
-- To update: paste this into the cron job's command field in the dashboard.

SELECT cron.schedule(
  'send-push-reminders',
  '0 19 * * *',
  $$
    SELECT net.http_post(
      url    := 'https://yyohrwgwoubvwjhwnaec.supabase.co/functions/v1/send-push-reminders',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);

-- ── pg_cron: cleanup-unconfirmed-users ────────────────────────────────────────
-- Deletes auth.users rows where the email was never confirmed after 7 days.
-- Runs daily at 03:00 UTC (05:00 Oslo) — quiet hours, low traffic.
-- All dependent public.* rows (profiles, subscriptions, study_days, etc.)
-- are removed automatically via ON DELETE CASCADE.
-- See also: ./cleanup-unconfirmed-users.sql
--
-- To deploy: Supabase Dashboard → Integrations → Cron → + New cron job
--   Name:     cleanup-unconfirmed-users
--   Schedule: 0 3 * * *
--   Command:  paste the DELETE statement below

SELECT cron.schedule(
  'cleanup-unconfirmed-users',
  '0 3 * * *',
  $$
    DELETE FROM auth.users
    WHERE email_confirmed_at IS NULL
      AND created_at < now() - INTERVAL '7 days';
  $$
);
