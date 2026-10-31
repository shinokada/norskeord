-- Migration: add cloze_progress table
-- Per-word statistics for the Sentences (typed cloze) quiz: attempts and correct answers,
-- one row per (user, vocab entry). Same shape, check constraint and RLS as quiz_progress
-- (migration 032), in a table of its own so the Words stats and their
-- unique key (user_id, vocab_id) are untouched. Not an FSRS state: the typed answers still
-- feed card_progress through saveProgress(); these counts only power the per-category bars
-- on /my-progress (ai-docs/implementation/cloze-quiz.md, Phase 3).
--
-- vocab_id is VocabEntry.id (the same stable key as card_progress.vocab_id). No level or
-- category is stored: the app resolves them live from the entry id, so moved entries
-- stay correct.

create table if not exists public.cloze_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  vocab_id      text not null,
  attempts      int not null default 0,
  correct       int not null default 0,
  last_attempt  timestamptz not null default now(),
  unique (user_id, vocab_id),
  check (attempts >= 0 and correct >= 0 and correct <= attempts)
);

alter table public.cloze_progress enable row level security;

create policy "Users can manage their own cloze progress"
  on public.cloze_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
