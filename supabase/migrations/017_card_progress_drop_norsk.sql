-- Migration 017: drop legacy norsk column from card_progress
--
-- Run ONLY after:
--   1. Migration 016 has been applied.
--   2. The new progress.ts (vocab_id upsert path) has been deployed and running
--      without errors.
--   3. Verify no rows have vocab_id = NULL:
--        SELECT COUNT(*) FROM card_progress WHERE vocab_id IS NULL;
--      Should return 0 (you have no real users yet, so this will always be 0).
--
-- Run in: Supabase Dashboard → SQL Editor

-- Drop the old unique constraint
-- The constraint name varies by how Supabase created it.
-- Check with: \d card_progress  or look in Dashboard → Table Editor → Constraints.
-- Common names: card_progress_user_id_norsk_key  or  card_progress_norsk_key
ALTER TABLE public.card_progress
  DROP CONSTRAINT IF EXISTS card_progress_user_id_norsk_key;

-- Drop the column
ALTER TABLE public.card_progress
  DROP COLUMN IF EXISTS norsk;
