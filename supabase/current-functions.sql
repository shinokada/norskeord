
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

-- ── upsert_subscription_if_newer ─────────────────────────────────────────────
-- Applies a Lemon Squeezy subscription webhook event only if it's newer than
-- whatever is currently stored, guarding against out-of-order/retried
-- webhook deliveries overwriting newer state with stale data.
-- p_plan / p_billing_interval are nullable: pass NULL to leave the stored
-- value unchanged (used by branches like cancelled/paused/resumed that don't
-- intend to touch plan or billing_interval). p_valid_until has no such
-- preserve semantics — every caller always passes an explicit intended
-- value, including intentional NULL on subscription_expired.
-- Called from src/routes/api/lemon/webhook/+server.ts via
-- supabase.rpc('upsert_subscription_if_newer', { ... }).
-- SET search_path = '' prevents search_path injection (Supabase linter 0011).
-- REVOKE on anon: only the service-role webhook handler calls this.
-- Deployed via: Supabase Dashboard → SQL Editor (024, 025, 026)

CREATE OR REPLACE FUNCTION public.upsert_subscription_if_newer(
  p_user_id uuid,
  p_plan text,
  p_status text,
  p_billing_interval text,
  p_valid_until timestamptz,
  p_subscription_id text,
  p_customer_id text,
  p_order_id text,
  p_event_at timestamptz
)
RETURNS boolean  -- true if the write was applied, false if skipped as stale
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_applied boolean := false;
BEGIN
  INSERT INTO public.subscriptions (
    user_id, plan, status, billing_interval, valid_until,
    lemon_squeezy_subscription_id, lemon_squeezy_customer_id,
    lemon_squeezy_order_id, ls_event_at
  )
  VALUES (
    p_user_id, COALESCE(p_plan, 'free'), p_status, p_billing_interval, p_valid_until,
    p_subscription_id, p_customer_id, p_order_id, p_event_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = COALESCE(p_plan, public.subscriptions.plan),
    status = p_status,
    billing_interval = COALESCE(p_billing_interval, public.subscriptions.billing_interval),
    valid_until = p_valid_until,
    lemon_squeezy_subscription_id = p_subscription_id,
    lemon_squeezy_customer_id = p_customer_id,
    lemon_squeezy_order_id = p_order_id,
    ls_event_at = p_event_at
  WHERE
    public.subscriptions.ls_event_at IS NULL
    OR public.subscriptions.ls_event_at < p_event_at;

  GET DIAGNOSTICS v_applied = ROW_COUNT;
  RETURN v_applied > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_subscription_if_newer
  (uuid, text, text, text, timestamptz, text, text, text, timestamptz) FROM anon;

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
