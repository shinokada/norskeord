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
