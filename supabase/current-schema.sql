-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.card_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  norsk text NOT NULL,
  level text NOT NULL,
  category text NOT NULL,
  due timestamp with time zone NOT NULL DEFAULT now(),
  stability numeric NOT NULL DEFAULT 0,
  difficulty numeric NOT NULL DEFAULT 0,
  elapsed_days integer NOT NULL DEFAULT 0,
  scheduled_days integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  state integer NOT NULL DEFAULT 0,
  last_review timestamp with time zone,
  seen_count integer NOT NULL DEFAULT 1,
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  learning_steps integer NOT NULL DEFAULT 0,
  CONSTRAINT card_progress_pkey PRIMARY KEY (id),
  CONSTRAINT card_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  app_version text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id),
  CONSTRAINT contact_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.daily_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level_group text NOT NULL CHECK (level_group = ANY (ARRAY['A'::text, 'B'::text])),
  lesson_date date NOT NULL,
  focus_topic text NOT NULL,
  main_text text NOT NULL,
  vocabulary jsonb NOT NULL,
  exercises jsonb NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  generated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_lessons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.email_subscribers (
  user_id uuid NOT NULL,
  level text NOT NULL CHECK (level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text])),
  subscribed_at timestamp with time zone DEFAULT now(),
  active boolean DEFAULT true,
  CONSTRAINT email_subscribers_pkey PRIMARY KEY (user_id),
  CONSTRAINT email_subscribers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text,
  avatar_url text,
  target_level text DEFAULT 'B1'::text CHECK (target_level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text])),
  ui_language text DEFAULT 'en'::text CHECK (ui_language = ANY (ARRAY['en'::text, 'nb'::text])),
  card_direction text DEFAULT 'no_en'::text CHECK (card_direction = ANY (ARRAY['no_en'::text, 'en_no'::text, 'def_no'::text])),
  include_phrases boolean DEFAULT true,
  daily_reminder boolean DEFAULT false,
  email_lesson boolean DEFAULT false,
  ls_customer_id text,
  ls_subscription_id text,
  ls_status text,
  ls_renews_at timestamp with time zone,
  ls_ends_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  voice_speed numeric NOT NULL DEFAULT 1.0 CHECK (voice_speed = ANY (ARRAY[0.5, 0.75, 1.0, 1.25, 1.5])),
  voice_pitch numeric NOT NULL DEFAULT 1.0 CHECK (voice_pitch = ANY (ARRAY[0.7, 1.0, 1.3])),
  push_subscription jsonb,
  session_limit integer CHECK (session_limit IS NULL OR (session_limit = ANY (ARRAY[10, 20, 30, 50]))),
  quiz_limit integer CHECK (quiz_limit IS NULL OR (quiz_limit = ANY (ARRAY[5, 10, 15, 20]))),
  email_reminder boolean NOT NULL DEFAULT false,
  show_example boolean NOT NULL DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.study_days (
  user_id uuid NOT NULL,
  day date NOT NULL,
  cards integer NOT NULL DEFAULT 1,
  CONSTRAINT study_days_pkey PRIMARY KEY (user_id, day),
  CONSTRAINT study_days_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscriptions (
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free'::text CHECK (plan = ANY (ARRAY['free'::text, 'plus'::text])),
  billing_interval text CHECK (billing_interval = ANY (ARRAY['monthly'::text, 'annual'::text])),
  valid_until timestamp with time zone,
  lemon_squeezy_customer_id text,
  lemon_squeezy_subscription_id text,
  lemon_squeezy_order_id text,
  status text NOT NULL DEFAULT 'inactive'::text CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'inactive'::text, 'past_due'::text])),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (user_id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  fsrs_weights ARRAY,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- NOTE: Functions are not exported by Supabase's schema dump tool.
-- Manually maintained. See ./current-functions.sql for Functions