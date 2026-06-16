-- Migration 018: add onboarding profile fields
--
-- Adds columns to support the user onboarding slide flow:
--   - native_language:       ISO 639-1 code for the user's mother tongue (e.g. 'ja', 'en')
--   - other_languages:       array of ISO 639-1 codes for other languages the user speaks
--   - country:               ISO 3166-1 alpha-2 code for the user's country (e.g. 'NO', 'JP')
--   - study_goals:           array of goals from ['vocab','grammar','speaking','listening','writing']
--   - onboarding_done:       true once the user completes the final slide or fills all fields via /my-profile
--   - onboarding_snoozed_at: set to now() when the user closes the slide via ×; switches to red dot nudge mode
--
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS native_language       text,
  ADD COLUMN IF NOT EXISTS other_languages       text[],
  ADD COLUMN IF NOT EXISTS country               text,
  ADD COLUMN IF NOT EXISTS study_goals           text[],
  ADD COLUMN IF NOT EXISTS onboarding_done       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_snoozed_at timestamp with time zone;
