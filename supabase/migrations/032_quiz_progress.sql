-- Migration: add quiz_progress table
-- Lightweight per-word quiz statistics (attempts and correct answers), one row per
-- (user, vocab entry). Deliberately NOT an FSRS state: the quiz has no schedule of
-- its own, and fill-in / type-the-answer answers still feed card_progress.
-- Powers the Quiz tab on /my-progress (ai-docs/implementation/quiz-progress.md).
--
-- vocab_id is VocabEntry.id (the same stable key as card_progress.vocab_id). No level or
-- category is stored: the app resolves them live from the entry id, so moved entries
-- stay correct.

create table if not exists public.quiz_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  vocab_id      text not null,
  attempts      int not null default 0,
  correct       int not null default 0,
  last_attempt  timestamptz not null default now(),
  unique (user_id, vocab_id),
  check (attempts >= 0 and correct >= 0 and correct <= attempts)
);

alter table public.quiz_progress enable row level security;

create policy "Users can manage their own quiz progress"
  on public.quiz_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
