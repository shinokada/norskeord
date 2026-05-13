create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  target_level text check (target_level in ('A1','A2','B1','B2','C1','C2')) default 'B1',
  ui_language text check (ui_language in ('en','nb')) default 'en',
  card_direction text check (card_direction in ('no_en','en_no')) default 'no_en',
  include_phrases boolean default true,
  daily_reminder boolean default false,
  email_lesson boolean default false,
  -- Lemon Squeezy subscription fields (written by webhook, read-only from client)
  ls_customer_id text,
  ls_subscription_id text,
  ls_status text,          -- 'active' | 'paused' | 'cancelled' | 'expired' | null
  ls_renews_at timestamptz,
  ls_ends_at timestamptz,
  updated_at timestamptz default now()
);

-- RLS: users can only read/update their own row
alter table profiles enable row level security;
create policy "own profile" on profiles
  for all using (auth.uid() = id);