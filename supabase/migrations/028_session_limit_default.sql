-- Cards per flashcard session: NULL now means "All cards" and nothing else.
-- A profile that never chose gets 20 (the default), so "never set" and "All cards"
-- are no longer the same stored value.
--
-- Run this BEFORE deploying the code change: the new code reads NULL as All cards,
-- so un-migrated never-set profiles would suddenly show every card.
-- Old code with migrated data is fine (20 is an ordinary value).
--
-- Production count before this migration (2026-10-07): 89 NULL rows, 7 explicit.
-- The backfill cannot tell a deliberate "All cards" from never-set, so all NULLs become 20.

update public.profiles set session_limit = 20 where session_limit is null;

alter table public.profiles alter column session_limit set default 20;

comment on column public.profiles.session_limit is
  'Cards per flashcard session: 10/20/30/50, NULL = All cards. Default 20.';
