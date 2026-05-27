
-- NOTE: Functions are not exported by Supabase's schema dump tool.
-- Manually maintained.

-- ── upsert_study_day ──────────────────────────────────────────────────────────
-- Increments the card count for a given user/day, inserting if absent.
-- Called from the client via supabase.rpc('upsert_study_day', { p_user_id, p_day }).
-- Deployed via: Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION upsert_study_day(p_user_id uuid, p_day date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO study_days (user_id, day, cards)
  VALUES (p_user_id, p_day, 1)
  ON CONFLICT (user_id, day)
  DO UPDATE SET cards = study_days.cards + 1;
$$;

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
