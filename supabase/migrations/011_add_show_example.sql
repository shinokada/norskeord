-- Migration 011: add show_example column to profiles
-- Run this in Supabase Dashboard → SQL Editor, or via:
--   npx supabase db push
--
-- Adds show_example boolean that controls whether the example sentence
-- translation is shown by default on flashcard pages. Syncs the
-- localStorage preference across devices for logged-in users.

alter table profiles
  add column if not exists show_example boolean not null default false;

comment on column profiles.show_example is
  'When true, the example translation is shown by default on flashcard pages. '
  'Syncs across devices for logged-in users. Overrides the localStorage default '
  'on initial load; the inline toggle remains available per-card.';
