-- Migration 010: add email_reminder column to profiles
-- Run this in Supabase Dashboard → SQL Editor, or via:
--   npx supabase db push
--
-- Adds the email_reminder boolean used by the send-push-reminders Edge
-- Function to also deliver a daily email nudge to Plus users who have
-- not studied that day. Independent of the push reminder toggle
-- (daily_reminder) — users can enable either, both, or neither.

alter table profiles
  add column if not exists email_reminder boolean not null default false;

comment on column profiles.email_reminder is
  'When true, the user receives a daily email at 19:00 UTC if they have '
  'not studied that day. Plus only. Set via PATCH /api/profile/email-reminder.';
