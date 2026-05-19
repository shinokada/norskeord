-- Migration 006: Create upsert_study_day RPC function
-- This function was defined in schema.sql but never added as a migration.
-- Run in Supabase Dashboard → SQL Editor.
--
-- Increments the card count for a given user/day, inserting if absent.
-- Called from the client via supabase.rpc() in recordStudyDay() (progress.ts)
-- to avoid a read-modify-write race condition.
-- Uses security definer so RLS on study_days doesn't block the upsert.

create or replace function upsert_study_day(p_user_id uuid, p_day date)
returns void
language sql
security definer
as $$
  insert into study_days (user_id, day, cards)
  values (p_user_id, p_day, 1)
  on conflict (user_id, day)
  do update set cards = study_days.cards + 1;
$$;
