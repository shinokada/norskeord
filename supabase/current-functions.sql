
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
