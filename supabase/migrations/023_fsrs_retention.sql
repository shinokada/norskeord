-- Migration 023: add fsrs_retention preset to profiles
-- Run this in Supabase Dashboard → SQL Editor, or via:
--   npx supabase db push
--
-- Adds a 3-preset FSRS request_retention control ("review intensity") so users can
-- trade off review frequency against retention without hand-editing per-rating
-- intervals. null means "use the default" (Standard / 0.90), same convention as
-- session_limit/quiz_limit.

alter table profiles
  add column if not exists fsrs_retention numeric
  check (fsrs_retention is null or fsrs_retention = any (array[0.80, 0.90, 0.95]));

comment on column profiles.fsrs_retention is
  'FSRS request_retention preset: 0.80 = Relaxed, 0.90 = Standard (default when null), '
  '0.95 = Intensive. Controls how far out flashcard/grammar reviews are scheduled — '
  'lower means fewer, longer-spaced reviews. Read by getFsrs() in src/lib/progress.ts.';
