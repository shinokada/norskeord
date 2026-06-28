-- Migration 022: Add German language support
--
-- 1. Extend ui_language check constraint to allow 'de' (already added to the
--    app code and paraglide config in the preceding change set).
-- 2. Extend flashcard_language check constraint to allow 'german'.
--
-- Run in the Supabase SQL editor or via `supabase db push`.

-- 1. ui_language — add 'de'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_ui_language_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_ui_language_check
  CHECK (ui_language = ANY (ARRAY['en'::text, 'nb'::text, 'es'::text, 'uk'::text, 'de'::text]));

-- 2. flashcard_language — add 'german'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_flashcard_language_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_flashcard_language_check
  CHECK (flashcard_language = ANY (ARRAY['english'::text, 'spanish'::text, 'ukrainian'::text, 'german'::text]));
