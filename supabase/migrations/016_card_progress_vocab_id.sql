-- Migration 016: replace norsk lookup key with stable vocab_id in card_progress
--
-- PostgREST (Supabase) requires onConflict to reference a full unique constraint
-- or non-partial unique index — partial indexes (WHERE ...) are not supported.
-- So we make vocab_id NOT NULL immediately (zero real users, no existing rows)
-- and add a plain unique constraint on (user_id, vocab_id).
--
-- Run in: Supabase Dashboard → SQL Editor

-- 1. Add vocab_id as NOT NULL (safe: table is empty / no real users)
ALTER TABLE public.card_progress
  ADD COLUMN IF NOT EXISTS vocab_id text NOT NULL DEFAULT '';

-- 2. Remove the temporary DEFAULT now that the column exists
--    (new rows must always supply vocab_id explicitly)
ALTER TABLE public.card_progress
  ALTER COLUMN vocab_id DROP DEFAULT;

-- 3. Standard unique constraint — this is what onConflict: 'user_id,vocab_id' targets
ALTER TABLE public.card_progress
  ADD CONSTRAINT card_progress_user_vocab_id_key UNIQUE (user_id, vocab_id);

-- norsk + its constraint are left in place until migration 017.
