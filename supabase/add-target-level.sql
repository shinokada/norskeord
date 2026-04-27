-- Add target_level to user_settings.
-- Used by the pace forecast on /stats and set from the profile page (Phase 4).
alter table user_settings
  add column if not exists target_level text
  check (target_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));
