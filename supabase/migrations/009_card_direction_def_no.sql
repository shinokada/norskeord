-- Migration 009: Add 'def_no' to profiles.card_direction check constraint
-- Run in Supabase SQL editor before deploying definition-mode code.
--
-- The card_direction column was created with an inline unnamed CHECK constraint,
-- so Postgres auto-named it. Before running, verify the actual constraint name with:
--
--   SELECT conname
--   FROM pg_constraint
--   WHERE conrelid = 'public.profiles'::regclass
--     AND contype = 'c'
--     AND pg_get_constraintdef(oid) LIKE '%card_direction%';
--
-- Expected result: profiles_card_direction_check
-- If different, replace the name in the DROP/ADD statements below.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_card_direction_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_card_direction_check
  CHECK (card_direction = ANY (ARRAY['no_en'::text, 'en_no'::text, 'def_no'::text]));
