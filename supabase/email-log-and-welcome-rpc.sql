-- Run this once in the Supabase SQL Editor.
-- Part of the welcome-sequence email feature.
--
-- 1. Creates email_log table to prevent duplicate sends.
-- 2. Creates get_welcome_sequence_candidates() RPC so the cron
--    job can read auth.users (not directly queryable via JS client).

-- ── Table ─────────────────────────────────────────────────────────────────────

create table if not exists public.email_log (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  email_type text        not null,
  sent_at    timestamptz not null default now(),

  unique (user_id, email_type)
);

create index if not exists email_log_user_type_idx
  on public.email_log (user_id, email_type);

alter table public.email_log enable row level security;

-- Block all JWT-authenticated access; service role bypasses RLS.
create policy "Service role only"
  on public.email_log
  for all
  using (false);

-- ── RPC: get_welcome_sequence_candidates ──────────────────────────────────────
-- Returns confirmed users created 23–25 hours ago who have not yet
-- received a welcome_sequence email.
-- SECURITY DEFINER so it can read auth.users regardless of caller's role.

create or replace function get_welcome_sequence_candidates()
returns table (id uuid, email text, created_at timestamptz)
language sql
security definer
as $$
  select u.id, u.email, u.created_at
  from auth.users u
  where u.created_at >= now() - interval '25 hours'
    and u.created_at <= now() - interval '23 hours'
    and u.email_confirmed_at is not null   -- only confirmed users
    and u.email is not null
    and not exists (
      select 1 from public.email_log el
      where el.user_id = u.id
        and el.email_type = 'welcome_sequence'
    );
$$;
