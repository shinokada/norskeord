-- Remove the unused target_level column from user_settings.
-- profiles.target_level is the source of truth going forward.
ALTER TABLE public.user_settings DROP COLUMN target_level;