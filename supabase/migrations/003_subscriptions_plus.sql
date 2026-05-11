-- Migration 003: Add Lemon Squeezy columns + fix plan constraint for Phase 3-B
-- Run in Supabase SQL editor before deploying Phase 3-B code.

-- 1. The subscriptions table was created with plan check ('free','pro').
--    The app already uses 'plus', so this is likely already fixed by
--    fix-subscriptions-plan.sql — but we re-apply defensively.
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('free', 'plus'));

-- 2. Lemon Squeezy IDs — needed by the webhook handler to avoid duplicate subs.
alter table public.subscriptions
  add column if not exists lemon_squeezy_customer_id text,
  add column if not exists lemon_squeezy_subscription_id text,
  add column if not exists lemon_squeezy_order_id text;

-- 3. Status field — tracks subscription lifecycle independent of plan.
--    'inactive' = free user, never purchased
--    'active'   = paid and current
--    'cancelled' = user cancelled; access continues until valid_until
--    'expired'  = valid_until passed; plan should be 'free'
--    'past_due' = payment failed
alter table public.subscriptions
  add column if not exists status text not null default 'inactive'
    check (status in ('active', 'cancelled', 'expired', 'inactive', 'past_due'));
