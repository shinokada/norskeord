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
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text,
  avatar_url text,
  target_level text DEFAULT 'B1'::text CHECK (target_level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text])),
  ui_language text DEFAULT 'en'::text CHECK (ui_language = ANY (ARRAY['en'::text, 'nb'::text])),
  card_direction text DEFAULT 'no_en'::text CHECK (card_direction = ANY (ARRAY['no_en'::text, 'en_no'::text])),
  include_phrases boolean DEFAULT true,
  daily_reminder boolean DEFAULT false,
  email_lesson boolean DEFAULT false,
  ls_customer_id text,
  ls_subscription_id text,
  ls_status text,
  ls_renews_at timestamp with time zone,
  ls_ends_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
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
CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_pkey PRIMARY KEY (id)
);