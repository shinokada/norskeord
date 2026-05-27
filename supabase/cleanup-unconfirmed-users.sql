-- ── pg_cron: cleanup-unconfirmed-users ────────────────────────────────────────
-- Deletes auth.users rows where the email was never confirmed after 7 days.
--
-- Because profiles, subscriptions, study_days, card_progress, etc. all use
-- ON DELETE CASCADE → references auth.users(id), deleting from auth.users
-- automatically cleans up every dependent public.* row.
--
-- Runs daily at 03:00 UTC (05:00 Oslo) — quiet hours, low traffic.
--
-- How to deploy:
--   Supabase Dashboard → Integrations → Cron → + New cron job
--   Name:     cleanup-unconfirmed-users
--   Schedule: 0 3 * * *
--   Command:  (paste the SELECT block below)
--
-- Or run the full SELECT cron.schedule(...) block in the SQL Editor once.
-- ──────────────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'cleanup-unconfirmed-users',
  '0 3 * * *',
  $$
    DELETE FROM auth.users
    WHERE email_confirmed_at IS NULL
      AND created_at < now() - INTERVAL '7 days';
  $$
);
