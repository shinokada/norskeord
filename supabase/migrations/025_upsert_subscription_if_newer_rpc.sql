-- Migration 025: upsert_subscription_if_newer RPC
-- Run in Supabase Dashboard → SQL Editor.
--
-- Applies a Lemon Squeezy subscription event only if:
--   - no row exists yet for user_id, OR
--   - the stored ls_event_at is NULL, OR
--   - the stored ls_event_at is older than p_event_at.
--
-- This guards against stale/out-of-order webhook deliveries (Lemon Squeezy
-- is at-least-once, not ordering-guaranteed) overwriting a newer plan/status
-- with an older one. p_subscription_id is always written on an applied
-- write — a legitimate resubscribe should update the stored id; what this
-- guards against is an OLD event (for either the same or a different
-- subscription id) overwriting newer state, not a subscription id change
-- itself.
--
-- Returns true if the write was applied, false if skipped as stale.
--
-- SET search_path = '' prevents search_path injection (Supabase linter 0011).
-- REVOKE on anon: only the service-role webhook handler calls this.

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
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_applied integer := 0;
BEGIN
  INSERT INTO public.subscriptions (
    user_id, plan, status, billing_interval, valid_until,
    lemon_squeezy_subscription_id, lemon_squeezy_customer_id,
    lemon_squeezy_order_id, ls_event_at
  )
  VALUES (
    p_user_id, p_plan, p_status, p_billing_interval, p_valid_until,
    p_subscription_id, p_customer_id, p_order_id, p_event_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = p_plan,
    status = p_status,
    billing_interval = p_billing_interval,
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

-- ── Manual verification before wiring into the webhook handler ──────────────
-- Run these by hand against a scratch/test user_id (NOT a real subscriber)
-- to confirm GET DIAGNOSTICS reports 0 rows when the WHERE clause suppresses
-- the update, before relying on the return value from application code.
--
-- 1. First call — no existing row, should APPLY (returns true):
--   SELECT public.upsert_subscription_if_newer(
--     '00000000-0000-0000-0000-000000000000'::uuid,
--     'plus', 'active', 'month', NULL,
--     'test-sub-1', 'test-cust-1', 'test-order-1',
--     '2026-01-01T00:00:00Z'::timestamptz
--   );
--
-- 2. Newer event for the same user — should APPLY (returns true), plan
--    should now show 'free':
--   SELECT public.upsert_subscription_if_newer(
--     '00000000-0000-0000-0000-000000000000'::uuid,
--     'free', 'past_due', 'month', NULL,
--     'test-sub-1', 'test-cust-1', 'test-order-1',
--     '2026-01-02T00:00:00Z'::timestamptz
--   );
--
-- 3. OLDER event replayed after #2 — should be SKIPPED (returns false),
--    plan should still show 'free' from step 2, not revert to 'plus':
--   SELECT public.upsert_subscription_if_newer(
--     '00000000-0000-0000-0000-000000000000'::uuid,
--     'plus', 'active', 'month', NULL,
--     'test-sub-1', 'test-cust-1', 'test-order-1',
--     '2026-01-01T00:00:00Z'::timestamptz
--   );
--
-- 4. Check the stored row and clean up the scratch data afterwards:
--   SELECT * FROM public.subscriptions
--   WHERE user_id = '00000000-0000-0000-0000-000000000000';
--
--   DELETE FROM public.subscriptions
--   WHERE user_id = '00000000-0000-0000-0000-000000000000';
