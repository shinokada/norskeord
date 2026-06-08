-- Migration: merge C1 and C2 into a single C level
-- CEFRLevel is now 'A1' | 'A2' | 'B1' | 'B2' | 'C' (no separate C1/C2).
-- card_progress.level and grammar_progress.cefr are plain text with no CHECK
-- constraint, so the UPDATE is safe without dropping anything.
-- profiles.target_level has a CHECK constraint that includes 'C1' and 'C2' —
-- we drop and recreate it to include 'C' instead.

-- 1. Update any existing card_progress rows (no real users yet, but for correctness)
UPDATE public.card_progress
SET level = 'C'
WHERE level IN ('C1', 'C2');

-- 2. Update any existing grammar_progress rows
UPDATE public.grammar_progress
SET cefr = 'C'
WHERE cefr IN ('C1', 'C2');

-- 3. Update profiles.target_level CHECK constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_target_level_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_target_level_check
  CHECK (target_level = ANY (ARRAY['A1','A2','B1','B2','C']));

-- 4. Update any existing profiles rows that have target_level C1 or C2
UPDATE public.profiles
SET target_level = 'C'
WHERE target_level IN ('C1', 'C2');

-- 5. Update email_subscribers.level CHECK constraint
ALTER TABLE public.email_subscribers
  DROP CONSTRAINT IF EXISTS email_subscribers_level_check;

ALTER TABLE public.email_subscribers
  ADD CONSTRAINT email_subscribers_level_check
  CHECK (level = ANY (ARRAY['A1','A2','B1','B2','C']));

-- 6. Update any existing email_subscribers rows
UPDATE public.email_subscribers
SET level = 'C'
WHERE level IN ('C1', 'C2');
