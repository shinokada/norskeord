-- Migration: rename target_level → current_level in profiles
--
-- Rationale: the column was originally named target_level (the level you're
-- aiming for), but onboarding slide 4 asks "What's your Norwegian level?"
-- which users interpret as their *current* level. The rename aligns the
-- column name with its actual meaning without adding a new field.
--
-- The column value semantics are unchanged — it still stores a CEFR level
-- chosen by the user from A1 | A2 | B1 | B2 | C.

ALTER TABLE public.profiles
  RENAME COLUMN target_level TO current_level;
