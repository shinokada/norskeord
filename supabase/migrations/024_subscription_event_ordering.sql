-- Migration 024: Add ls_event_at for stale-webhook guarding
-- Run in Supabase Dashboard → SQL Editor.
--
-- Lemon Squeezy webhook deliveries are at-least-once and not ordering-
-- guaranteed. This column stores the provider's own event timestamp
-- (attributes.updated_at) so writes can be guarded against being
-- overwritten by an older, out-of-order delivery.
--
-- Nullable, no default: existing rows have no known event time. The
-- upsert_subscription_if_newer RPC (migration 025) treats a NULL
-- ls_event_at as "always older", so the first webhook received after
-- this migration always applies and starts populating the column going
-- forward.

ALTER TABLE public.subscriptions
  ADD COLUMN ls_event_at timestamp with time zone;
