-- Migration 016: replace norsk lookup key with stable vocab_id in card_progress
--
-- Strategy:
--   1. Add nullable vocab_id column.
--   2. Add partial unique index on (user_id, vocab_id) WHERE vocab_id IS NOT NULL.
--      This is the conflict target for the new upsert path.
--   3. Keep norsk column + its old unique constraint for now (safe rollback window).
--      Drop norsk in migration 017 once the new code has been running cleanly.
--
-- Run in: Supabase Dashboard → SQL Editor

-- 1. Add the new column
ALTER TABLE public.card_progress
  ADD COLUMN IF NOT EXISTS vocab_id text;

-- 2. Unique index for the new upsert onConflict: 'user_id,vocab_id'
--    Partial (WHERE vocab_id IS NOT NULL) so legacy null rows don't conflict.
CREATE UNIQUE INDEX IF NOT EXISTS card_progress_user_vocab_id_key
  ON public.card_progress (user_id, vocab_id)
  WHERE vocab_id IS NOT NULL;

-- norsk + its constraint are left in place until migration 017.
