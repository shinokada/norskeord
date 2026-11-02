-- Migration 034: 30-day Plus trial (no card, started on demand)
-- Run in Supabase Dashboard → SQL Editor.
-- Plan: ai-docs/implementation/free-trial.md (norskeord-private)
--
-- A trial is a subscriptions row with plan = 'plus', status = 'trial' and a future
-- valid_until. hooks.server.ts and the 029 daily_lessons policy already grant Plus to
-- such a row, so nothing ends the trial except the date passing. No cron job is needed
-- for that.
--
-- upsert_subscription_if_newer (025/026) does not list trial_started_at, so a later
-- Lemon Squeezy event keeps it. The trial row has ls_event_at NULL, so the first real
-- webhook event always applies (a trial user who pays replaces the trial row).

-- 1. One trial per account.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;

-- 2. One row per email that has had a trial. No user_id and no foreign key, so a row
--    survives account deletion. email_key is a keyed hash (HMAC-SHA-256 with the server
--    secret TRIAL_CLAIM_SECRET) of the normalised email, never the address itself.
--    RLS is on and there is no policy: only the service role and the SECURITY DEFINER
--    function below can read or write it.
CREATE TABLE IF NOT EXISTS public.trial_claims (
  email_key  text PRIMARY KEY,
  claimed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trial_claims ENABLE ROW LEVEL SECURITY;

-- 3. Allow the new status value. The constraint name was confirmed on production
--    (select conname from pg_constraint ...): subscriptions_status_check.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'cancelled', 'expired', 'inactive', 'past_due', 'trial'));

-- 4. start_trial: returns the trial end, or NULL when the email or the account is not
--    allowed a trial. p_email_key is computed by the server (src/lib/server/trial-email.ts).
--    The claim is made first and is given back if the account itself is not eligible.
--    The account guard mirrors hooks.server.ts: never had a trial, never paid, and not
--    Plus right now (plan = 'plus' and status 'active' or a future valid_until).
--    SET search_path = '' prevents search_path injection (Supabase linter 0011).
CREATE OR REPLACE FUNCTION public.start_trial(
  p_user_id uuid,
  p_email_key text,
  p_days int DEFAULT 30
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ends timestamptz;
  v_claimed text;
BEGIN
  INSERT INTO public.trial_claims (email_key) VALUES (p_email_key)
  ON CONFLICT (email_key) DO NOTHING
  RETURNING email_key INTO v_claimed;
  IF v_claimed IS NULL THEN
    RETURN NULL;  -- this email already had a trial
  END IF;

  INSERT INTO public.subscriptions (user_id, plan, status, valid_until, trial_started_at)
  VALUES (p_user_id, 'plus', 'trial', now() + make_interval(days => p_days), now())
  ON CONFLICT (user_id) DO UPDATE SET
    plan = 'plus',
    status = 'trial',
    valid_until = now() + make_interval(days => p_days),
    trial_started_at = now()
  WHERE public.subscriptions.trial_started_at IS NULL            -- never had a trial
    AND public.subscriptions.lemon_squeezy_subscription_id IS NULL -- never paid
    AND NOT (public.subscriptions.plan = 'plus'                  -- not Plus right now
             AND (public.subscriptions.status = 'active'
                  OR coalesce(public.subscriptions.valid_until > now(), false)))
  RETURNING valid_until INTO v_ends;

  IF v_ends IS NULL THEN
    -- the account is not eligible: give the claim back
    DELETE FROM public.trial_claims WHERE email_key = p_email_key;
  END IF;
  RETURN v_ends;
END;
$$;

-- Only the service-role API route calls this. It is SECURITY DEFINER and takes
-- p_user_id as a raw parameter with no ownership check.
REVOKE EXECUTE ON FUNCTION public.start_trial(uuid, text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_trial(uuid, text, int) TO service_role;

-- 5. Cleanup job (decision 10: claims are kept for 12 months). Not created here: add it
--    in Dashboard → Integrations → Cron, as for cleanup-unconfirmed-users. See
--    current-functions.sql.
--      Name:     cleanup-trial-claims
--      Schedule: 0 4 1 * *
--      Command:  DELETE FROM public.trial_claims WHERE claimed_at < now() - interval '12 months';

-- ── Manual verification (run by hand with TEST users, never real subscribers) ──────────
-- Use two throwaway rows in auth.users (subscriptions.user_id has a foreign key).
-- Replace <user-a> and <user-b>. Run as the postgres role in the SQL editor.
--
-- 1. New user gets a trial (returns a timestamp ~30 days ahead):
--    select public.start_trial('<user-a>'::uuid, 'test-key-1');
-- 2. Same user, same key again returns NULL:
--    select public.start_trial('<user-a>'::uuid, 'test-key-1');
-- 3. Another account with the same key returns NULL and changes nothing:
--    select public.start_trial('<user-b>'::uuid, 'test-key-1');
--    select * from public.subscriptions where user_id = '<user-b>';   -- no row
-- 4. Delete user-a's subscriptions row, call again with the same key: still NULL.
--    delete from public.subscriptions where user_id = '<user-a>';
--    select public.start_trial('<user-a>'::uuid, 'test-key-1');
-- 5. Ineligible account leaves no claim. The insert below gives user-b a Lemon Squeezy id
--    ('test-sub'); user-b has no subscriptions row yet, so the insert creates it:
--    insert into public.subscriptions (user_id, plan, status, lemon_squeezy_subscription_id)
--      values ('<user-b>', 'free', 'expired', 'test-sub');
--    select public.start_trial('<user-b>'::uuid, 'test-key-2');       -- NULL
--    select * from public.trial_claims where email_key = 'test-key-2'; -- no row
-- 6. An active Plus row returns NULL:
--    update public.subscriptions set lemon_squeezy_subscription_id = null,
--      plan = 'plus', status = 'active' where user_id = '<user-b>';
--    select public.start_trial('<user-b>'::uuid, 'test-key-3');       -- NULL
-- 7. A Plus row with a past valid_until, no Lemon Squeezy id and no trial gets a trial:
--    update public.subscriptions set status = 'cancelled', valid_until = now() - interval '1 day'
--      where user_id = '<user-b>';
--    select public.start_trial('<user-b>'::uuid, 'test-key-4');       -- timestamp
-- 8. Clean up:
--    delete from public.subscriptions where user_id in ('<user-a>', '<user-b>');
--    delete from public.trial_claims where email_key like 'test-key-%';
