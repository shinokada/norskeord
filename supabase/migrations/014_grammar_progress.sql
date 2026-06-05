-- Migration: add grammar_progress table
-- Stores FSRS spaced-repetition state for the Grammar feature, one row per
-- (user, grammar question). Kept separate from card_progress so grammar review
-- data never pollutes the vocab category/level stats and can be tuned (FSRS
-- weights) independently later. Mirrors the card_progress FSRS column layout.

create table if not exists public.grammar_progress (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  question_id      text not null,           -- GrammarQuestion.id, e.g. 'gq-ikke-001'
  topic            text not null,           -- GrammarTopic, e.g. 'ikke-placement'
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

alter table public.grammar_progress enable row level security;

create policy "Users can manage their own grammar progress"
  on public.grammar_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
