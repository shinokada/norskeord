-- ── card_progress ──────────────────────────────────────────────────────────────
-- Mirrors the ts-fsrs Card type. One row per (user, norsk word).
create table if not exists card_progress (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  norsk            text not null,
  level            text not null,
  category         text not null,
  -- FSRS Card fields
  due              timestamptz not null default now(),
  stability        numeric not null default 0,
  difficulty       numeric not null default 0,
  elapsed_days     int not null default 0,
  scheduled_days   int not null default 0,
  learning_steps   int not null default 0,
  reps             int not null default 0,
  lapses           int not null default 0,
  state            int not null default 0,  -- 0=New 1=Learning 2=Review 3=Relearning
  last_review      timestamptz,
  -- App metadata
  seen_count       int not null default 1,
  last_seen        timestamptz not null default now(),
  unique (user_id, norsk)
);

alter table card_progress enable row level security;

create policy "Users can manage their own progress"
  on card_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── subscriptions ───────────────────────────────────────────────────────────────
-- Tracks plan per user. Populated by Lemon Squeezy webhooks (Phase 3).
create table if not exists subscriptions (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  plan             text not null default 'free' check (plan in ('free', 'pro')),
  billing_interval text check (billing_interval in ('monthly', 'annual')),
  valid_until      timestamptz
);

alter table subscriptions enable row level security;

create policy "Users can read their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Service role (used by webhook handler) can insert/update subscriptions.
-- No RLS policy needed for that — the webhook uses the service role key server-side.

-- ── study_days ─────────────────────────────────────────────────────────────────
-- One row per (user, calendar date). Upserted by saveProgress for Plus users.
-- Free users compute streaks client-side from localStorage.
create table if not exists study_days (
  user_id   uuid references auth.users(id) on delete cascade not null,
  day       date not null,
  cards     int not null default 1,
  primary key (user_id, day)
);

alter table study_days enable row level security;

create policy "Users manage own study days"
  on study_days for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── profiles.push_subscription ─────────────────────────────────────────────────
-- Web Push subscription JSON stored per Plus user.
-- Written by POST /api/push/subscribe, deleted on unsubscribe.
alter table profiles add column if not exists push_subscription jsonb default null;

-- ── upsert_study_day RPC ───────────────────────────────────────────────────────
-- Increments the card count for a given user/day, inserting if absent.
-- Called from the client via supabase.rpc() to avoid a read-modify-write race.
create or replace function upsert_study_day(p_user_id uuid, p_day date)
returns void
language sql
security definer
as $
  insert into study_days (user_id, day, cards)
  values (p_user_id, p_day, 1)
  on conflict (user_id, day)
  do update set cards = study_days.cards + 1;
$;

-- ── grammar_progress ───────────────────────────────────────────────────────────
-- FSRS state for the Grammar feature. One row per (user, grammar question).
-- Separate from card_progress so grammar reviews never pollute vocab stats.
create table if not exists grammar_progress (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  question_id      text not null,           -- GrammarQuestion.id, e.g. 'gq-ikke-001'
  topic            text not null,           -- GrammarTopic
  cefr             text not null,           -- CEFR level of the question
  -- FSRS Card fields
  due              timestamptz not null default now(),
  stability        numeric not null default 0,
  difficulty       numeric not null default 0,
  elapsed_days     int not null default 0,
  scheduled_days   int not null default 0,
  learning_steps   int not null default 0,
  reps             int not null default 0,
  lapses           int not null default 0,
  state            int not null default 0,  -- 0=New 1=Learning 2=Review 3=Relearning
  last_review      timestamptz,
  -- App metadata
  seen_count       int not null default 1,
  last_seen        timestamptz not null default now(),
  unique (user_id, question_id)
);

alter table grammar_progress enable row level security;

create policy "Users can manage their own grammar progress"
  on grammar_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
