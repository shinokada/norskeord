-- Migration: add push_subscription column to profiles
-- Run this in Supabase Dashboard → SQL Editor, or via:
--   npx supabase db push
--
-- Adds the push_subscription jsonb column used by the send-push-reminders
-- Edge Function to deliver Web Push notifications to Plus users.

alter table profiles
  add column if not exists push_subscription jsonb default null;

comment on column profiles.push_subscription is
  'Web Push subscription object (endpoint + keys) for Plus users. '
  'Written by POST /api/push/subscribe. Cleared on unsubscribe or '
  'when the push endpoint returns 410 Gone.';
