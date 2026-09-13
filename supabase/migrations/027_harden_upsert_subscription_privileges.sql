-- Migration 027: Harden upsert_subscription_if_newer privileges and fix
-- GET DIAGNOSTICS row-count type
--
-- Run in Supabase Dashboard → SQL Editor.
--
-- Two fixes flagged by code review after 024-026 were already deployed:
--
-- 1. Privileges. Migrations 025/026 only ran
--      REVOKE EXECUTE ... FROM anon;
--    which relies on Supabase's project-level default privileges (new
--    functions are not auto-granted to PUBLIC the way vanilla Postgres
--    behaves — this repo's history in 007/012 for upsert_study_day only
--    ever needed to revoke from anon/authenticated specifically, never
--    PUBLIC). To remove any doubt for a function this sensitive — it's
--    SECURITY DEFINER and takes p_user_id as a raw parameter with no
--    ownership check — this migration is fully explicit: revoke from
--    PUBLIC and every non-service role, and grant only to service_role,
--    the sole intended caller (the webhook handler uses the service-role
--    client). Before running, you can confirm the current grants with:
--      SELECT grantee, privilege_type FROM information_schema.routine_privileges
--      WHERE routine_name = 'upsert_subscription_if_newer';
--
-- 2. Row-count type. v_applied was declared `boolean` but assigned an
--    integer via GET DIAGNOSTICS ... = ROW_COUNT, then compared with
--    `> 0`. This happened to work via PL/pgSQL's implicit output/input-
--    function fallback on assignment (integer -> text '0'/'1' -> boolean
--    via boolin, which accepts those as literal true/false), confirmed by
--    the manual test after 025 — but boolean has no comparison operator
--    with integer, so relying on that implicit coercion is fragile.
--    Using a genuine integer counter is the standard, unambiguous idiom
--    for GET DIAGNOSTICS ROW_COUNT.

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
  v_row_count integer := 0;
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

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RETURN v_row_count > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_subscription_if_newer
  (uuid, text, text, text, timestamptz, text, text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.upsert_subscription_if_newer
  (uuid, text, text, text, timestamptz, text, text, text, timestamptz)
  TO service_role;
