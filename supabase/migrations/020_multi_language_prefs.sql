-- Migration 020: Generalize language preferences for multi-language support
--
-- 1. Widen ui_language to accept the new interface locales (es, uk).
-- 2. Add flashcard_language — previously this lived only in localStorage
--    (`languageStore`), so Plus users' choice never synced cross-device
--    like every other preference does. As of the onboarding revision in
--    ai-docs/implementation/new-languages.md §13, it's set as a side effect
--    of the UI-language choice on slide 1, not via a separate question.
-- 3. Generalize card_direction from English-specific values (no_en/en_no/def_no)
--    to language-agnostic ones (l1_l2/l2_l1/def_l1): l1 is always Norwegian,
--    l2 is whatever flashcard_language is set to.
-- 4. Drop native_language, other_languages, and country (added in migration
--    018) — no longer collected anywhere in the app (see decision 9 in
--    ai-docs/implementation/new-languages.md). Dropped outright rather than
--    left unused, since there are no users/rows yet to lose data for.
--
-- IMPORTANT — deployment ordering: this migration must land together with
-- the matching app-code changes in ai-docs/implementation/new-languages.md
-- (§1–§13), not before them. Until that code ships, the live Preferences
-- form still submits the old card_direction values (no_en/en_no/def_no) and
-- OnboardingFieldsSection.svelte still reads/writes native_language — both
-- will start failing the moment this migration runs.
--
-- Verify constraint names before running (see migration 009 for the lookup query):
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'public.profiles'::regclass AND contype = 'c';

-- 1. ui_language
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_ui_language_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_ui_language_check
  CHECK (ui_language = ANY (ARRAY['en'::text, 'nb'::text, 'es'::text, 'uk'::text]));

-- 2. flashcard_language (new column — NOT NULL DEFAULT backfills existing rows,
--    since English was the only option before this migration anyway)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS flashcard_language text NOT NULL DEFAULT 'english';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_flashcard_language_check
  CHECK (flashcard_language = ANY (ARRAY['english'::text, 'spanish'::text, 'ukrainian'::text]));

-- 3. card_direction — drop the old constraint BEFORE migrating values
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_card_direction_check;

UPDATE public.profiles SET card_direction = 'l1_l2' WHERE card_direction = 'no_en';
UPDATE public.profiles SET card_direction = 'l2_l1' WHERE card_direction = 'en_no';
UPDATE public.profiles SET card_direction = 'def_l1' WHERE card_direction = 'def_no';

ALTER TABLE public.profiles
  ALTER COLUMN card_direction SET DEFAULT 'l1_l2';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_card_direction_check
  CHECK (card_direction = ANY (ARRAY['l1_l2'::text, 'l2_l1'::text, 'def_l1'::text]));

-- 4. Drop now-unused onboarding columns
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS native_language,
  DROP COLUMN IF EXISTS other_languages,
  DROP COLUMN IF EXISTS country;
