-- Migration 026: Preserve plan/billing_interval when not explicitly provided
--
-- Run in Supabase Dashboard → SQL Editor.
--
-- Problem: upsert_subscription_if_newer() (025) always overwrote plan and
-- billing_interval, but several webhook branches (subscription_cancelled,
-- subscription_paused, subscription_resumed/unpaused) never intended to
-- touch those columns — the pre-RPC code used a partial .update() that left
-- them alone. Passing a guessed value from those branches would risk
-- silently corrupting billing state.
--
-- Fix: p_plan and p_billing_interval become nullable. NULL means "leave the
-- stored value unchanged" (via COALESCE), so callers that don't intend to
-- change plan/billing_interval can pass NULL explicitly. valid_until is NOT
-- changed to this pattern — every call site always passes an explicit
-- intended value, including intentional NULL on subscription_expired.
--
-- CREATE OR REPLACE keeps the same function signature (types unchanged, only
-- now genuinely nullable), so no DROP FUNCTION / re-GRANT is needed.

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
    -- On first insert there's nothing to preserve, so fall back to 'free'/
    -- NULL if a branch that doesn't set plan/billing_interval somehow fires
    -- before any row exists for this user (shouldn't happen in practice —
    -- LS always sends subscription_created first — but keeps the insert
    -- branch well-defined rather than inserting a literal NULL plan).
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

-- REVOKE is idempotent to re-run; kept for safety in case 025 wasn't applied
-- in an environment that already had a broader default grant.
REVOKE EXECUTE ON FUNCTION public.upsert_subscription_if_newer
  (uuid, text, text, text, timestamptz, text, text, text, timestamptz) FROM anon;
