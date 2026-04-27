alter table user_settings enable row level security;

create policy "Users can read own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can upsert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);