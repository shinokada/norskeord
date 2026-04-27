create table if not exists user_settings (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  fsrs_weights numeric[] default null,
  updated_at   timestamptz default now()
);
